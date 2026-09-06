export const layouts = [
  ['rows', 'Deux lignes', 'Un classique, bien équilibré'],
  ['stagger', 'Quinconce', 'Chaque danseur reste visible'],
  ['line', 'Une ligne', 'Toute la troupe au même niveau'],
  ['v', 'En V', 'Une pointe au centre de la scène'],
  ['arc', 'Demi-cercle', 'Une ouverture vers le public'],
  ['circle', 'Cercle', 'Le collectif au premier plan'],
  ['diagonal', 'Diagonale', 'Du relief dans le mouvement'],
  ['w', 'En W', 'Deux V collés, ouverture vers le public'],
  ['pyramid', 'Pyramide', '1 devant, rangs plus larges derrière'],
  ['diamond', 'Losange', '1 devant, côtés, 1 au fond'],
  ['inv_v', 'V inversé', 'Pointe vers le fond, ouverture public'],
  ['columns', 'Files', '2 ou 3 colonnes selon l’effectif'],
  ['three_rows', 'Trois lignes', 'Trois rangs réguliers, décalés pour rester visibles'],
  ['windows', '3 rangs décalés', 'Trois lignes où chacun garde sa fenêtre'],
  ['solo_frame', 'Soliste + cadre', '1 au centre avant, les autres en arc'],
  ['horseshoe', 'Fer à cheval', 'Arc plus fermé sur les côtés'],
  ['x', 'Double diagonale', 'Deux lignes en X, croisement au centre'],
  ['block', 'Bloc / carré', 'Grille 2×2, 3×3, 4×4…'],
  ['zigzag', 'Zigzag', 'Une ligne brisée pour donner du rythme'],
  ['double_v', 'Double V', 'Deux pointes imbriquées en profondeur'],
  ['star', 'Étoile', 'Des branches rayonnantes autour du centre'],
  ['cross', 'Croix', 'Deux axes forts autour du centre'],
  ['cluster', 'Cluster central', 'Un groupe compact mais toujours lisible'],
  ['wings', 'Ailes', 'Deux groupes gauche et droite, centre dégagé']
];

