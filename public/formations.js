export const layouts = [
  ['rows', 'Deux lignes', 'Un classique, bien équilibré'],
  ['stagger', 'Quinconce', 'Chaque danseur reste visible'],
  ['line', 'Une ligne', 'Toute la troupe au même niveau'],
  ['v', 'En V', 'Une pointe au centre de la scène'],
  ['arc', 'Demi-cercle', 'Une ouverture vers le public'],
  ['circle', 'Cercle', 'Le collectif au premier plan'],
  ['diagonal', 'Diagonale', 'Du relief dans le mouvement']
];
export const colors = ['#d86638', '#56816a', '#6d69b3', '#ba5577', '#327eaa', '#b68a20'];
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export function positions(n, layout) {
  if (!Number.isInteger(n) || n < 1 || n > 40) throw new Error('Effectif invalide');
  if (!layouts.some(([id]) => id === layout)) throw new Error('Disposition invalide');
  if (n === 1) return [{ x: 50, y: 52 }];
  const spread = (i, total) => total === 1 ? 50 : 12 + i * 76 / (total - 1);
  return Array.from({ length: n }, (_, i) => {
    if (layout === 'line') return { x: spread(i, n), y: 52 };
    if (layout === 'rows' || layout === 'stagger') {
      const back = Math.floor(n / 2), front = n - back, rear = i < back;
      const j = rear ? i : i - back, count = rear ? back : front;
      let x = spread(j, count);
      if (layout === 'stagger' && back === front && count > 1) x = 15 + (j + (rear ? 0 : .5)) * 70 / (count - .5);
      return { x, y: rear ? 33 : 68 };
    }
    if (layout === 'v') { const x = spread(i, n); return { x, y: 78 - Math.abs(x - 50) * 1.35 }; }
    if (layout === 'diagonal') return { x: spread(i, n), y: 20 + 60 * i / (n - 1) };
    const angle = layout === 'circle' ? 2 * Math.PI * i / n - Math.PI / 2 : Math.PI + Math.PI * i / (n - 1);
    return { x: 50 + 38 * Math.cos(angle), y: (layout === 'circle' ? 50 : 72) + 34 * Math.sin(angle) };
  });
}
export function arrange(dancers, layout, groupCount = 1, split = false) {
  const result = dancers.map(d => ({ ...d }));
  const buckets = new Map();
  result.forEach(d => {
    const key = groupCount === 1 ? 'all' : `${d.group}-${split ? d.subgroup : 1}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(d);
  });
  const groups = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  const columns = Math.min(groups.length, 3), rows = Math.ceil(groups.length / columns);
  groups.forEach(([, members], index) => {
    const row = Math.floor(index / columns), inRow = Math.min(columns, groups.length - row * columns);
    const width = 100 / columns, height = 100 / rows;
    const offset = (100 - inRow * width) / 2;
    positions(members.length, layout).forEach((p, i) => {
      members[i].x = offset + (index % columns) * width + p.x * width / 100;
      members[i].y = row * height + p.y * height / 100;
    });
  });
  return result;
}
export function validScene(s) {
  return !!s && typeof s.title === 'string' && s.title.length <= 100 && layouts.some(([id]) => id === s.layout)
    && Number.isInteger(s.groups) && s.groups >= 1 && s.groups <= 6 && typeof s.split === 'boolean'
    && Array.isArray(s.dancers) && s.dancers.length >= 1 && s.dancers.length <= 40
    && new Set(s.dancers.map(d => d.id)).size === s.dancers.length
    && s.dancers.every(d => Number.isInteger(d.id) && d.id > 0 && d.id <= 40 && typeof d.name === 'string' && d.name.length <= 40
      && Number.isInteger(d.group) && d.group >= 1 && d.group <= s.groups && [1, 2].includes(d.subgroup)
      && Number.isFinite(d.x) && d.x >= 3 && d.x <= 97 && Number.isFinite(d.y) && d.y >= 3 && d.y <= 97);
}
