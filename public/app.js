import { layouts, colors, clamp, positions, arrange, validScene } from './formations.js';
const $ = selector => document.querySelector(selector);
const key = 'praful-dance-v1';
let state = { title: 'Mon premier tableau', layout: 'rows', groups: 1, split: false, flipH: false, flipV: false, dancers: [] };
let saved = [], selected = null, history = [], toastTimer, storageOk = true;
let viewFlip = false;
try { viewFlip = localStorage.getItem(key + '-flip') === '1'; } catch {}
const clone = value => structuredClone(value);
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&':'&', '<':'<', '>':'>', '"':'"', "'":'&#39;' }[c]));
const layoutIds = new Set(layouts.map(([id]) => id));
const layoutCategories = [
  ['Lignes', ['line', 'rows', 'three_rows', 'stagger', 'windows', 'columns', 'zigzag', 'diagonal']],
  ['Pointes', ['v', 'inv_v', 'w', 'double_v', 'pyramid']],
  ['Courbes', ['arc', 'horseshoe', 'circle']],
  ['Blocs', ['block', 'diamond', 'cluster', 'cross', 'x', 'star']],
  ['Focus', ['solo_frame', 'wings']]
];
const troupeLayouts = new Set(['solo_frame', 'x', 'star']);
const layoutInfo = id => layouts.find(([layoutId]) => layoutId === id) || layouts.find(([layoutId]) => layoutId === 'rows');
const normalizeScene = scene => scene && typeof scene === 'object' ? { ...scene, layout: layoutIds.has(scene.layout) ? scene.layout : 'rows', flipH: !!scene.flipH, flipV: !!scene.flipV } : scene;
function suggestionFor(n) {
  if (n === 5) return 'Suggestion pour 5 : le Losange met naturellement une personne devant.';
  if (n === 8) return 'Suggestion pour 8 : essayez le W ou Deux lignes.';
  if (n === 9) return 'Suggestion pour 9 : la Pyramide crée une pointe et des rangs progressifs.';
  if (n >= 12) return 'Suggestion dès 12 : Trois lignes, 3 rangs décalés ou Files gardent la troupe lisible.';
  if (n <= 4) return 'Suggestion : Une ligne offre une lecture claire pour ce petit effectif.';
  return n % 2 ? 'Suggestion : un V valorise naturellement le centre d’un effectif impair.' : 'Suggestion : le Quinconce ouvre une fenêtre à chaque danseur.';
}
function createDancers(n, old = []) {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1, name: old[i]?.name || `Danseur ${i + 1}`, group: 1, subgroup: 1, x: 50, y: 50 }));
}
state.dancers = arrange(createDancers(9), state.layout);
try {
  const data = JSON.parse(localStorage.getItem(key));
  const current = normalizeScene(data?.current);
  const stored = Array.isArray(data?.saved) ? data.saved.map(normalizeScene) : null;
  if (data && validScene(current) && Array.isArray(stored) && stored.length <= 60 && stored.every(validScene)) {
    state = current; saved = stored;
  }
} catch { storageOk = false; }
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3200); }
function persist() {
  try { localStorage.setItem(key, JSON.stringify({ version: 1, current: state, saved })); storageOk = true; }
  catch { storageOk = false; }
  $('#storage-note').textContent = storageOk ? 'Sauvegarde automatique sur cet appareil. Exportez le projet pour le retrouver ailleurs.' : 'Sauvegarde locale indisponible. Téléchargez le projet pour conserver votre travail.';
}
function checkpoint() { history.push(clone(state)); if (history.length > 50) history.shift(); $('#undo').disabled = false; }
function distribute() {
  const counts = {};
  state.dancers.forEach((d, i) => { d.group = i % state.groups + 1; counts[d.group] = (counts[d.group] || 0) + 1; d.subgroup = (counts[d.group] - 1) % 2 + 1; });
}
function applyLayout() { state.dancers = arrange(state.dancers, state.layout, state.groups, state.split, state.flipH, state.flipV); }
const color = d => colors[(d.group - 1) % colors.length];
const groupLabel = d => state.groups === 1 ? 'Toute la troupe' : `Groupe ${d.group}${state.split ? ' · ' + (d.subgroup === 1 ? 'A' : 'B') : ''}`;
const displayY = y => viewFlip ? 100 - y : y;
function renderStage() {
  $('#stage').classList.toggle('dense', state.dancers.length > 20 || (state.layout === 'line' && state.dancers.length > 12));
  $('#stage-surround').classList.toggle('from-dancer', viewFlip);
  $('#flip').setAttribute('aria-pressed', viewFlip);
  $('#stage').setAttribute('aria-label', viewFlip ? 'Scène vue du danseur, public en haut' : 'Scène vue du dessus, public en bas');
  $('#dancers').innerHTML = state.dancers.map(d => `<button class="dancer${d.id === selected ? ' selected' : ''}" data-id="${d.id}" style="left:${d.x}%;top:${displayY(d.y)}%;--dancer:${color(d)}" aria-label="${escape(d.name)}, ${escape(groupLabel(d))}. Déplacer avec les flèches." aria-pressed="${d.id === selected}">${d.id}<small>${escape(d.name)}</small></button>`).join('');
}
function renderRoster() {
  $('#roster').innerHTML = state.dancers.map(d => `<button class="roster-row${d.id === selected ? ' active' : ''}" data-id="${d.id}" style="--dancer:${color(d)}" aria-pressed="${d.id === selected}"><span>${d.id}</span><span><strong>${escape(d.name)}</strong><small>${escape(groupLabel(d))}</small></span></button>`).join('');
}
function renderInspector() {
  const d = state.dancers.find(d => d.id === selected);
  $('#inspector').innerHTML = d ? `<div class="inspector-head"><strong>Danseur ${d.id}</strong><button id="close-inspector" aria-label="Fermer la sélection">×</button></div><label for="dancer-name">Prénom</label><input id="dancer-name" maxlength="40" value="${escape(d.name)}">${state.groups > 1 ? `<label for="dancer-group">Groupe</label><select id="dancer-group">${Array.from({length:state.groups},(_,i)=>`<option value="${i+1}" ${d.group===i+1?'selected':''}>Groupe ${i+1}</option>`).join('')}</select>` : ''}${state.groups > 1 && state.split ? `<label for="dancer-subgroup">Sous-groupe</label><select id="dancer-subgroup"><option value="1" ${d.subgroup===1?'selected':''}>A</option><option value="2" ${d.subgroup===2?'selected':''}>B</option></select>` : ''}` : '';
  if (!d) return;
  $('#close-inspector').onclick = () => { selected = null; render(); };
  $('#dancer-name').onchange = e => { checkpoint(); d.name = e.target.value.trim().slice(0,40) || `Danseur ${d.id}`; render(); persist(); };
  for (const [id, field] of [['dancer-group','group'], ['dancer-subgroup','subgroup']]) {
    const input = $(`#${id}`);
    if (input) input.onchange = e => { checkpoint(); d[field] = Number(e.target.value); render(); persist(); toast('Groupe modifié. ↻ réorganise les positions si besoin.'); };
  }
}
function renderSaved() {
  $('#saved-count').textContent = saved.length;
  $('#saved').innerHTML = saved.length ? saved.map((s, index) => `<article class="saved-card"><button class="saved-load" data-load="${index}" aria-label="Charger ${escape(s.title)}"><div class="saved-preview">${s.dancers.map(d => `<i style="left:${d.x}%;top:${displayY(d.y)}%;background:${color(d)}"></i>`).join('')}</div><strong>${String(index+1).padStart(2,'0')} · ${escape(s.title)}</strong><small>${s.dancers.length} danseurs · ${layoutInfo(s.layout)[1]}</small></button><button class="delete-saved" data-delete="${index}" aria-label="Supprimer ${escape(s.title)}">×</button></article>`).join('') : '<div class="empty-state"><strong>Votre prochain spectacle commence ici.</strong><br>Enregistrez votre première formation pour construire votre chorégraphie.</div>';
}
function render() {
  if (!layoutIds.has(state.layout)) state.layout = 'rows';
  const currentLayout = layoutInfo(state.layout);
  $('#count').value = state.dancers.length;
  $('#groups').value = state.groups;
  [...$('#groups').options].forEach(o => o.disabled = Number(o.value) > state.dancers.length);
  $('#split').checked = state.split; $('#split').disabled = state.groups === 1;
  $('#title').value = state.title;
  $('#minus').disabled = state.dancers.length <= 1; $('#plus').disabled = state.dancers.length >= 40;
  $('#undo').disabled = !history.length;
  $('#count-hint').textContent = state.dancers.length % 2 ? 'Un effectif impair ? On trouve l’équilibre.' : 'Une troupe prête à entrer en scène.';
  $('#stage-meta').textContent = `${state.dancers.length} danseur${state.dancers.length>1?'s':''} · ${viewFlip ? 'Vue danseur (public en haut)' : 'Vue public (public en bas)'}`;
  $('#roster-count').textContent = state.dancers.length;
  $('#tip-title').textContent = currentLayout[1];
  const groupTip = state.groups > 1
    ? troupeLayouts.has(state.layout) ? ' Cette disposition s’exprime mieux avec « Toute la troupe » ; en groupes, chaque couleur devient une mini-scène.' : ' Chaque couleur reprend cette disposition dans sa mini-scène.'
    : ' Personnalisez ensuite les positions à votre rythme.';
  $('#tip-text').textContent = `${currentLayout[2]}.${groupTip}`;
  $('#legend').innerHTML = state.groups > 1 ? Array.from({length:state.groups},(_,i)=>`<span><i style="background:${colors[i]}"></i>G${i+1} · ${state.dancers.filter(d=>d.group===i+1).length}</span>`).join('') : '';
  $('#flip-h').setAttribute('aria-pressed', !!state.flipH);
  $('#flip-v').setAttribute('aria-pressed', !!state.flipV);
  $('#layouts').innerHTML = `<p class="layout-suggestion">✦ ${suggestionFor(state.dancers.length)}</p>${layoutCategories.map(([category, ids]) => `<section class="layout-group"><h3>${category}</h3><div>${ids.map(id => { const [, title, desc] = layoutInfo(id); return `<button class="layout-option" data-layout="${id}" aria-pressed="${state.layout===id}"><span class="mini" aria-hidden="true">${positions(7,id,state.flipH,state.flipV).map(p=>`<i style="left:${p.x}%;top:${p.y}%"></i>`).join('')}</span><span><strong>${title}</strong><small>${desc}</small></span></button>`; }).join('')}</div></section>`).join('')}`;
  renderStage(); renderRoster(); renderInspector(); renderSaved();
}
function setCount(value) {
  const n = clamp(Math.round(Number(value) || 1), 1, 40);
  if (n === state.dancers.length) { $('#count').value = n; return; }
  checkpoint(); state.dancers = createDancers(n, state.dancers); state.groups = Math.min(state.groups, n);
  if (state.groups === 1) state.split = false;
  selected = null; distribute(); applyLayout(); render(); persist();
}
$('#count').onchange = e => setCount(e.target.value);
$('#plus').onclick = () => setCount(state.dancers.length + 1);
$('#minus').onclick = () => setCount(state.dancers.length - 1);
$('#groups').onchange = e => { checkpoint(); state.groups = Number(e.target.value); if (state.groups===1) state.split=false; distribute(); applyLayout(); render(); persist(); };
$('#split').onchange = e => { checkpoint(); state.split = e.target.checked; applyLayout(); render(); persist(); };
$('#layouts').onclick = e => { const button = e.target.closest('[data-layout]'); if (!button) return; checkpoint(); state.layout = button.dataset.layout; applyLayout(); render(); persist(); };
$('#title').onchange = e => { checkpoint(); state.title = e.target.value.trim().slice(0,100) || 'Tableau sans titre'; render(); persist(); };
$('#roster').onclick = e => { const button = e.target.closest('[data-id]'); if (button) { selected = Number(button.dataset.id); renderStage(); renderRoster(); renderInspector(); } };
$('#undo').onclick = () => { if (!history.length) return; state = history.pop(); selected = null; render(); persist(); toast('Dernière modification annulée'); };
$('#reset').onclick = () => { checkpoint(); applyLayout(); render(); persist(); toast('Disposition réappliquée'); };
$('#mirror').onclick = () => { checkpoint(); state.dancers.forEach(d => d.x = 100-d.x); render(); persist(); };
$('#flip-h').onclick = () => { checkpoint(); state.flipH = !state.flipH; applyLayout(); render(); persist(); toast(state.flipH ? 'Formation inversée horizontalement.' : 'Inversion horizontale de la formation annulée.'); };
$('#flip-v').onclick = () => { checkpoint(); state.flipV = !state.flipV; applyLayout(); render(); persist(); toast(state.flipV ? 'Formation inversée verticalement.' : 'Inversion verticale de la formation annulée.'); };
$('#flip').onclick = () => { viewFlip = !viewFlip; try { localStorage.setItem(key + '-flip', viewFlip ? '1' : '0'); } catch {} render(); toast(viewFlip ? 'Vue danseur : le public est en haut.' : 'Vue public : le public est en bas.'); };
$('#fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if ($('.stage-card').requestFullscreen) await $('.stage-card').requestFullscreen(); else toast('Le plein écran n’est pas disponible sur ce navigateur.'); } catch { toast('Le plein écran n’est pas disponible sur ce navigateur.'); } };
let drag = null;
$('#dancers').addEventListener('pointerdown', e => {
  const button = e.target.closest('[data-id]'); if (!button || (e.pointerType==='mouse' && e.button !== 0)) return;
  selected = Number(button.dataset.id);
  const d = state.dancers.find(d => d.id === selected), rect = $('#stage').getBoundingClientRect();
  drag = { id: d.id, pointer: e.pointerId, startX: e.clientX, startY: e.clientY, x: d.x, y: d.y, rect, moved: false };
  button.setPointerCapture(e.pointerId); button.focus({preventScroll:true});
  document.querySelectorAll('.dancer').forEach(b => { const active=Number(b.dataset.id)===selected; b.classList.toggle('selected',active); b.setAttribute('aria-pressed',active); });
  renderRoster(); renderInspector();
});
$('#dancers').addEventListener('pointermove', e => {
  if (!drag || drag.pointer !== e.pointerId) return;
  const dx=e.clientX-drag.startX, dy=e.clientY-drag.startY;
  if (!drag.moved && Math.hypot(dx,dy)<3) return;
  if (!drag.moved) { checkpoint(); drag.moved=true; }
  const d=state.dancers.find(d=>d.id===drag.id), button=$(`.dancer[data-id="${d.id}"]`);
  d.x=clamp(drag.x+dx/drag.rect.width*100,4,96); d.y=clamp(drag.y+(viewFlip?-1:1)*dy/drag.rect.height*100,5,92);
  button.style.left=d.x+'%'; button.style.top=displayY(d.y)+'%'; button.classList.add('dragging');
});
function finishDrag() { if (!drag) return; document.querySelector('.dragging')?.classList.remove('dragging'); drag=null; persist(); }
$('#dancers').addEventListener('pointerup', finishDrag);
$('#dancers').addEventListener('pointercancel', finishDrag);
$('#dancers').addEventListener('lostpointercapture', finishDrag);
$('#dancers').addEventListener('click', e => { const button=e.target.closest('[data-id]'); if (!button) return; selected=Number(button.dataset.id); document.querySelectorAll('.dancer').forEach(b=>{ const active=Number(b.dataset.id)===selected; b.classList.toggle('selected',active); b.setAttribute('aria-pressed',active); }); renderRoster(); renderInspector(); });
$('#dancers').addEventListener('keydown', e => {
  if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
  const button=e.target.closest('[data-id]'); if (!button) return;
  e.preventDefault(); checkpoint(); selected=Number(button.dataset.id);
  const d=state.dancers.find(d=>d.id===selected), step=e.shiftKey?5:1;
  d.x=clamp(d.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),4,96);
  const yDir = viewFlip ? -1 : 1;
  d.y=clamp(d.y+(e.key==='ArrowDown'?step*yDir:e.key==='ArrowUp'?-step*yDir:0),5,92);
  renderStage(); $(`.dancer[data-id="${selected}"]`).focus(); renderRoster(); renderInspector(); persist();
});
$('#save').onclick = () => { if (saved.length >= 60) return toast('60 tableaux maximum. Exportez le projet pour commencer une nouvelle série.'); saved.push(clone(state)); renderSaved(); persist(); toast('Tableau ajouté à votre chorégraphie'); };
$('#saved').onclick = e => {
  const remove=e.target.closest('[data-delete]'), load=e.target.closest('[data-load]');
  if (remove) { const i=Number(remove.dataset.delete); if (confirm(`Supprimer « ${saved[i].title} » des tableaux enregistrés ?`)) { saved.splice(i,1); renderSaved(); persist(); } }
  else if (load) { checkpoint(); state=clone(saved[Number(load.dataset.load)]); selected=null; render(); persist(); toast('Tableau chargé — vos modifications précédentes restent annulables'); }
};
function download(blob, filename) { const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),10000); }
$('#download').onclick = () => { download(new Blob([JSON.stringify({version:1,current:state,saved},null,2)],{type:'application/json'}),'praful-dance-projet.json'); toast('Projet exporté avec tous vos tableaux'); };
$('#import').onclick = () => $('#file').click();
$('#file').onchange = async e => {
  const file=e.target.files[0]; if (!file) return;
  try {
    if (file.size>2000000) throw new Error();
    const data=JSON.parse(await file.text());
    const current=normalizeScene(data.current), imported=Array.isArray(data.saved)?data.saved.map(normalizeScene):null;
    if (data.version!==1 || !validScene(current) || !Array.isArray(imported) || imported.length>60 || !imported.every(validScene)) throw new Error();
    if (!confirm('Remplacer le projet sur cet appareil par le fichier importé ? Pensez à sauvegarder votre projet actuel.')) return;
    state=clone(current); saved=clone(imported); history=[]; selected=null; render(); persist(); toast('Projet importé');
  } catch { toast('Fichier invalide : choisissez un projet JSON exporté par PRAFUL DANCE APP.'); }
  finally { e.target.value=''; }
};
$('#export').onclick = async () => {
  const canvas=document.createElement('canvas'); canvas.width=1800; canvas.height=1250; const c=canvas.getContext('2d');
  c.fillStyle='#f5f3ed'; c.fillRect(0,0,1800,1250); c.fillStyle='#292b26'; c.font='bold 28px sans-serif'; c.fillText('PRAFUL DANCE APP',80,75);
  c.font='38px sans-serif'; c.fillText(state.title,80,140,1430);
  c.fillStyle='#808278'; c.font='18px sans-serif'; c.fillText(`${state.dancers.length} danseurs · ${layoutInfo(state.layout)[1]} · ${state.groups===1?'Toute la troupe':state.groups+' groupes'}`,80,185);
  const logo=document.querySelector('.header-right img'); if (logo.complete && logo.naturalWidth) c.drawImage(logo,1490,45,230,65);
  const sx=100,sy=250,sw=1600,sh=790;
  c.fillStyle='#fffefa'; c.fillRect(sx,sy,sw,sh); c.strokeStyle='#dddacf'; c.strokeRect(sx,sy,sw,sh);
  c.fillStyle='#e0e1d6'; for(let x=sx+20;x<sx+sw;x+=30)for(let y=sy+20;y<sy+sh;y+=30){c.beginPath();c.arc(x,y,1,0,Math.PI*2);c.fill();}
  c.strokeStyle='#d4d7c9';c.setLineDash([6,6]);c.beginPath();c.moveTo(900,sy);c.lineTo(900,sy+sh);c.stroke();c.setLineDash([]);
  c.fillStyle='#808278';c.font='16px sans-serif';c.textAlign='center';c.fillText(viewFlip?'PUBLIC':'FOND DE SCÈNE',900,230);c.fillText(viewFlip?'FOND DE SCÈNE':'PUBLIC',900,1085);
  state.dancers.forEach(d=>{const x=sx+d.x*sw/100,y=sy+displayY(d.y)*sh/100,r=state.dancers.length>20?20:26;c.fillStyle=color(d);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='bold 20px sans-serif';c.fillText(d.id,x,y+7);c.fillStyle='#42483c';c.font='16px sans-serif';const label=state.split&&state.groups>1?`${d.name} · ${d.subgroup===1?'A':'B'}`:d.name;c.fillText(label,x,y+r+23,135);});
  c.textAlign='left';c.font='16px sans-serif';for(let i=0;i<state.groups;i++){const x=100+i*270;c.fillStyle=colors[i];c.fillRect(x,1130,12,12);c.fillStyle='#626959';c.fillText(state.groups===1?'Toute la troupe':`Groupe ${i+1}`,x+23,1143);}
  c.fillStyle='#8c9181';c.font='14px sans-serif';c.fillText('PARVATI INDIA · Votre studio de chorégraphie',100,1200);
  canvas.toBlob(blob=>{if(blob){download(blob,'praful-dance-formation.png');toast('Scène exportée en PNG');}else toast('Impossible de générer l’image.');},'image/png');
};
render(); persist();
