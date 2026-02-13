export const FIELD_PLAYER_STATS = [
  { key: 'skot_mork', label: 'Skot / mörk' },
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

export function getStatsForType(isGoalkeeper) {
  return isGoalkeeper ? GOALKEEPER_STATS : FIELD_PLAYER_STATS;
}

export function emptyStats(isGoalkeeper) {
  const stats = getStatsForType(isGoalkeeper);
  const obj = {};
  stats.forEach((s) => { obj[s.key] = 0; });
  return obj;
}