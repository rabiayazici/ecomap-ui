# Satellite Route Planning Application

Bu uygulama, uydu görüntüleri üzerinde yol tespiti yaparak en uygun rotayı hesaplayan ve gerçek zamanlı navigasyon sağlayan bir web uygulamasıdır.

## Özellikler

- Uydu görüntüsü yükleme ve görüntüleme
- Yapay zeka ile yol tespiti (UNet modeli)
- Başlangıç ve hedef noktası seçimi
- Otomatik rota hesaplama (A* algoritması)
- Gerçek zamanlı navigasyon (ok tuşları ile kontrol)
- Yön ve mesafe bilgisi gösterimi

## Kurulum

### Backend (Python)

1. Python bağımlılıklarını yükleyin:
```bash
pip install -r requirements.txt
```

2. Flask uygulamasını başlatın:
```bash
python app.py
```

### Frontend (React)

1. Proje dizinine gidin:
```bash
cd ecomap-ui-main
```

2. Node.js bağımlılıklarını yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm start
```

## Kullanım

1. Web tarayıcınızda `http://localhost:3000` adresine gidin
2. "Upload Satellite Image" butonuna tıklayarak bir uydu görüntüsü yükleyin
3. Görüntü üzerinde tıklayarak başlangıç noktasını (kırmızı) belirleyin
4. İkinci kez tıklayarak hedef noktasını (sarı) belirleyin
5. Sistem otomatik olarak en uygun rotayı hesaplayacak ve yeşil çizgi ile gösterecektir
6. Ok tuşlarını kullanarak başlangıç noktasını hareket ettirebilirsiniz
7. Ekranın üst kısmında mevcut yön ve mesafe bilgisini görebilirsiniz

## Teknik Detaylar

- Backend: Python (Flask)
  - UNet modeli ile yol tespiti
  - NetworkX ile graf tabanlı rota hesaplama
  - OpenCV ile görüntü işleme
  - RESTful API

- Frontend: React
  - Canvas API ile görüntü manipülasyonu
  - Gerçek zamanlı kullanıcı etkileşimi
  - Responsive tasarım
  - Modern UI/UX

## Lisans

MIT
