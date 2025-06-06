from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import torch
import numpy as np
import networkx as nx
import rasterio
from PIL import Image
import io
import base64
from torchvision import transforms
from skimage.morphology import skeletonize
import segmentation_models_pytorch as smp

app = Flask(__name__)
CORS(app)

# ------------------ Model Yükleme ------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = smp.Unet("resnet34", encoder_weights=None, classes=1, activation="sigmoid")
model.load_state_dict(torch.load("unet_model2.pth", map_location=device))
model.to(device).eval()

def process_image(image_array):
    """Görüntüyü işle ve yol maskesi oluştur"""
    orig_h, orig_w = image_array.shape[:2]
    padded = cv2.copyMakeBorder(image_array, 
                               0, ((orig_h + 31)//32)*32 - orig_h,
                               0, ((orig_w + 31)//32)*32 - orig_w, 
                               cv2.BORDER_CONSTANT)
    
    tensor = transforms.ToTensor()(padded).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(tensor)
        mask_prob = output.squeeze().cpu().numpy()
        road_mask = (mask_prob > 0.5).astype(np.uint8)[:orig_h, :orig_w]
    return road_mask

def create_graph(road_mask, dsm=None):
    """Yol maskesinden graph oluştur"""
    skeleton = skeletonize(road_mask).astype(np.uint8)
    G = nx.Graph()
    
    # Eğer DSM varsa eğim hesapla
    if dsm is not None:
        gy, gx = np.gradient(dsm.astype(np.float32))
        slope = np.sqrt(gx ** 2 + gy ** 2) * road_mask
    else:
        slope = np.zeros_like(road_mask)

    offsets = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    h, w = road_mask.shape
    
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if skeleton[y, x] == 1:
                G.add_node((x, y))
                for dx, dy in offsets:
                    nx_, ny_ = x + dx, y + dy
                    if skeleton[ny_, nx_] == 1:
                        weight = 1 + slope[ny_, nx_]
                        G.add_edge((x, y), (nx_, ny_), weight=weight)
    
    # En büyük bağlı bileşeni al
    largest = max(nx.connected_components(G), key=len)
    return G.subgraph(largest).copy()

def get_direction(dx, dy):
    """İki nokta arasındaki yönü belirle"""
    if abs(dx) > abs(dy):
        return "Right" if dx > 0 else "Left"
    else:
        return "Down" if dy > 0 else "Up"

@app.route('/api/process-image', methods=['POST'])
def process_rgb_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        
        # Görüntüyü oku
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        
        # Yol maskesi oluştur
        road_mask = process_image(image_rgb)
        
        # Base64'e dönüştür
        _, buffer = cv2.imencode('.png', (road_mask * 255).astype(np.uint8))
        mask_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'mask': f'data:image/png;base64,{mask_base64}',
            'width': image_rgb.shape[1],
            'height': image_rgb.shape[0]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/calculate-route', methods=['POST'])
def calculate_route():
    try:
        data = request.get_json()
        
        if not all(key in data for key in ['image', 'mask', 'start', 'end']):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Base64 görüntüyü numpy dizisine dönüştür
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image_rgb = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Maskı decode et
        mask_data = data['mask'].split(',')[1]
        mask_bytes = base64.b64decode(mask_data)
        nparr = np.frombuffer(mask_bytes, np.uint8)
        road_mask = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE) > 0
        
        # Graph oluştur
        G = create_graph(road_mask)
        
        # Başlangıç ve bitiş noktalarını al
        start_point = (int(data['start']['x']), int(data['start']['y']))
        end_point = (int(data['end']['x']), int(data['end']['y']))
        
        # En yakın graph noktalarını bul
        start_node = min(G.nodes, key=lambda n: np.hypot(n[0] - start_point[0], n[1] - start_point[1]))
        end_node = min(G.nodes, key=lambda n: np.hypot(n[0] - end_point[0], n[1] - end_point[1]))
        
        # Yolu hesapla
        try:
            path = nx.shortest_path(G, source=start_node, target=end_node, weight="weight")
        except nx.NetworkXNoPath:
            return jsonify({'error': 'No valid path found'}), 404
            
        # Mesafeyi hesapla
        distance = sum(np.hypot(path[i][0] - path[i-1][0], path[i][1] - path[i-1][1]) 
                      for i in range(1, len(path)))
        
        # İlk yönü hesapla
        if len(path) >= 2:
            dx = path[1][0] - path[0][0]
            dy = path[1][1] - path[0][1]
            direction = get_direction(dx, dy)
        else:
            direction = "Arrived"
            
        # Yolu görselleştir
        path_img = image_rgb.copy()
        for i in range(1, len(path)):
            x1, y1 = path[i - 1]
            x2, y2 = path[i]
            cv2.line(path_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
        # Başlangıç ve bitiş noktalarını işaretle
        cv2.circle(path_img, start_node, 5, (255, 0, 0), -1)  # Kırmızı
        cv2.circle(path_img, end_node, 5, (0, 255, 255), -1)  # Sarı
        
        # Görüntüyü base64'e dönüştür
        _, buffer = cv2.imencode('.png', cv2.cvtColor(path_img, cv2.COLOR_RGB2BGR))
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'path': [{'x': x, 'y': y} for x, y in path],
            'distance': float(distance),
            'direction': direction,
            'displayImage': f'data:image/png;base64,{img_base64}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-dsm', methods=['POST'])
def process_dsm():
    try:
        if 'dsm' not in request.files or 'mask' not in request.files:
            return jsonify({'error': 'Missing DSM or mask file'}), 400

        # DSM dosyasını oku
        dsm_file = request.files['dsm']
        with rasterio.open(dsm_file) as ds:
            dsm = ds.read(1)
        
        # Maskı oku
        mask_file = request.files['mask']
        mask_bytes = mask_file.read()
        nparr = np.frombuffer(mask_bytes, np.uint8)
        road_mask = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE) > 0
        
        # DSM'i mask boyutuna yeniden boyutlandır
        dsm = cv2.resize(dsm, (road_mask.shape[1], road_mask.shape[0]), 
                        interpolation=cv2.INTER_NEAREST)
        
        # Eğim hesapla
        gy, gx = np.gradient(dsm.astype(np.float32))
        slope = np.sqrt(gx ** 2 + gy ** 2)
        slope *= road_mask
        
        # Eğim görüntüsünü normalize et ve görselleştir
        slope_normalized = ((slope - slope.min()) * 255 / 
                          (slope.max() - slope.min())).astype(np.uint8)
        
        # Base64'e dönüştür
        _, buffer = cv2.imencode('.png', slope_normalized)
        slope_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'slope': f'data:image/png;base64,{slope_base64}',
            'maxSlope': float(slope.max()),
            'minSlope': float(slope.min()),
            'avgSlope': float(slope.mean())
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 