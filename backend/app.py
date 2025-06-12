from flask import Flask, request, jsonify
import torch
import cv2
import numpy as np
import networkx as nx
from torchvision import transforms
import segmentation_models_pytorch as smp
from flask_cors import CORS
import base64
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Model yükleme
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = smp.Unet("resnet34", encoder_weights=None, classes=1, activation="sigmoid")
model.load_state_dict(torch.load("unet_model2.pth", map_location=device))
model.to(device).eval()

def process_image(image_data):
    # Base64'ten image'a çevirme
    image = Image.open(io.BytesIO(base64.b64decode(image_data.split(',')[1])))
    image_np = np.array(image)
    
    # Görüntü işleme
    image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    orig_h, orig_w = image_bgr.shape[:2]
    
    # Padding
    padded = cv2.copyMakeBorder(image_bgr, 
                               0, ((orig_h + 31)//32)*32 - orig_h,
                               0, ((orig_w + 31)//32)*32 - orig_w, 
                               cv2.BORDER_CONSTANT)
    
    # Model için tensor dönüşümü
    tensor = transforms.ToTensor()(padded).unsqueeze(0).to(device)
    
    with torch.no_grad():
        output = model(tensor)
        mask_prob = output.squeeze().cpu().numpy()
        road_mask = (mask_prob > 0.5).astype(np.uint8)[:orig_h, :orig_w]
    
    return road_mask

def calculate_route(road_mask, start_point, end_point):
    # Graf oluşturma
    G = nx.Graph()
    
    # Yol piksellerini grafa ekleme
    h, w = road_mask.shape
    for y in range(h):
        for x in range(w):
            if road_mask[y, x] == 1:
                G.add_node((x, y))
                # 8-komşuluk bağlantıları
                for dx, dy in [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]:
                    nx_, ny_ = x + dx, y + dy
                    if 0 <= nx_ < w and 0 <= ny_ < h and road_mask[ny_, nx_] == 1:
                        G.add_edge((x, y), (nx_, ny_))
    
    try:
        # En kısa yol hesaplama
        path = nx.shortest_path(G, 
                              source=(int(start_point['x']), int(start_point['y'])),
                              target=(int(end_point['x']), int(end_point['y'])))
        return path
    except nx.NetworkXNoPath:
        return None

@app.route('/api/satellite-route/calculate', methods=['POST'])
def calculate_satellite_route():
    try:
        data = request.json
        image_data = data['image']
        start_point = data['startPoint']
        end_point = data['endPoint']
        
        # Görüntü işleme
        road_mask = process_image(image_data)
        
        # Rota hesaplama
        route = calculate_route(road_mask, start_point, end_point)
        
        if route is None:
            return jsonify({'error': 'No valid route found'}), 400
            
        return jsonify({
            'route': [{'x': x, 'y': y} for x, y in route],
            'mask': road_mask.tolist()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 