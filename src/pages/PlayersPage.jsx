import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FIELD_PLAYER_STATS, GOALKEEPER_STATS, calcEfficiency, EFFICIENCY_STATS } from '../lib/stats';
import { exportPlayerPdf } from '../lib/exportPdf';
import './PageStyles.css';
import './PlayersPage.css';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('active', true)
      .order('sort_order');
    setPlayers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const resetForm = () => {
    setName('');
    setIsGoalkeeper(false);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editingId) {
      await supabase
        .from('players')
        .update({ name: trimmed, is_goalkeeper: isGoalkeeper })
        .eq('id', editingId);
    } else {
      const maxOrder = players.reduce((m, p) => Math.max(m, p.sort_order || 0), 0);
      await supabase
        .from('players')
        .insert({ name: trimmed, is_goalkeeper: isGoalkeeper, sort_order: maxOrder + 1 });
    }
    resetForm();
    fetchPlayers();
  };

  const handleEdit = (player, e) => {
    e.stopPropagation();
    setName(player.name);
    setIsGoalkeeper(player.is_goalkeeper);
    setEditingId(player.id);
    setShowForm(true);
    setSelectedPlayer(null);
  };

  const handleDeactivate = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Fjarlægja leikmann?')) return;
    await supabase.from('players').update({ active: false }).eq('id', id);
    if (selectedPlayer?.id === id) {
      setSelectedPlayer(null);
      setPlayerStats(null);
    }
    fetchPlayers();
  };

  const openProfile = async (player) => {
    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer(null);
      setPlayerStats(null);
      return;
    }

    setSelectedPlayer(player);
    setLoadingStats(true);

    const table = player.is_goalkeeper ? 'goalkeeper_stats' : 'game_stats';
    const statDefs = player.is_goalkeeper ? GOALKEEPER_STATS : FIELD_PLAYER_STATS;

    const { data } = await supabase
      .from(table)
      .select('*, game:games(opponent, game_date)')
      .eq('player_id', player.id)
      .order('id', { ascending: false });

    const rows = data || [];
    const gameCount = rows.length;

    // Compute totals and averages
    const totals = {};
    statDefs.forEach((s) => { totals[s.key] = 0; });
    rows.forEach((r) => {
      statDefs.forEach((s) => { totals[s.key] += r[s.key] || 0; });
    });

    const averages = {};
    statDefs.forEach((s) => {
      averages[s.key] = gameCount > 0 ? (totals[s.key] / gameCount).toFixed(1) : '0.0';
    });

    const efficiency = player.is_goalkeeper ? null : calcEfficiency(totals, gameCount);

    setPlayerStats({ rows, gameCount, totals, averages, statDefs, efficiency });
    setLoadingStats(false);
  };


  const handleExportPlayer = (e) => {
      e.stopPropagation();
      if (!selectedPlayer || !playerStats) return;

      const gameRows = playerStats.rows.map((r) => ({
        ...r,
        opponent: r.game?.opponent || '?',
        game_date: r.game?.game_date || '?',
      }));

      exportPlayerPdf(
        selectedPlayer,
        gameRows,
        playerStats.statDefs,
        playerStats.totals,
        playerStats.averages,
        playerStats.gameCount
      );
    };

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const fieldPlayers = filtered.filter((p) => !p.is_goalkeeper);
  const goalkeepers = filtered.filter((p) => p.is_goalkeeper);

  if (loading) return <div className="page"><p className="page-empty">Hleð...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-heading">Leikmenn</h1>
        <button className="btn-add" onClick={() => { resetForm(); setShowForm(true); }}>
          + Nýr
        </button>
      </div>

      {/* Search */}
      <input
        className="form-input search-input"
        type="text"
        placeholder="Leita að leikmanni..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showForm && (
        <div className="player-form">
          <input
            className="form-input"
            type="text"
            placeholder="Nafn leikmanns"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <label className="form-toggle">
            <input
              type="checkbox"
              checked={isGoalkeeper}
              onChange={(e) => setIsGoalkeeper(e.target.checked)}
            />
            <span>Markvörður</span>
          </label>
          <div className="form-actions">
            <button className="btn-save" onClick={handleSubmit}>
              {editingId ? 'Vista' : 'Bæta við'}
            </button>
            <button className="btn-cancel" onClick={resetForm}>Hætta við</button>
          </div>
        </div>
      )}

      {/* Player list with inline profile */}
      {[
        { label: `Útileikmenn (${fieldPlayers.length})`, list: fieldPlayers },
        { label: `Markvörðir (${goalkeepers.length})`, list: goalkeepers },
      ]
        .filter((g) => g.list.length > 0)
        .map((group) => (
          <div key={group.label} className="player-section">
            <h2 className="section-label">{group.label}</h2>
            <div className="player-list">
              {group.list.map((p) => (
                <div key={p.id}>
                  <div
                    className={`player-row ${selectedPlayer?.id === p.id ? 'selected' : ''}`}
                    onClick={() => openProfile(p)}
                  >
                    <span className="player-name">
                      {p.is_goalkeeper ? '🧤 ' : ''}{p.name}
                    </span>
                    <div className="player-actions">
                      <button className="btn-icon" onClick={(e) => handleEdit(p, e)}>✏️</button>
                      <button className="btn-icon" onClick={(e) => handleDeactivate(p.id, e)}>🗑</button>
                      <span className="player-chevron">
                        {selectedPlayer?.id === p.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Inline profile */}
                  {selectedPlayer?.id === p.id && (
                    <div className="player-profile">
                      {loadingStats ? (
                        <p className="profile-loading">Hleð...</p>
                      ) : playerStats ? (
                        <>
                          <div className="profile-summary">
                            <div className="summary-item">
                              <span className="summary-value">{playerStats.gameCount}</span>
                              <span className="summary-label">Leikir</span>
                            </div>
                            {playerStats.statDefs.map((s) => (
                              <div key={s.key} className="summary-item">
                                <span className="summary-value">{playerStats.totals[s.key]}</span>
                                <span className="summary-avg">Ø {playerStats.averages[s.key]}</span>
                                <span className="summary-label">{s.label}</span>
                              </div>
                            ))}
                          </div>

                          {playerStats.efficiency && (
                            <div className="efficiency-section">
                              <h4 className="profile-games-title">Skilvirknistölur</h4>
                              <div className="efficiency-grid">
                                <div className="eff-card">
                                  <div className="eff-header">
                                    <span className={`eff-value ${parseFloat(playerStats.efficiency.shotPct) >= 50 ? 'good' : parseFloat(playerStats.efficiency.shotPct) < 40 ? 'bad' : ''}`}>
                                      {playerStats.efficiency.shotPct}{playerStats.efficiency.shotPct !== '-' ? '%' : ''}
                                    </span>
                                    <button className="eff-info" onClick={() => alert('Skotnýting = Mörk / Skot.\n\nSýnir hversu oft leikmaður skorar þegar hann skýtur. 50%+ er gott, undir 40% er áhyggjuefni.')}>?</button>
                                  </div>
                                  <span className="eff-label">Skotnýting</span>
                                </div>
                                <div className="eff-card">
                                  <div className="eff-header">
                                    <span className={`eff-value ${parseFloat(playerStats.efficiency.assistTurnover) >= 1.0 ? 'good' : playerStats.efficiency.assistTurnover !== '-' && playerStats.efficiency.assistTurnover !== '∞' && parseFloat(playerStats.efficiency.assistTurnover) < 1.0 ? 'bad' : ''}`}>
                                      {playerStats.efficiency.assistTurnover}
                                    </span>
                                    <button className="eff-info" onClick={() => alert('Stoðsendingar / Tapaðir boltar.\n\nSýnir áhættustýringu. Ef undir 1.0 er leikmaðurinn að tapa boltanum oftar en hann skapar tækifæri.')}>?</button>
                                  </div>
                                  <span className="eff-label">Stoðs. / Tap.</span>
                                </div>
                                <div className="eff-card">
                                  <div className="eff-header">
                                    <span className={`eff-value ${playerStats.efficiency.efficiencyRating > 0 ? 'good' : playerStats.efficiency.efficiencyRating < 0 ? 'bad' : ''}`}>
                                      {playerStats.efficiency.efficiencyRating}
                                    </span>
                                    <button className="eff-info" onClick={() => alert('Vinnsluhlutfall = (Mörk + Stoðsendingar + Fiskað víti + Stolnir boltar) − (Tapaðir boltar + Ruðningur −).\n\nEin tala sem sýnir heildarframlag í sókn. Jákvætt = jákvæð áhrif, neikvætt = vandamál.')}>?</button>
                                  </div>
                                  <span className="eff-label">Vinnsluhlutfall</span>
                                </div>
                                <div className="eff-card">
                                  <div className="eff-header">
                                    <span className={`eff-value ${parseFloat(playerStats.efficiency.efficiencyPerGame) > 0 ? 'good' : parseFloat(playerStats.efficiency.efficiencyPerGame) < 0 ? 'bad' : ''}`}>
                                      {playerStats.efficiency.efficiencyPerGame}
                                    </span>
                                    <button className="eff-info" onClick={() => alert('Vinnsluhlutfall deilt með fjölda leikja.\n\nSýnir meðalframlag á leik. Gott til að bera saman leikmenn sem hafa spilað misjafnlega marga leiki.')}>?</button>
                                  </div>
                                  <span className="eff-label">Vinnsla / leik</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {playerStats.rows.length > 0 && (
                            <div className="profile-games">
                              <div className="profile-games-header">
                                <h4 className="profile-games-title">Leikjayfirlit</h4>
                                <button className="btn-export" onClick={handleExportPlayer}>📄 PDF</button>
                              </div>
                              <div className="stat-table-wrap">
                                <table className="stat-table">
                                  <thead>
                                    <tr>
                                      <th className="th-name">Leikur</th>
                                      {playerStats.statDefs.map((s) => (
                                        <th key={s.key} className="th-stat">{s.label}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {playerStats.rows.map((r) => (
                                      <tr key={r.id}>
                                        <td className="td-name">
                                          <div className="game-ref">
                                            <span className="game-ref-opp">vs {r.game?.opponent}</span>
                                            <span className="game-ref-date">{r.game?.game_date}</span>
                                          </div>
                                        </td>
                                        {playerStats.statDefs.map((s) => (
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

                          {playerStats.rows.length === 0 && (
                            <p className="profile-loading">Engar tölur enn.</p>
                          )}
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}