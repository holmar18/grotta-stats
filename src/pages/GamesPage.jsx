import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FIELD_PLAYER_STATS, GOALKEEPER_STATS } from '../lib/stats';
import { exportGamePdf } from '../lib/exportPdf';
import './PageStyles.css';
import './GamesPage.css';

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loadingGame, setLoadingGame] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('game_date', { ascending: false });
    setGames(data || []);
    setLoading(false);
  };

  const toggleGame = async (gameId) => {
    if (expandedId === gameId) {
      setExpandedId(null);
      setGameData(null);
      return;
    }

    setExpandedId(gameId);
    setLoadingGame(true);

    const [fieldRes, gkRes] = await Promise.all([
      supabase
        .from('game_stats')
        .select('*, player:players(name, is_goalkeeper)')
        .eq('game_id', gameId),
      supabase
        .from('goalkeeper_stats')
        .select('*, player:players(name, is_goalkeeper)')
        .eq('game_id', gameId),
    ]);

    setGameData({
      field: fieldRes.data || [],
      goalkeepers: gkRes.data || [],
    });
    setLoadingGame(false);
  };

  const deleteGame = async (gameId, e) => {
    e.stopPropagation();
    if (!confirm('Eyða leik?')) return;
    await supabase.from('games').delete().eq('id', gameId);
    if (expandedId === gameId) {
      setExpandedId(null);
      setGameData(null);
    }
    fetchGames();
  };

  const hasStats = (row, statDefs) => {
    return statDefs.some((s) => (row[s.key] || 0) > 0);
  };

  if (loading) return <div className="page"><p className="page-empty">Hleð...</p></div>;

  if (games.length === 0) {
    return (
      <div className="page">
        <h1 className="page-heading">Leikir</h1>
        <p className="page-empty">Engir leikir enn. Byrjaðu nýjan leik!</p>
      </div>
    );
  }

  const handleExportGame = (game, e) => {
      e.stopPropagation();
      if (!gameData || expandedId !== game.id) {
        alert('Opnaðu leikinn fyrst til að hlaða niður PDF');
        return;
      }

      const fieldRows = (gameData.field || []).map((r) => ({
        ...r,
        playerName: r.player?.name || '?',
      }));

      const gkRows = (gameData.goalkeepers || []).map((r) => ({
        ...r,
        playerName: r.player?.name || '?',
      }));

      exportGamePdf(game, fieldRows, gkRows, FIELD_PLAYER_STATS, GOALKEEPER_STATS);
    };

  return (
    <div className="page">
      <h1 className="page-heading">Leikir ({games.length})</h1>

      <div className="games-list">
        {games.map((g) => (
          <div key={g.id} className={`game-card ${expandedId === g.id ? 'expanded' : ''}`}>
            <div className="game-card-header" onClick={() => toggleGame(g.id)}>
              <div className="game-card-info">
                <span className="game-card-opponent">vs {g.opponent}</span>
                <span className="game-card-date">{g.game_date}</span>
              </div>
              <div className="game-card-actions">
                <button className="btn-icon-sm" onClick={(e) => handleExportGame(g, e)} title="PDF">📄</button>
                <button className="btn-icon-sm" onClick={(e) => deleteGame(g.id, e)}>🗑</button>
                <span className="game-card-chevron">{expandedId === g.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedId === g.id && (
              <div className="game-card-body">
                {loadingGame ? (
                  <p className="loading-text">Hleð...</p>
                ) : gameData ? (
                  <>
                    {gameData.field.length > 0 && (
                      <div className="detail-section">
                        <h3 className="detail-label">Útileikmenn</h3>
                        <div className="stat-table-wrap">
                          <table className="stat-table">
                            <thead>
                              <tr>
                                <th className="th-name">Leikmaður</th>
                                {FIELD_PLAYER_STATS.map((s) => (
                                  <th key={s.key} className="th-stat">{s.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {gameData.field
                                .filter((r) => hasStats(r, FIELD_PLAYER_STATS))
                                .map((r) => (
                                  <tr key={r.id}>
                                    <td className="td-name">{r.player?.name}</td>
                                    {FIELD_PLAYER_STATS.map((s) => (
                                      <td key={s.key} className="td-val">
                                        <span className={r[s.key] > 0 ? 'val-active' : 'val-zero'}>
                                          {r[s.key] || 0}
                                        </span>
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {gameData.goalkeepers.length > 0 && (
                      <div className="detail-section">
                        <h3 className="detail-label">Markvörðir</h3>
                        <div className="stat-table-wrap">
                          <table className="stat-table">
                            <thead>
                              <tr>
                                <th className="th-name">Markvörður</th>
                                {GOALKEEPER_STATS.map((s) => (
                                  <th key={s.key} className="th-stat">{s.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {gameData.goalkeepers
                                .filter((r) => hasStats(r, GOALKEEPER_STATS))
                                .map((r) => (
                                  <tr key={r.id}>
                                    <td className="td-name">🧤 {r.player?.name}</td>
                                    {GOALKEEPER_STATS.map((s) => (
                                      <td key={s.key} className="td-val">
                                        <span className={r[s.key] > 0 ? 'val-active' : 'val-zero'}>
                                          {r[s.key] || 0}
                                        </span>
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {gameData.field.filter((r) => hasStats(r, FIELD_PLAYER_STATS)).length === 0 &&
                     gameData.goalkeepers.filter((r) => hasStats(r, GOALKEEPER_STATS)).length === 0 && (
                      <p className="loading-text">Engar tölur skráðar í þessum leik.</p>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}