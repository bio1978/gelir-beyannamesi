import { useState } from 'react'
import './App.css'

function App() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    setFiles([...e.target.files])
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Lütfen en az bir belge seçin')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('documents', file)
      })

      const response = await fetch('http://localhost:5000/api/analyze-documents', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Belge analizi başarısız oldu')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError('Hata: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadDeclaration = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/generate-declaration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results)
      })

      if (!response.ok) {
        throw new Error('Beyanname oluşturma başarısız oldu')
      }

      const data = await response.json()
      const jsonStr = JSON.stringify(data, null, 2)
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr))
      element.setAttribute('download', 'beyanname.json')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (err) {
      setError('Hata: ' + err.message)
    }
  }

  const downloadTableAsExcel = () => {
    if (!results || !results.belgeler || results.belgeler.length === 0) {
      setError('Dışa aktarılacak belge yok')
      return
    }

    // CSV formatında oluştur
    const headers = ['Harcama Türü', 'Vergi Kimlik Numarası', 'Teşebbüs Unvanı', 'Belge Türü', 'Belge Tarihi', 'Belge Seri No', 'Tutar']

    const rows = results.belgeler.map(belge => [
      belge.harcama_turu,
      belge.vergi_kimlik_no,
      belge.tesebbus_unvani,
      belge.belge_turu,
      belge.belge_tarihi,
      belge.belge_seri_no,
      `${belge.tutar?.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} TL`
    ])

    // CSV oluştur
    let csv = headers.join('\t') + '\n'
    rows.forEach(row => {
      csv += row.join('\t') + '\n'
    })

    // Dosya olarak indir
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(csv))
    element.setAttribute('download', 'gib-belgeler.xlsx')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Gelir Beyannamesi Uygulaması</h1>
        <p>Belgelerinizi yükleyip otomatik beyanname oluşturun</p>
      </header>

      <main className="app-main">
        <section className="upload-section">
          <h2>Adım 1: Belgelerinizi Yükleyin</h2>
          <p>Maaş bordrosu, kira kontratı, sigorta poliçesi, sağlık faturası vb. belgelerinizi yükleyin.</p>

          <div className="file-input-wrapper">
            <input
              type="file"
              id="fileInput"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.txt,.doc,.docx"
            />
            <label htmlFor="fileInput" className="file-label">
              {files.length > 0 ? `${files.length} belge seçildi` : 'Belge seçmek için tıklayın'}
            </label>
          </div>

          {files.length > 0 && (
            <ul className="file-list">
              {Array.from(files).map((file, index) => (
                <li key={index}>📄 {file.name}</li>
              ))}
            </ul>
          )}

          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={loading || files.length === 0}
          >
            {loading ? 'Analiz ediliyor...' : 'Analiz Et'}
          </button>
        </section>

        {error && (
          <div className="error-box">
            ⚠️ {error}
          </div>
        )}

        {results && (
          <section className="results-section">
            <h2>Adım 2: Belgeler Tablosu</h2>

            {results.belgeler && results.belgeler.length > 0 && (
              <div className="belgeler-section">
                <table className="belgeler-table">
                  <thead>
                    <tr>
                      <th>Harcama Türü</th>
                      <th>Vergi Kimlik Numarası</th>
                      <th>Teşebbüs Unvanı</th>
                      <th>Belge Türü</th>
                      <th>Belge Tarihi</th>
                      <th>Belge Seri No</th>
                      <th>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.belgeler.map((belge, index) => (
                      <tr key={index}>
                        <td>{belge.harcama_turu}</td>
                        <td>{belge.vergi_kimlik_no}</td>
                        <td>{belge.tesebbus_unvani}</td>
                        <td>{belge.belge_turu}</td>
                        <td>{belge.belge_tarihi}</td>
                        <td>{belge.belge_seri_no}</td>
                        <td className="amount">₺ {belge.tutar?.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button className="btn btn-export" onClick={downloadTableAsExcel}>
                  📊 Tabloyu Excel'e Aktar
                </button>
              </div>
            )}

            <h2 style={{marginTop: '40px'}}>Adım 3: Beyanname Özeti</h2>

            <div className="results-grid">
              <div className="result-card">
                <h3>Gelirler</h3>
                {Object.entries(results.gelirler).map(([key, value]) => (
                  <div key={key} className="result-item">
                    <span>{key}:</span>
                    <span className="amount">₺ {value.toLocaleString('tr-TR')}</span>
                  </div>
                ))}
                <div className="result-total">
                  <strong>Toplam Gelir:</strong>
                  <strong className="amount">₺ {results.toplam_gelir.toLocaleString('tr-TR')}</strong>
                </div>
              </div>

              <div className="result-card">
                <h3>Giderler</h3>
                {Object.entries(results.giderler).map(([key, value]) => (
                  <div key={key} className="result-item">
                    <span>{key}:</span>
                    <span className="amount">₺ {value.toLocaleString('tr-TR')}</span>
                  </div>
                ))}
                <div className="result-total">
                  <strong>Toplam Gider:</strong>
                  <strong className="amount">₺ {results.toplam_gider.toLocaleString('tr-TR')}</strong>
                </div>
              </div>
            </div>

            <div className="net-income">
              <h3>Net Gelir (Vergilendirilebilir Gelir)</h3>
              <p className="net-amount">₺ {results.net_gelir.toLocaleString('tr-TR')}</p>
            </div>

            <button className="btn btn-success" onClick={downloadDeclaration}>
              📥 Beyannamemi İndir
            </button>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>⚠️ Bu uygulama taslak oluşturur. Lütfen muhasebeci veya vergi danışmanına kontrol ettirin.</p>
      </footer>
    </div>
  )
}

export default App
