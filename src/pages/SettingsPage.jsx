import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleChangePin = async () => {
    setError('');
    setMessage('');

    const currentHash = await hashPin(currentPin);
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'pin_hash')
      .single();

    if (!data || data.value !== currentHash) {
      setError('Rangt núverandi PIN');
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('PIN verður að vera 4 tölustafir');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Nýtt PIN passar ekki');
      return;
    }

    const newHash = await hashPin(newPin);
    await supabase
      .from('app_settings')
      .upsert({ key: 'pin_hash', value: newHash });

    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setMessage('PIN breytt!');
  };

  return (
    <div className="page">
      <h1 className="page-heading">Stillingar</h1>

      {/* Features button */}
      <button className="btn-features" onClick={() => setShowFeatures(true)}>
        💡 Fítusar — Hvað get ég gert?
      </button>

      {!isInstalled && (
        <button className="btn-install" onClick={handleInstall}>
          📲 Setja app á heimaskjá
        </button>
      )}

      {isInstalled && (
        <div className="installed-badge">✅ App er uppsett</div>
      )}

      {showIosGuide && (
        <div className="modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📲 Setja á heimaskjá</h2>
              <button className="modal-close" onClick={() => setShowIosGuide(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="ios-steps">
                <div className="ios-step">
                  <span className="ios-step-num">1</span>
                  <p>Ýttu á <strong>Deila</strong> takkann (⬆️) neðst í Safari</p>
                </div>
                <div className="ios-step">
                  <span className="ios-step-num">2</span>
                  <p>Skrollaðu niður og veldu <strong>"Setja á heimaskjá"</strong></p>
                </div>
                <div className="ios-step">
                  <span className="ios-step-num">3</span>
                  <p>Ýttu á <strong>"Bæta við"</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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