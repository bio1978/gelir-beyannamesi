import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Belge analizi endpoint'i
app.post('/api/analyze-documents', upload.array('documents'), async (req, res) => {
  try {
    const files = req.files || [];
    const analysisResults = {
      gelirler: {},
      giderler: {},
      belgeler: [],
      toplam_gelir: 0,
      toplam_gider: 0,
      net_gelir: 0
    };

    // Her belgeyi analiz et
    for (const file of files) {
      let fileContent = '';

      // PDF mi yoksa text dosyası mı?
      if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        try {
          const pdfData = fs.readFileSync(file.path);
          const data = await pdfParse(pdfData);
          fileContent = data.text;
        } catch (pdfError) {
          console.error('PDF parsing hatası:', pdfError);
          fileContent = '';
        }
      } else {
        fileContent = fs.readFileSync(file.path, 'utf-8');
      }

      if (!fileContent) {
        console.warn(`Dosya okunamadı: ${file.originalname}`);
        continue;
      }

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `SADECE bu JSON'ı geri dön, başka hiçbir şey yazma:
{
  "harcama_turu": "",
  "vergi_kimlik_no": "",
  "tesebbus_unvani": "",
  "belge_turu": "",
  "belge_tarihi": "",
  "belge_seri_no": "",
  "tutar": 0
}

TALIMATLAR:
- Eğitim satırını bul
- Net Mal Hizmet Tutarı'nı bul (örn: 30.836,70)
- KDV Oranı'nı bul (örn: %10 = 0.10)
- Tutar = Net Mal Hizmet Tutarı × (1 + KDV Oranı)
- Örn: 30.836,70 × 1.10 = 33.920,37
- YEMEK satırını görmezden gel
- Tarihi DD-MM-YYYY formatından YYYY-MM-DD'ye çevir

Belge:
${fileContent.substring(0, 3000)}`
          }
        ]
      });

      // Claude'un yanıtını işle
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);

        // Belgeyi kaydet
        analysisResults.belgeler.push({
          dosya_adi: file.originalname,
          ...data
        });

        // Harcama türüne göre kategorize et
        if (['Maaş'].includes(data.harcama_turu)) {
          analysisResults.gelirler[data.harcama_turu] = (analysisResults.gelirler[data.harcama_turu] || 0) + data.tutar;
          analysisResults.toplam_gelir += data.tutar;
        } else {
          analysisResults.giderler[data.harcama_turu] = (analysisResults.giderler[data.harcama_turu] || 0) + data.tutar;
          analysisResults.toplam_gider += data.tutar;
        }
      }

      // Geçici dosyayı sil
      fs.unlinkSync(file.path);
    }

    analysisResults.net_gelir = analysisResults.toplam_gelir - analysisResults.toplam_gider;
    res.json(analysisResults);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Beyanname oluşturma endpoint'i
app.post('/api/generate-declaration', express.json(), async (req, res) => {
  try {
    const { gelirler, giderler, toplam_gelir, toplam_gider, net_gelir } = req.body;

    // Basit JSON yanıtı gönder
    const declaration = {
      oluşturma_tarihi: new Date().toLocaleDateString('tr-TR'),
      yil: new Date().getFullYear(),
      gelirler,
      giderler,
      toplam_gelir,
      toplam_gider,
      net_gelir,
      vergilendirilebilir_tutar: Math.max(0, net_gelir),
      not: 'Bu beyanname taslağıdır. Lütfen muhasebeciye kontrol ettirin.'
    };

    res.json(declaration);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint'i
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend çalışıyor' });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log('Belge yükleme: POST /api/analyze-documents');
  console.log('Beyanname oluştur: POST /api/generate-declaration');
});
