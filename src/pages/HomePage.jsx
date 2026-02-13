import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FIELD_PLAYER_STATS, GOALKEEPER_STATS } from '../lib/stats';
import './PageStyles.css';
import './HomePage.css';

export default function HomePage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [gameDate, setGameDate] = useState(new Date().toISOString().slice(0, 10));
  const [stats, setStats] = useState({});
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('plus'); // 'plus' or 'minus'

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      setPlayers(data || []);
      setLoading(false);
    })();
  }, []);

  const fieldPlayers = players.filter((p) => !p.is_goalkeeper);
  const goalkeepers = players.filter((p) => p.is_goalkeeper);

  const initStats = useCallback(() => {
    const s = {};
    players.forEach((p) => {
      const keys = p.is_goalkeeper ? GOALKEEPER_STATS : FIELD_PLAYER_STATS;
      s[p.id] = {};
      keys.forEach((k) => { s[p.id][k.key] = 0; });
    });
    setStats(s);
  }, [players]);

  const startGame = () => {
    if (!opponent.trim()) return;
    initStats();
    setGameActive(true);
  };

  const handleTap = (playerId, statKey) => {
    setStats((prev) => {
      const current = prev[playerId]?.[statKey] || 0;
      const next = mode === 'plus' ? current + 1 : Math.max(0, current - 1);
      return {
        ...prev,
        [playerId]: { ...prev[playerId], [statKey]: next },
      };
    });
  };

  const saveGame = async () => {
    setSaving(true);
    try {
      const { data: game, error: gameErr } = await supabase
        .from('games')
        .insert({ opponent: opponent.trim(), game_date: gameDate })
        .select()
        .single();
      if (gameErr) throw gameErr;

      const fieldRows = fieldPlayers.map((p) => ({
        game_id: game.id,
        player_id: p.id,
        ...stats[p.id],
      }));

      const gkRows = goalkeepers.map((p) => ({
        game_id: game.id,
        player_id: p.id,
        ...stats[p.id],
      }));

      if (fieldRows.length > 0) {
        const { error } = await supabase.from('game_stats').insert(fieldRows);
        if (error) throw error;
      }

      if (gkRows.length > 0) {
        const { error } = await supabase.from('goalkeeper_stats').insert(gkRows);
        if (error) throw error;
      }

      alert('Leikur vistaður!');
      setGameActive(false);
      setOpponent('');
      setStats({});
      setMode('plus');
    } catch (err) {
      alert('Villa: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page"><p className="page-empty">Hleð...</p></div>;

  if (!gameActive) {
    return (
      <div className="page">
        <h1 className="page-heading">Nýr leikur</h1>
        <div className="start-form">
          <input
            className="form-input"
            type="text"
            placeholder="Mótherji"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startGame()}
          />
          <input
            className="form-input"
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
          />
          <button className="btn-start" onClick={startGame} disabled={!opponent.trim()}>
            Byrja leik
          </button>
        </div>
      </div>
    );
  }

  const renderTable = (playerList, statDefs, label) => (
    <div className="stat-section">
      <h2 className="section-label">{label}</h2>
      <div className="stat-table-wrap">
        <table className="stat-table">
          <thead>
            <tr>
              <th className="th-name">Leikmaður</th>
              {statDefs.map((s) => (
                <th key={s.key} className="th-stat">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playerList.map((p) => (
              <tr key={p.id}>
                <td className="td-name">{p.name}</td>
                {statDefs.map((s) => (
                  <td key={s.key} className="td-stat">
                    <button
                      className={`stat-cell ${(stats[p.id]?.[s.key] || 0) > 0 ? 'has-value' : ''}`}
                      onClick={() => handleTap(p.id, s.key)}
                    >
                      {stats[p.id]?.[s.key] || 0}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="page game-page">
      <div className="game-header">
        <div>
          <h1 className="page-heading">vs {opponent}</h1>
          <span className="game-date">{gameDate}</span>
        </div>
        <button className="btn-save-game" onClick={saveGame} disabled={saving}>
          {saving ? 'Vista...' : 'Vista leik'}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'plus' ? 'active-plus' : ''}`}
          onClick={() => setMode('plus')}
        >
          + Plús
        </button>
        <button
          className={`mode-btn ${mode === 'minus' ? 'active-minus' : ''}`}
          onClick={() => setMode('minus')}
        >
          − Mínus
        </button>
      </div>

      {renderTable(fieldPlayers, FIELD_PLAYER_STATS, 'Útileikmenn')}
      {renderTable(goalkeepers, GOALKEEPER_STATS, 'Markvörðir')}
    </div>
  );
}