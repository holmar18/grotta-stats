import { useState } from 'react';
import './PageStyles.css';
import './SettingsPage.css';

async function hashPin(pin) {
  const encoded = new TextEncoder().encode(pin + 'grotta-salt');
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const FEATURES = [
  {
    icon: '⚡',
    title: 'Nýr leikur',
    desc: 'Skráðu mótherja og dagsetningu. Ýttu á tölur til að skrá tölfræði á hvern leikmann. Notaðu +/− hnappinn til að skipta á milli. Vista leik þegar búið.',
  },
  {
    icon: '📋',
    title: 'Leikir',
    desc: 'Sjáðu alla liðna leiki. Ýttu á leik til að opna fulla tölfræði. Eyddu leik með 🗑 eða hlaðið niður sem PDF með 📄.',
  },
  {
    icon: '👥',
    title: 'Leikmenn',
    desc: 'Bættu við, breyttu eða fjarlægðu leikmenn. Ýttu á leikmann til að sjá heildar tölfræði, meðaltöl og leikjayfirlit. Hægt að hlaða niður PDF skýrslu á hvern leikmann.',
  },
  {
    icon: '📊',
    title: 'Tölfræði',
    desc: 'Stigatafla — veldu tölfræði og sjáðu hver er bestur. Liðstölur — heildar tölur liðsins og meðaltöl á leik.',
  },
  {
    icon: '⚖️',
    title: 'Samanburður',
    desc: 'Veldu tvo leikmenn og berðu saman tölfræði þeirra hlið við hlið. Sá sem er betri í hverri tölfræði fær græna liti.',
  },
  {
    icon: '📄',
    title: 'PDF útflutningur',
    desc: 'Hlaðið niður leikjaskýrslu eða leikmanna skýrslu sem PDF til að deila með liðinu eða öðrum þjálfurum.',
  },
  {
    icon: '📱',
    title: 'PWA — Setja á heimaskjá',
    desc: 'Opnaðu appið í Safari/Chrome, ýttu á "Deila" og "Setja á heimaskjá". Appið virkar eins og venjulegt app á símanum þínum.',
  },
];

export default function SettingsPage() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);

  const handleChangePin = async () => {
    setError('');
    setMessage('');
    const currentHash = await hashPin(currentPin);
    const storedHash = localStorage.getItem('grotta_pin_hash');
    if (currentHash !== storedHash) { setError('Rangt núverandi PIN'); return; }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setError('PIN verður að vera 4 tölustafir'); return; }
    if (newPin !== confirmPin) { setError('Nýtt PIN passar ekki'); return; }
    const newHash = await hashPin(newPin);
    localStorage.setItem('grotta_pin_hash', newHash);
    setCurrentPin(''); setNewPin(''); setConfirmPin('');
    setMessage('PIN breytt!');
  };

  return (
    <div className="page">
      <h1 className="page-heading">Stillingar</h1>

      {/* Features button */}
      <button className="btn-features" onClick={() => setShowFeatures(true)}>
        💡 Fítusar — Hvað get ég gert?
      </button>

      {/* Features modal */}
      {showFeatures && (
        <div className="modal-overlay" onClick={() => setShowFeatures(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">💡 Fítusar</h2>
              <button className="modal-close" onClick={() => setShowFeatures(false)}>✕</button>
            </div>
            <div className="modal-body">
              {FEATURES.map((f, i) => (
                <div key={i} className="feature-item">
                  <span className="feature-icon">{f.icon}</span>
                  <div className="feature-text">
                    <h3 className="feature-title">{f.title}</h3>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PIN section */}
      <div className="settings-section">
        <h2 className="section-label">Breyta PIN</h2>
        <div className="settings-form">
          <input className="form-input" type="password" inputMode="numeric" maxLength={4} placeholder="Núverandi PIN" value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))} />
          <input className="form-input" type="password" inputMode="numeric" maxLength={4} placeholder="Nýtt PIN" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} />
          <input className="form-input" type="password" inputMode="numeric" maxLength={4} placeholder="Staðfesta nýtt PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
          {error && <p className="settings-error">{error}</p>}
          {message && <p className="settings-success">{message}</p>}
          <button className="btn-save" onClick={handleChangePin}>Vista PIN</button>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-label">Um</h2>
        <div className="about-box">
          <p>🤾 Grótta Stats v1.0</p>
          <p>Handboltatölfræði fyrir Gróttu</p>
        </div>
      </div>
    </div>
  );
}