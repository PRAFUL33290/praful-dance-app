import test from 'node:test';
import assert from 'node:assert/strict';
import { layouts, positions, arrange, validScene } from '../public/formations.js';
test('Toutes les dispositions conservent les 1 à 40 danseurs sans positions identiques', () => {
  for (let n=1;n<=40;n++) for (const [layout] of layouts) {
    const points=positions(n,layout);
    assert.equal(points.length,n);
    assert.equal(new Set(points.map(p=>`${p.x.toFixed(6)},${p.y.toFixed(6)}`)).size,n,`${layout}, ${n}`);
    for (const p of points) assert.ok(p.x>=8&&p.x<=92&&p.y>=16&&p.y<=84);
  }
});
test('Les deux lignes sont centrées et leur effectif diffère au plus de un', () => {
  for(let n=2;n<=40;n++){
    const p=positions(n,'rows'),back=p.filter(d=>d.y===33),front=p.filter(d=>d.y===68);
    assert.ok(Math.abs(back.length-front.length)<=1);
    for(const row of [back,front]) assert.ok(Math.abs(row.reduce((sum,p)=>sum+p.x,0)/row.length-50)<1e-8);
    if(n%2) assert.ok(p.some(d=>d.x===50));
  }
});
test('Les groupes et sous-groupes respectent les identités et restent sur scène', () => {
  for(let n=1;n<=40;n++)for(let groups=1;groups<=Math.min(n,6);groups++)for(const split of [false,true])for(const [layout] of layouts){
    const counts={};
    const dancers=Array.from({length:n},(_,i)=>{const group=i%groups+1;counts[group]=(counts[group]||0)+1;return {id:i+1,name:`Danseur ${i+1}`,group,subgroup:(counts[group]-1)%2+1,x:50,y:50};});
    const placed=arrange(dancers,layout,groups,split);
    assert.ok(validScene({title:'Test',layout,groups,split,dancers:placed}),`${n}/${groups}/${layout}/${split}`);
    assert.deepEqual(placed.map(({x,y,...rest})=>rest),dancers.map(({x,y,...rest})=>rest));
    assert.ok(dancers.every(d=>d.x===50&&d.y===50));
  }
});
test('L’import refuse les projets invalides',()=>{
  const scene={title:'Test',layout:'rows',groups:1,split:false,dancers:[{id:1,name:'Julien',group:1,subgroup:1,x:50,y:50}]};
  assert.ok(validScene(scene));
  for(const invalid of [null,{}, {...scene,layout:'unknown'},{...scene,groups:9},{...scene,dancers:[]},{...scene,dancers:[...scene.dancers,...scene.dancers]},{...scene,dancers:[{...scene.dancers[0],x:Infinity}]},{...scene,title:'x'.repeat(101)}])assert.equal(validScene(invalid),false);
});
test('Les nouvelles formations respectent leurs points de repère',()=>{
  assert.deepEqual(positions(1,'solo_frame'),[{x:50,y:52}]);
  assert.deepEqual(positions(9,'solo_frame')[0],{x:50,y:78});
  assert.deepEqual(positions(9,'pyramid')[0],{x:50,y:80});
  assert.deepEqual(new Set(positions(8,'columns').map(p=>Math.round(p.x/10)*10)),new Set([30,40,60,70]));
  assert.equal(new Set(positions(12,'columns').map(p=>Math.round(p.x/10)*10)).size,5);
  assert.equal(layouts.length,23);
});
