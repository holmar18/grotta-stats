import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FIELD_PLAYER_STATS, GOALKEEPER_STATS, calcEfficiency, EFFICIENCY_STATS } from '../lib/stats';
import './PageStyles.css';
import './ComparePage.css';

export default function ComparePage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');
  const [statsA, setStatsA] = useState(null);
  const [statsB, setStatsB] = useState(null);
  const [comparing, setComparing] = useState(false);

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

  const loadPlayerStats = async (playerId) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return null;

    const table = player.is_goalkeeper ? 'goalkeeper_stats' : 'game_stats';
    const statDefs = player.is_goalkeeper ? GOALKEEPER_STATS : FIELD_PLAYER_STATS;

    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('player_id', playerId);

    const rows = data || [];
    const games = rows.length;
    const totals = {};
    statDefs.forEach((s) => { totals[s.key] = 0; });
    rows.forEach((r) => {
      statDefs.forEach((s) => { totals[s.key] += r[s.key] || 0; });
    });
    const averages = {};
    statDefs.forEach((s) => {
      averages[s.key] = games > 0 ? (totals[s.key] / games).toFixed(1) : '0.0';
    });

    const efficiency = player.is_goalkeeper ? null : calcEfficiency(totals, games);

    return { player, games, totals, averages, statDefs, efficiency };
  };

  const compare = async () => {
    if (!playerA || !playerB) return;
    setComparing(true);
    const [a, b] = await Promise.all([
      loadPlayerStats(playerA),
      loadPlayerStats(playerB),
    ]);
    setStatsA(a);
    setStatsB(b);
    setComparing(false);
  };

  // Merge stat defs if comparing GK vs field player
  const getComparisonStats = () => {
    if (!statsA || !statsB) return [];
    const aKeys = new Set(statsA.statDefs.map((s) => s.key));
    const bKeys = new Set(statsB.statDefs.map((s) => s.key));

    // If same type, use their shared defs
    if (statsA.player.is_goalkeeper === statsB.player.is_goalkeeper) {
      return statsA.statDefs;
    }

    // Mixed: show all unique stats
    const all = [...statsA.statDefs];
    statsB.statDefs.forEach((s) => {
      if (!aKeys.has(s.key)) all.push(s);
    });
    return all;
  };

  if (loading) return <div className="page"><p className="page-empty">Hleð...</p></div>;

  const comparisonStats = getComparisonStats();

  return (
    <div className="page">
      <h1 className="page-heading">Samanburður</h1>

      <div className="compare-pickers">
        <select
          className="compare-select"
          value={playerA}
          onChange={(e) => { setPlayerA(e.target.value); setStatsA(null); }}
        >
          <option value="">Leikmaður A</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.is_goalkeeper ? '🧤 ' : ''}{p.name}
            </option>
          ))}
        </select>

        <span className="compare-vs">vs</span>

        <select
          className="compare-select"
          value={playerB}
          onChange={(e) => { setPlayerB(e.target.value); setStatsB(null); }}
        >
          <option value="">Leikmaður B</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.is_goalkeeper ? '🧤 ' : ''}{p.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="btn-compare"
        onClick={compare}
        disabled={!playerA || !playerB || playerA === playerB || comparing}
      >
        {comparing ? 'Hleð...' : 'Bera saman'}
      </button>

      {statsA && statsB && (
        <div className="compare-results">
          {/* Header */}
          <div className="compare-header">
            <div className="compare-player">
              <span className="compare-name">{statsA.player.name}</span>
              <span className="compare-games">{statsA.games} leikir</span>
            </div>
            <div className="compare-player right">
              <span className="compare-name">{statsB.player.name}</span>
              <span className="compare-games">{statsB.games} leikir</span>
            </div>
          </div>

          {/* Stat rows */}
          {comparisonStats.map((s) => {
            const valA = statsA.totals[s.key] ?? '-';
            const valB = statsB.totals[s.key] ?? '-';
            const avgA = statsA.averages[s.key] ?? '-';
            const avgB = statsB.averages[s.key] ?? '-';
            const numA = typeof valA === 'number' ? valA : 0;
            const numB = typeof valB === 'number' ? valB : 0;
            const winner = numA > numB ? 'a' : numB > numA ? 'b' : 'tie';

            return (
              <div key={s.key} className="compare-row">
                <div className={`compare-val left ${winner === 'a' ? 'winning' : ''}`}>
                  <span className="cv-total">{valA}</span>
                  <span className="cv-avg">Ø {avgA}</span>
                </div>
                <div className="compare-label">{s.label}</div>
                <div className={`compare-val right ${winner === 'b' ? 'winning' : ''}`}>
                  <span className="cv-total">{valB}</span>
                  <span className="cv-avg">Ø {avgB}</span>
                </div>
              </div>
            );
          })}
          {statsA.efficiency && statsB.efficiency && (
            <>
              <div className="compare-divider">Skilvirknistölur</div>
              {EFFICIENCY_STATS.map((s) => {
                const rawA = statsA.efficiency[s.key];
                const rawB = statsB.efficiency[s.key];
                const numA = parseFloat(rawA) || 0;
                const numB = parseFloat(rawB) || 0;
                const winner = numA > numB ? 'a' : numB > numA ? 'b' : 'tie';

                return (
                  <div key={s.key} className="compare-row">
                    <div className={`compare-val left ${winner === 'a' ? 'winning' : ''}`}>
                      <span className="cv-total">{rawA}{s.key === 'shotPct' && rawA !== '-' ? '%' : ''}</span>
                    </div>
                    <div className="compare-label">{s.label}</div>
                    <div className={`compare-val right ${winner === 'b' ? 'winning' : ''}`}>
                      <span className="cv-total">{rawB}{s.key === 'shotPct' && rawB !== '-' ? '%' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}