export const colors = ['#d86638', '#56816a', '#6d69b3', '#ba5577', '#327eaa', '#b68a20'];
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function positions(n, layout) {
  if (!Number.isInteger(n) || n < 1 || n > 40) throw new Error('Effectif invalide');
  if (!layouts.some(([id]) => id === layout)) throw new Error('Disposition invalide');
  if (n === 1) return [{ x: 50, y: 52 }];

  // Répartit une série sur une largeur donnée, en pourcentage de scène.
  const spread = (i, total, min = 12, max = 88) => total === 1 ? (min + max) / 2 : min + i * (max - min) / (total - 1);
  const finish = points => points.map(({ x, y }) => ({ x: clamp(x, 9, 91), y: clamp(y, 16, 84) }));
  const rowCounts = count => {
    const result = [];
    let left = count;
    for (let size = 1; left > 0; size++) {
      const used = Math.min(size, left);
      result.push(used);
      left -= used;
    }
    return result;
  };

  let points = [];

  if (layout === 'line') points = Array.from({ length: n }, (_, i) => ({ x: spread(i, n), y: 52 }));

  if (layout === 'rows' || layout === 'stagger') {
    const back = Math.floor(n / 2), front = n - back;
    points = Array.from({ length: n }, (_, i) => {
      const rear = i < back, j = rear ? i : i - back, count = rear ? back : front;
      let x = spread(j, count, count === 1 ? 50 : 14, count === 1 ? 50 : 86);
      // Le fond se place dans les fenêtres du premier rang.
      if (rear && count > 1) {
        if (n % 2) {
          // Sur un effectif impair, le centre reste occupé au fond.
          x += (j - (count - 1) / 2) * .35;
        } else {
          const offsets = Array.from({ length: count }, (_, k) => (k % 2 ? 1 : -1));
          const average = offsets.reduce((sum, value) => sum + value, 0) / count;
          const step = 72 / (count - 1);
          const shift = Math.min(layout === 'stagger' ? 5 : 3, step * .22);
          x += (offsets[j] - average) * shift;
        }
      }
      return { x, y: rear ? 33 : 68 };
    });
  }

  if (layout === 'v' || layout === 'inv_v') {
    points = Array.from({ length: n }, (_, i) => {
      const x = spread(i, n);
      const depth = Math.abs(x - 50) * 1.35;
      return { x, y: layout === 'v' ? 78 - depth : 22 + depth };
    });
  }

  if (layout === 'diagonal') points = Array.from({ length: n }, (_, i) => ({ x: spread(i, n), y: 20 + 60 * i / (n - 1) }));

  if (layout === 'arc' || layout === 'circle') {
    points = Array.from({ length: n }, (_, i) => {
      const angle = layout === 'circle' ? 2 * Math.PI * i / n - Math.PI / 2 : Math.PI + Math.PI * i / (n - 1);
      return { x: 50 + 38 * Math.cos(angle), y: (layout === 'circle' ? 50 : 72) + 34 * Math.sin(angle) };
    });
  }

  if (layout === 'w') {
    const leftCount = Math.ceil(n / 2), rightCount = n - leftCount;
    const makeV = (count, min, max) => Array.from({ length: count }, (_, i) => {
      const x = spread(i, count, min, max), center = (min + max) / 2;
      return { x, y: 78 - Math.abs(x - center) * 1.7 };
    });
    points = [...makeV(leftCount, 10, 48), ...makeV(rightCount, 52, 90)];
  }

  if (layout === 'pyramid') {
    const counts = rowCounts(n), rows = counts.length;
    counts.forEach((count, row) => {
      const capacity = row + 1;
      const width = Math.min(76, 14 + row * 18);
      const step = capacity > 1 ? width / (capacity - 1) : 0;
      const startSlot = (capacity - count) / 2;
      for (let i = 0; i < count; i++) {
        const x = capacity === 1 ? 50 : 50 - width / 2 + (startSlot + i) * step + (row % 2 ? step * .12 : -step * .12);
        points.push({ x, y: rows === 1 ? 52 : 80 - row * 58 / (rows - 1) });
      }
    });
  }

  if (layout === 'diamond') {
    const vertices = [{ x: 50, y: 80 }, { x: 88, y: 50 }, { x: 50, y: 20 }, { x: 12, y: 50 }];
    points = Array.from({ length: n }, (_, i) => {
      const t = i * 4 / n, side = Math.floor(t), local = t - side;
      const a = vertices[side], b = vertices[(side + 1) % 4];
      return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
    });
  }

  if (layout === 'columns') {
    const columnCount = n < 10 ? 2 : 3;
    const counts = Array.from({ length: columnCount }, (_, column) => Math.floor((n + columnCount - 1 - column) / columnCount));
    const centers = columnCount === 2 ? [34, 66] : [24, 50, 76];
    counts.forEach((count, column) => {
      for (let row = 0; row < count; row++) points.push({ x: centers[column] + (row % 2 ? 2.5 : -2.5), y: spread(row, count, 24, 78) });
    });
  }

  if (layout === 'three_rows') {
    const base = Math.floor(n / 3), remainder = n % 3;
    const counts = [base, base + (remainder === 2 ? 1 : 0), base + (remainder >= 1 ? 1 : 0)];
    const ys = [29, 51, 73];
    counts.forEach((count, row) => {
      const step = count > 1 ? 68 / (count - 1) : 10;
      const offset = row === 0 ? -step * .42 : row === 1 ? step * .42 : 0;
      for (let i = 0; i < count; i++) points.push({ x: spread(i, count, 16, 84) + offset, y: ys[row] });
    });
  }

  if (layout === 'windows') {
    const counts = [Math.ceil(n / 3), Math.floor((n + 1) / 3), Math.floor(n / 3)];
    const ys = [28, 51, 74];
    counts.forEach((count, row) => {
      for (let i = 0; i < count; i++) {
        const step = count > 1 ? 70 / (count - 1) : 0;
        points.push({ x: spread(i, count, 15, 85) + (row - 1) * step * .22, y: ys[row] });
      }
    });
  }

  if (layout === 'solo_frame') {
    points = [{ x: 50, y: 78 }];
    for (let i = 0; i < n - 1; i++) {
      const angle = Math.PI + Math.PI * i / Math.max(n - 2, 1);
      points.push({ x: 50 + 38 * Math.cos(angle), y: 69 + 36 * Math.sin(angle) });
    }
  }

  if (layout === 'horseshoe') {
    points = Array.from({ length: n }, (_, i) => {
      const angle = Math.PI * .88 + Math.PI * 1.24 * i / (n - 1);
      return { x: 50 + 39 * Math.cos(angle), y: 69 + 44 * Math.sin(angle) };
    });
  }

  if (layout === 'x') {
    const first = Math.ceil(n / 2), second = n - first;
    for (let i = 0; i < first; i++) {
      const t = (i + .25) / first;
      points.push({ x: 14 + 72 * t, y: 20 + 60 * t });
    }
    for (let i = 0; i < second; i++) {
      const t = (i + .72) / second;
      points.push({ x: 86 - 72 * t, y: 20 + 60 * t });
    }
  }

  if (layout === 'block') {
    const columns = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / columns);
    for (let row = 0, used = 0; row < rows; row++) {
      const count = Math.min(columns, n - used), offset = row % 2 ? 3 : -3;
      for (let column = 0; column < count; column++, used++) points.push({ x: spread(column, count, 18, 82) + offset, y: spread(row, rows, 24, 78) });
    }
  }

  if (layout === 'zigzag') points = Array.from({ length: n }, (_, i) => ({ x: spread(i, n), y: i % 2 ? 68 : 37 }));

  if (layout === 'double_v') {
    const front = Math.ceil(n / 2), back = n - front;
    const makeV = (count, tip, min, max) => Array.from({ length: count }, (_, i) => {
      const x = spread(i, count, min, max);
      return { x, y: tip - Math.abs(x - 50) * 1.05 };
    });
    points = [...makeV(front, 80, 16, 84), ...makeV(back, 61, 22, 78).map(p => ({ ...p, x: p.x + 2 }))];
  }

  if (layout === 'star') {
    points = Array.from({ length: n }, (_, i) => {
      const angle = Math.PI / 2 + i * 2 * Math.PI / n, radius = i % 2 ? 24 : 39;
      return { x: 50 + radius * Math.cos(angle), y: 50 + radius * .82 * Math.sin(angle) };
    });
  }

  if (layout === 'cross') {
    const vertical = Math.ceil(n / 2), horizontal = n - vertical;
    for (let i = 0; i < vertical; i++) points.push({ x: 50 + (i % 2 ? 1.7 : -1.7), y: spread(i, vertical, 20, 80) });
    for (let i = 0; i < horizontal; i++) points.push({ x: spread(i, horizontal, 12, 88), y: 50 + (i % 2 ? 1.7 : -1.7) });
  }

  if (layout === 'cluster') {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    points = Array.from({ length: n }, (_, i) => {
      const radius = 7 + 34 * Math.sqrt(i / Math.max(n - 1, 1));
      return { x: 50 + radius * Math.cos(i * goldenAngle), y: 50 + radius * .72 * Math.sin(i * goldenAngle) };
    });
  }

  if (layout === 'wings') {
    const left = Math.ceil(n / 2), right = n - left;
    const wing = (count, side) => Array.from({ length: count }, (_, i) => {
      const t = count === 1 ? .5 : i / (count - 1);
      return { x: side === -1 ? 40 - 27 * Math.sin(t * Math.PI / 2) : 60 + 27 * Math.sin(t * Math.PI / 2), y: 24 + 54 * t };
    });
    points = [...wing(left, -1), ...wing(right, 1)];
  }

  return finish(points);
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
