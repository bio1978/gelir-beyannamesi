# 💰 Gelir Beyannamesi Hazırlama Uygulaması

Belgelerinizi yükleyip, yapay zeka ile otomatik olarak gelir beyannamesi hazırlamak için tasarlanmış bir web uygulaması.

## 🚀 Başlangıç

### Gereksinimler
- Node.js 16+
- npm
- ANTHROPIC_API_KEY (Claude API anahtarı)

### Kurulum

1. **Bağımlılıkları Yükleyin**
```bash
cd gelir-beyannamesi-app
npm install --workspace=frontend
npm install --workspace=backend
```

2. **API Anahtarını Ayarlayın**
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

3. **Backend'i Başlatın**
```bash
npm --workspace=backend run dev
```

Backend `http://localhost:5000` adresinde çalışır.

4. **Frontend'i Başlatın (Yeni Terminal)**
```bash
npm --workspace=frontend run dev
```

Frontend `http://localhost:5173` adresinde çalışır.

## 📋 Özellikler

### v1.0
- ✅ Belge yükleme (PDF, Text, Doc)
- ✅ Claude AI ile belge analizi
- ✅ Otomatik gelir/gider kategorisi
- ✅ Beyanname özeti
- ✅ JSON olarak indirme

### Desteklenen Gelir/Gider Türleri
**Gelirler:**
- Maaş

**Giderler:**
- Kira
- Sigorta
- Çocuk Okul
- Servis/Kırtasiye
- Sağlık

## 📁 Proje Yapısı

```
gelir-beyannamesi-app/
├── backend/              # Express.js sunucusu
│   ├── server.js        # Ana sunucu dosyası
│   └── package.json
├── frontend/            # React uygulaması
│   ├── src/
│   │   ├── App.jsx     # Ana uygulama bileşeni
│   │   ├── App.css     # Stiller
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### POST /api/analyze-documents
Belgeleri yükleme ve analiz etme.

**Request:**
```
Content-Type: multipart/form-data
Body: documents (file array)
```

**Response:**
```json
{
  "gelirler": {
    "Maaş": 50000
  },
  "giderler": {
    "Kira": 15000,
    "Sigorta": 1000
  },
  "toplam_gelir": 50000,
  "toplam_gider": 16000,
  "net_gelir": 34000
}
```

### POST /api/generate-declaration
Beyanname oluşturma ve indirme.

**Request:**
```json
{
  "gelirler": {...},
  "giderler": {...},
  "toplam_gelir": 50000,
  "toplam_gider": 16000,
  "net_gelir": 34000
}
```

**Response:** Beyanname JSON dosyası

## ⚠️ Önemli Notlar

- Bu uygulama **taslak oluşturur**
- Lütfen muhasebeci veya vergi danışmanına kontrol ettirin
- Veriler sadece tarayıcıda işlenir
- Claude API'sine gönderilen belgeler Anthropic tarafından işlenir

## 📈 Gelecek Özellikler (v2+)

- OCR teknolojisi
- Kullanıcı hesapları
- Veritabanı desteği
- E-Government bağlantısı
- Mobil uygulama
- PDF beyanname export

## 📧 İletişim

Sorularınız için açık bir issue açabilirsiniz.

---
**Made with ❤️ for Turkish taxpayers**
