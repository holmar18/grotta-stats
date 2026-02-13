import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import './PinScreen.css';

const PIN_LENGTH = 4;

async function hashPin(pin) {
  const encoded = new TextEncoder().encode(pin + 'grotta-salt');
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function PinScreen({ onUnlock }) {
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'setup'
  const [digits, setDigits] = useState('');
  const [confirmDigits, setConfirmDigits] = useState(null);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'pin_hash')
        .single();

      if (data) {
        setHasPin(true);
        setMode('login');
      } else {
        setHasPin(false);
        setMode('setup');
      }
      setLoading(false);
    })();
  }, []);

  const triggerError = useCallback((msg) => {
    setError(msg);
    setShaking(true);
    setDigits('');
    setConfirmDigits(null);
    setTimeout(() => setShaking(false), 450);
  }, []);

  const handleDigit = useCallback(
    async (d) => {
      setError('');
      const next = digits + d;
      setDigits(next);

      if (next.length < PIN_LENGTH) return;

      // — LOGIN —
      if (mode === 'login') {
        const hash = await hashPin(next);
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'pin_hash')
          .single();

        if (data && data.value === hash) {
          onUnlock();
        } else {
          triggerError('Rangt PIN');
        }
        return;
      }

      // — SETUP: first entry —
      if (confirmDigits === null) {
        setConfirmDigits(next);
        setDigits('');
        return;
      }

      // — SETUP: confirm —
      if (next === confirmDigits) {
        const hash = await hashPin(next);
        await supabase
          .from('app_settings')
          .upsert({ key: 'pin_hash', value: hash });
        onUnlock();
      } else {
        triggerError('PIN passa ekki');
      }
    },
    [digits, mode, confirmDigits, onUnlock, triggerError]
  );

  const handleBackspace = useCallback(() => {
    setDigits((d) => d.slice(0, -1));
    setError('');
  }, []);

  const handleKey = useCallback(
    (key) => {
      if (key === 'back') handleBackspace();
      else if (key !== '') handleDigit(key);
    },
    [handleDigit, handleBackspace]
  );

  if (loading) {
    return (
      <div className="pin-screen">
        <div className="pin-logo">🤾</div>
        <h1 className="pin-title">Grótta Stats</h1>
        <p className="pin-subtitle">Hleð...</p>
      </div>
    );
  }

  let subtitle = 'Sláðu inn PIN';
  if (mode === 'setup') {
    subtitle = confirmDigits === null ? 'Veldu 4 stafa PIN' : 'Staðfestu PIN';
  }

  return (
    <div className="pin-screen">
      <div className="pin-logo">🤾</div>
      <h1 className="pin-title">Grótta Stats</h1>
      <p className="pin-subtitle">{subtitle}</p>

      <div className={`pin-dots ${shaking ? 'shake' : ''}`}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`pin-dot ${i < digits.length ? 'filled' : ''} ${shaking ? 'error' : ''}`}
          />
        ))}
      </div>

      <div className="pin-error">{error}</div>

      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) => (
          <button
            key={key}
            className={`pin-key ${key === '' ? 'empty' : ''} ${key === 'back' ? 'backspace' : ''}`}
            onClick={() => handleKey(key)}
            disabled={key === ''}
            type="button"
          >
            {key === 'back' ? '⌫' : key}
          </button>
        ))}
      </div>
    </div>
  );
}