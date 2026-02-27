export const FIELD_PLAYER_STATS = [
  { key: 'skot', label: 'Skot' },
  { key: 'mork', label: 'Mörk' },
  { key: 'stodsending', label: 'Stoðsending' },
  { key: 'tapadur_bolti', label: 'Tapaður bolti' },
  { key: 'fiskad_viti', label: 'Fiskað víti' },
  { key: 'havorn', label: 'Hávörn' },
  { key: 'frikast', label: 'Fríkast' },
  { key: 'stolinn_bolti', label: 'Stolinn bolti' },
  { key: 'rudningur_plus', label: 'Ruðningur +' },
  { key: 'rudningur_minus', label: 'Ruðningur -' },
  { key: 'hradaupphlaup', label: 'Hraðaupphl.' },
];

export const GOALKEEPER_STATS = [
  { key: 'varin_skot', label: 'Varin skot' },
  { key: 'fyrri_halfleikur', label: 'Fyrri hálfleikur' },
  { key: 'seinni_halfleikur', label: 'Seinni hálfleikur' },
  { key: 'sendingar_plus', label: 'Sendingar ++' },
  { key: 'sendingar_minus', label: 'Sendingar --' },
];

/**
 * Calculate efficiency metrics from raw stats.
 * Returns an object with calculated percentages/ratios.
 */
export function calcEfficiency(totals, games) {
  const skot = totals.skot || 0;
  const mork = totals.mork || 0;
  const stod = totals.stodsending || 0;
  const tap = totals.tapadur_bolti || 0;
  const viti = totals.fiskad_viti || 0;
  const stol = totals.stolinn_bolti || 0;
  const rudMinus = totals.rudningur_minus || 0;

  const shotPct = skot > 0 ? ((mork / skot) * 100).toFixed(1) : '-';
  const assistTurnover = tap > 0 ? (stod / tap).toFixed(2) : stod > 0 ? '∞' : '-';
  const efficiencyRating = (mork + stod + viti + stol) - (tap + rudMinus);
  const efficiencyPerGame = games > 0 ? (efficiencyRating / games).toFixed(1) : '0.0';

  return {
    shotPct,
    assistTurnover,
    efficiencyRating,
    efficiencyPerGame,
  };
}

export const EFFICIENCY_STATS = [
  { key: 'shotPct', label: 'Skotnýting %' },
  { key: 'assistTurnover', label: 'Stoðs. / Tap. boltar' },
  { key: 'efficiencyRating', label: 'Vinnsluhlutfall' },
  { key: 'efficiencyPerGame', label: 'Vinnsla / leik' },
];

export function getStatsForType(isGoalkeeper) {
  return isGoalkeeper ? GOALKEEPER_STATS : FIELD_PLAYER_STATS;
}

export function emptyStats(isGoalkeeper) {
  const stats = getStatsForType(isGoalkeeper);
  const obj = {};
  stats.forEach((s) => { obj[s.key] = 0; });
  return obj;
}