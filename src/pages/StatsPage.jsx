import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FIELD_PLAYER_STATS, GOALKEEPER_STATS } from '../lib/stats';
import './PageStyles.css';
import './StatsPage.css';

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [fieldData, setFieldData] = useState([]);
  const [gkData, setGkData] = useState([]);
  const [gameCount, setGameCount] = useState(0);
  const [selectedStat, setSelectedStat] = useState('skot_mork');
  const [view, setView] = useState('leaders'); // 'leaders' | 'totals'

  useEffect(() => {
    (async () => {
      const [playersRes, fieldRes, gkRes, gamesRes] = await Promise.all([
        supabase.from('players').select('*').eq('active', true),
        supabase.from('game_stats').select('*'),
        supabase.from('goalkeeper_stats').select('*'),
        supabase.from('games').select('id'),
      ]);

      setPlayers(playersRes.data || []);
      setFieldData(fieldRes.data || []);
      setGkData(gkRes.data || []);
      setGameCount((gamesRes.data || []).length);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="page"><p className="page-empty">Hleð...</p></div>;
  if (gameCount === 0) return (
    <div className="page">
      <h1 className="page-heading">Tölfræði</h1>
      <p className="page-empty">Engir leikir enn. Skráðu leik til að sjá tölfræði!</p>
    </div>
  );

  const playerMap = {};
  players.forEach((p) => { playerMap[p.id] = p; });

  // Aggregate field player totals
  const fieldTotals = {};
  fieldData.forEach((row) => {
    if (!fieldTotals[row.player_id]) {
      fieldTotals[row.player_id] = { games: 0 };
      FIELD_PLAYER_STATS.forEach((s) => { fieldTotals[row.player_id][s.key] = 0; });
    }
    fieldTotals[row.player_id].games++;
    FIELD_PLAYER_STATS.forEach((s) => {
      fieldTotals[row.player_id][s.key] += row[s.key] || 0;
    });
  });

  // Aggregate goalkeeper totals
  const gkTotals = {};
  gkData.forEach((row) => {
    if (!gkTotals[row.player_id]) {
      gkTotals[row.player_id] = { games: 0 };
      GOALKEEPER_STATS.forEach((s) => { gkTotals[row.player_id][s.key] = 0; });
    }
    gkTotals[row.player_id].games++;
    GOALKEEPER_STATS.forEach((s) => {
      gkTotals[row.player_id][s.key] += row[s.key] || 0;
    });
  });

  // Is selected stat a GK stat?
  const isGkStat = GOALKEEPER_STATS.some((s) => s.key === selectedStat);
  const activeTotals = isGkStat ? gkTotals : fieldTotals;
  const activeStatDefs = isGkStat ? GOALKEEPER_STATS : FIELD_PLAYER_STATS;
  const allStatOptions = [...FIELD_PLAYER_STATS, ...GOALKEEPER_STATS];

  // Leaderboard for selected stat
  const leaderboard = Object.entries(activeTotals)
    .map(([playerId, totals]) => ({
      player: playerMap[playerId],
      total: totals[selectedStat] || 0,
      games: totals.games,
      avg: totals.games > 0 ? ((totals[selectedStat] || 0) / totals.games).toFixed(1) : '0.0',
    }))
    .filter((r) => r.player && r.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxVal = leaderboard.length > 0 ? leaderboard[0].total : 1;

  // Team totals across all stats (field players)
  const teamFieldTotals = {};
  FIELD_PLAYER_STATS.forEach((s) => {
    teamFieldTotals[s.key] = 0;
    Object.values(fieldTotals).forEach((t) => { teamFieldTotals[s.key] += t[s.key] || 0; });
  });

  const teamGkTotals = {};
  GOALKEEPER_STATS.forEach((s) => {
    teamGkTotals[s.key] = 0;
    Object.values(gkTotals).forEach((t) => { teamGkTotals[s.key] += t[s.key] || 0; });
  });

  return (
    <div className="page">
      <h1 className="page-heading">Tölfræði</h1>

      <div className="stats-meta">
        <span className="meta-badge">{gameCount} leikir</span>
        <span className="meta-badge">{players.length} leikmenn</span>
      </div>

      {/* View toggle */}
      <div className="view-toggle">
        <button
          className={`view-btn ${view === 'leaders' ? 'active' : ''}`}
          onClick={() => setView('leaders')}
        >
          Stigatafla
        </button>
        <button
          className={`view-btn ${view === 'totals' ? 'active' : ''}`}
          onClick={() => setView('totals')}
        >
          Liðstölur
        </button>
      </div>

      {view === 'leaders' && (
        <>
          {/* Stat picker */}
          <select
            className="stat-picker"
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
          >
            <optgroup label="Útileikmenn">
              {FIELD_PLAYER_STATS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </optgroup>
            <optgroup label="Markvörðir">
              {GOALKEEPER_STATS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </optgroup>
          </select>

          {leaderboard.length === 0 ? (
            <p className="page-empty">Engar tölur fyrir þessa tölfræði.</p>
          ) : (
            <div className="leaderboard">
              {leaderboard.map((r, i) => (
                <div key={r.player.id} className="leader-row">
                  <div className="leader-rank">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </div>
                  <div className="leader-info">
                    <div className="leader-top">
                      <span className="leader-name">
                        {r.player.is_goalkeeper ? '🧤 ' : ''}{r.player.name}
                      </span>
                      <span className="leader-nums">
                        <span className="leader-total">{r.total}</span>
                        <span className="leader-avg">Ø {r.avg}</span>
                      </span>
                    </div>
                    <div className="leader-bar-bg">
                      <div
                        className="leader-bar-fill"
                        style={{ width: `${(r.total / maxVal) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'totals' && (
        <>
          <div className="totals-section">
            <h3 className="totals-title">Útileikmenn</h3>
            <div className="totals-grid">
              {FIELD_PLAYER_STATS.map((s) => (
                <div key={s.key} className="total-card">
                  <span className="total-value">{teamFieldTotals[s.key]}</span>
                  <span className="total-avg">
                    Ø {gameCount > 0 ? (teamFieldTotals[s.key] / gameCount).toFixed(1) : '0'}
                  </span>
                  <span className="total-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="totals-section">
            <h3 className="totals-title">Markvörðir</h3>
            <div className="totals-grid">
              {GOALKEEPER_STATS.map((s) => (
                <div key={s.key} className="total-card">
                  <span className="total-value">{teamGkTotals[s.key]}</span>
                  <span className="total-avg">
                    Ø {gameCount > 0 ? (teamGkTotals[s.key] / gameCount).toFixed(1) : '0'}
                  </span>
                  <span className="total-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}