/* Requiere que js/data.js se cargue antes y defina la constante global DATA. */

/* ---------- helpers ---------- */
const NIVEL_COLOR = {insuf:'var(--nivel-insuf)', ed:'var(--nivel-ed)', sat:'var(--nivel-sat)', sob:'var(--nivel-sob)'};
const NIVEL_LABEL = {insuf:'Insuficiente', ed:'En desarrollo', sat:'Satisfactorio', sob:'Sobresaliente'};
function nivelBand(pct){ return pct<50 ? 'insuf' : pct<70 ? 'ed' : pct<90 ? 'sat' : 'sob'; }
function el(tag, attrs, children){
  const e = document.createElement(tag);
  if(attrs) for(const k in attrs){
    if(k==='class') e.className = attrs[k];
    else if(k==='style') e.style.cssText = attrs[k];
    else if(k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if(children!=null) (Array.isArray(children)?children:[children]).forEach(c=>{
    if(c==null) return;
    e.appendChild(typeof c==='string' || typeof c==='number' ? document.createTextNode(c) : c);
  });
  return e;
}
const ICON_PATHS = {
  clipboard:'<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>',
  trending:'<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
  award:'<circle cx="12" cy="8" r="6"/><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  bars:'<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
  layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  scale:'<line x1="7" y1="20" x2="7" y2="10"/><line x1="17" y1="20" x2="17" y2="4"/><line x1="2" y1="20" x2="22" y2="20"/>',
  alert:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  check:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  list:'<path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="m3 15 2 2 4-4"/><path d="M13 16h8"/>',
};
function icon(name){
  const wrap = document.createElement('div');
  wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]||''}</svg>`;
  return wrap.firstElementChild;
}
function iconBadge(name){
  const badge = el('div',{class:'icon-badge'});
  badge.appendChild(icon(name));
  return badge;
}
const tooltip = document.getElementById('tooltip');
function showTip(evt, text){
  tooltip.textContent = text;
  tooltip.style.display = 'block';
  const x = evt.clientX, y = evt.clientY;
  tooltip.style.left = Math.min(x+12, window.innerWidth-250)+'px';
  tooltip.style.top = (y+16)+'px';
}
function hideTip(){ tooltip.style.display='none'; }
function attachTip(elm, text){
  elm.addEventListener('mousemove', e=>showTip(e,text));
  elm.addEventListener('mouseleave', hideTip);
}
function fmt1(n){ return (Math.round(n*10)/10).toString().replace('.0',''); }
function programKey(c){ return c.carrera+'|'+c.modalidad; }
function programLabel(c){ return c.carrera + ' (' + (c.modalidad==='Presencial'?'Presencial':'En línea') + ')'; }

/* ---------- build program index ---------- */
const programs = {};
DATA.courses.forEach(c=>{
  const k = programKey(c);
  if(!programs[k]) programs[k] = {carrera:c.carrera, modalidad:c.modalidad, label:programLabel(c), ta1:null, ta2:null};
  programs[k]['ta'+c.ta] = c;
});
const programList = Object.values(programs).sort((a,b)=> (b.ta2? b.ta2.n:0)+(b.ta1?b.ta1.n:0) - ((a.ta2?a.ta2.n:0)+(a.ta1?a.ta1.n:0)) );

const compByCourse = {};
DATA.competencias.forEach(r=>{ if(!compByCourse[r.curso_id]) compByCourse[r.curso_id] = []; compByCourse[r.curso_id].push(r); });
const itemsByCourse = {};
DATA.items.forEach(r=>{ if(!itemsByCourse[r.curso_id]) itemsByCourse[r.curso_id] = []; itemsByCourse[r.curso_id].push(r); });

/* ---------- institutional KPIs ---------- */
function weighted(courses, key){
  let sw=0, s=0;
  courses.forEach(c=>{ s += c[key]*c.n; sw += c.n; });
  return sw? s/sw : 0;
}
const ta1Courses = DATA.courses.filter(c=>c.ta===1);
const ta2Courses = DATA.courses.filter(c=>c.ta===2);
const totalN1 = ta1Courses.reduce((a,c)=>a+c.n,0);
const totalN2 = ta2Courses.reduce((a,c)=>a+c.n,0);
const satSob1 = ta1Courses.reduce((a,c)=>a+c.counts.sat+c.counts.sob,0);
const satSob2 = ta2Courses.reduce((a,c)=>a+c.counts.sat+c.counts.sob,0);
const promTA1 = weighted(ta1Courses,'prom');
const promTA2 = weighted(ta2Courses,'prom');
const nPreguntas = c=> (itemsByCourse[c.id]||[]).length;
const totalPreguntasTA1 = ta1Courses.reduce((a,c)=>a+nPreguntas(c),0);
const totalPreguntasTA2 = ta2Courses.reduce((a,c)=>a+nPreguntas(c),0);
const totalMat1 = ta1Courses.reduce((a,c)=>a+(c.matriculados||0),0);
const totalMat2 = ta2Courses.reduce((a,c)=>a+(c.matriculados||0),0);
const faltaron1 = totalMat1 - totalN1;
const faltaron2 = totalMat2 - totalN2;
const part1Pct = totalMat1 ? totalN1/totalMat1*100 : null;
const part2Pct = totalMat2 ? totalN2/totalMat2*100 : null;

/* ================= GLOBAL VIEW ================= */
const gView = document.getElementById('view-global');

function kpiRow(items){
  const row = el('div',{class:'kpi-row'});
  items.forEach(it=>{
    const top = el('div',{class:'kpi-top'});
    if(it.icon) top.appendChild(iconBadge(it.icon));
    top.appendChild(el('div',{class:'label'}, it.label));
    const box = el('div',{class:'kpi'},[
      top,
      el('div',{class:'value'}, it.value),
    ]);
    if(it.delta!=null){
      box.appendChild(el('div',{class:'delta '+(it.deltaGood?'good':'bad')}, it.delta));
    }
    if(it.sub) box.appendChild(el('div',{class:'sub'}, it.sub));
    row.appendChild(box);
  });
  return row;
}

gView.appendChild(kpiRow([
  {label:'Participación — TA1', icon:'users', value: part1Pct!=null? fmt1(part1Pct)+'%':'—', sub: totalN1.toLocaleString('es-EC')+' de '+totalMat1.toLocaleString('es-EC')+' matriculados', delta: faltaron1+' no rindieron', deltaGood:false},
  {label:'Promedio TA1', icon:'trending', value: fmt1(promTA1)+'%', sub: totalN1.toLocaleString('es-EC')+' estudiantes evaluados'},
  {label:'Preguntas — TA1', icon:'list', value: totalPreguntasTA1.toLocaleString('es-EC'), sub: ta1Courses.length+' carreras evaluadas'},
  {label:'% Satisfactorio o superior — TA1', icon:'award', value: fmt1(satSob1/totalN1*100)+'%'},
]));
gView.appendChild(kpiRow([
  {label:'Participación — TA2', icon:'users', value: part2Pct!=null? fmt1(part2Pct)+'%':'—', sub: totalN2.toLocaleString('es-EC')+' de '+totalMat2.toLocaleString('es-EC')+' matriculados', delta: faltaron2+' no rindieron', deltaGood:false},
  {label:'Promedio TA2', icon:'trending', value: fmt1(promTA2)+'%', sub: totalN2.toLocaleString('es-EC')+' estudiantes evaluados'},
  {label:'Preguntas — TA2', icon:'list', value: totalPreguntasTA2.toLocaleString('es-EC'), sub: ta2Courses.length+' carreras evaluadas'},
  {label:'% Satisfactorio o superior — TA2', icon:'award', value: fmt1(satSob2/totalN2*100)+'%'},
]));

/* --- participación: rendidos vs. matriculados por programa (dumbbell: punto tenue
   = matriculados, punto solido = rindieron, unidos por una linea que representa
   la brecha de los que faltaron) --- */
function dumbbellCard(){
  const partCard = el('div',{class:'card'});
  partCard.appendChild(el('h2',null,[iconBadge('users'),'Participación — estudiantes evaluados vs. matriculados']));
  partCard.appendChild(el('p',{class:'caption'},'De los estudiantes matriculados en el aula virtual, cuántos efectivamente rindieron el test, por programa. Ordenado de menor a mayor participación.'));
  let partTA = 2;
  const partToggle = el('div',{class:'stack-toggle'});
  const partBtnTA1 = el('button',{class:'pill', onclick:()=>{partTA=1;renderPart();partBtnTA1.classList.add('active');partBtnTA2.classList.remove('active');}},'TA1');
  const partBtnTA2 = el('button',{class:'pill active', onclick:()=>{partTA=2;renderPart();partBtnTA2.classList.add('active');partBtnTA1.classList.remove('active');}},'TA2');
  partToggle.appendChild(partBtnTA1); partToggle.appendChild(partBtnTA2);
  partCard.appendChild(partToggle);
  const partLegend = el('div',{class:'legend'});
  partCard.appendChild(partLegend);
  const partBody = el('div',null,null);
  partCard.appendChild(partBody);
  function renderPart(){
    const color = partTA===1 ? 'var(--series-1)' : 'var(--series-2)';
    const lightColor = `color-mix(in srgb, ${color} 35%, var(--surface-1))`;
    partLegend.innerHTML = '';
    partLegend.appendChild(el('div',{class:'legend-item'},[el('span',{class:'swatch round',style:`background:${lightColor}`}), 'Matriculados']));
    partLegend.appendChild(el('div',{class:'legend-item'},[el('span',{class:'swatch round',style:`background:${color}`}), 'Rindieron']));
    partBody.innerHTML = '';
    const rows = programList
      .filter(p=>p['ta'+partTA] && p['ta'+partTA].matriculados)
      .map(p=>{ const c = p['ta'+partTA]; return {p, c, pct: c.n/c.matriculados*100}; })
      .sort((a,b)=> a.pct - b.pct);
    rows.forEach(({p,c,pct})=>{
      const row = el('div',{class:'hbar-row clickable', onclick:()=>goToProgram(p)});
      row.appendChild(el('div',{class:'hlabel'},[el('b',null,p.label)]));
      const track = el('div',{class:'dumbbell-track'});
      track.appendChild(el('div',{class:'dumbbell-line', style:`left:${pct}%;right:0;`}));
      track.appendChild(el('div',{class:'dumbbell-dot', style:`left:100%;background:${lightColor}`}));
      track.appendChild(el('div',{class:'dumbbell-dot', style:`left:${pct}%;background:${color}`}));
      row.appendChild(track);
      row.appendChild(el('div',{class:'hval'}, fmt1(pct)+'%'));
      attachTip(row, p.label+' — '+c.n+' de '+c.matriculados+' matriculados rindieron ('+(c.matriculados-c.n)+' no rindieron)');
      partBody.appendChild(row);
    });
  }
  renderPart();
  return partCard;
}

/* --- resultado por programa, TA1 y TA2 como paneles independientes --- */
function rankCard(title, taKey){
  const card = el('div',{class:'card'});
  card.appendChild(el('h2',null,[iconBadge('bars'), title]));
  card.appendChild(el('p',{class:'caption'},'Promedio global de los estudiantes evaluados en esta ronda. Clic en un programa para ver su detalle.'));
  const list = programList.filter(p=>p[taKey]).slice().sort((a,b)=> b[taKey].prom - a[taKey].prom);
  list.forEach(p=>{
    const c = p[taKey];
    const row = el('div',{class:'hbar-row clickable', onclick:()=>goToProgram(p)});
    row.appendChild(el('div',{class:'hlabel'},[el('b',null,p.label)]));
    const track = el('div',{class:'hbar-track'});
    const fill = el('div',{class:'hbar-fill', style:`width:${c.prom}%;background:var(--series-1)`});
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('div',{class:'hval'}, fmt1(c.prom)+'%'));
    attachTip(row, p.label+' — '+fmt1(c.prom)+'% ('+c.n+' estudiantes)');
    card.appendChild(row);
  });
  return card;
}
const rankGrid = el('div',{class:'grid-2'});
rankGrid.appendChild(rankCard('Resultado por programa — TA1', 'ta1'));
rankGrid.appendChild(rankCard('Resultado por programa — TA2', 'ta2'));
gView.appendChild(rankGrid);

/* --- cantidad de preguntas por programa --- */
const qCard = el('div',{class:'card'});
qCard.appendChild(el('h2',null,[iconBadge('list'),'Cantidad de preguntas por programa']));
qCard.appendChild(el('p',{class:'caption'},'Número de preguntas del test aplicadas en cada carrera, por ronda.'));
let qTA = 2;
const qToggle = el('div',{class:'stack-toggle'});
const qBtnTA1 = el('button',{class:'pill', onclick:()=>{qTA=1;renderQ();qBtnTA1.classList.add('active');qBtnTA2.classList.remove('active');}},'TA1');
const qBtnTA2 = el('button',{class:'pill active', onclick:()=>{qTA=2;renderQ();qBtnTA2.classList.add('active');qBtnTA1.classList.remove('active');}},'TA2');
qToggle.appendChild(qBtnTA1); qToggle.appendChild(qBtnTA2);
qCard.appendChild(qToggle);
const qBody = el('div',null,null);
qCard.appendChild(qBody);
const maxPreguntas = Math.max(...programList.flatMap(p=>[p.ta1?nPreguntas(p.ta1):0, p.ta2?nPreguntas(p.ta2):0]));
function renderQ(){
  qBody.innerHTML = '';
  const color = qTA===1 ? 'var(--series-1)' : 'var(--series-2)';
  const sorted = programList.filter(p=>p['ta'+qTA]).slice().sort((a,b)=> nPreguntas(b['ta'+qTA]) - nPreguntas(a['ta'+qTA]));
  sorted.forEach(p=>{
    const c = p['ta'+qTA];
    const n = nPreguntas(c);
    const row = el('div',{class:'hbar-row', style:'grid-template-columns:190px 1fr 46px'});
    row.appendChild(el('div',{class:'hlabel'},[el('b',null,p.label)]));
    const track = el('div',{class:'hbar-track'});
    const fill = el('div',{class:'hbar-fill', style:`width:${n/maxPreguntas*100}%;background:${color}`});
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('div',{class:'hval'}, n));
    attachTip(row, p.label+' — TA'+qTA+': '+n+' preguntas');
    qBody.appendChild(row);
  });
}
renderQ();
const partQGrid = el('div',{class:'grid-2'});
partQGrid.appendChild(dumbbellCard());
partQGrid.appendChild(qCard);
gView.appendChild(partQGrid);

/* --- stacked 100% bar: distribución de niveles por programa --- */
const sCard = el('div',{class:'card'});
sCard.appendChild(el('h2',null,[iconBadge('layers'),'Distribución de niveles de logro por programa']));
sCard.appendChild(el('p',{class:'caption'},'Porcentaje de estudiantes en cada nivel de logro. Clic en un programa para ver su detalle · clic en la leyenda para aislar un nivel.'));
let stackTA = 2;
const stackToggle = el('div',{class:'stack-toggle'});
const btnTA1 = el('button',{class:'pill', onclick:()=>{stackTA=1;renderStack();btnTA1.classList.add('active');btnTA2.classList.remove('active');}},'TA1');
const btnTA2 = el('button',{class:'pill active', onclick:()=>{stackTA=2;renderStack();btnTA2.classList.add('active');btnTA1.classList.remove('active');}},'TA2');
stackToggle.appendChild(btnTA1); stackToggle.appendChild(btnTA2);
sCard.appendChild(stackToggle);
const globalHiddenLevels = new Set();
const globalLegend = el('div',{class:'legend'});
['insuf','ed','sat','sob'].forEach(k=>{
  const item = el('div',{class:'legend-item toggle'},[el('span',{class:'swatch',style:`background:${NIVEL_COLOR[k]}`}), NIVEL_LABEL[k]]);
  item.addEventListener('click', ()=>{
    if(globalHiddenLevels.has(k)) globalHiddenLevels.delete(k); else globalHiddenLevels.add(k);
    item.classList.toggle('off', globalHiddenLevels.has(k));
    renderStack();
  });
  globalLegend.appendChild(item);
});
sCard.appendChild(globalLegend);
const stackBody = el('div',null,null);
sCard.appendChild(stackBody);
function renderStack(){
  stackBody.innerHTML = '';
  const sorted = programList.slice().sort((a,b)=>{
    const ca = a['ta'+stackTA], cb = b['ta'+stackTA];
    return (cb?cb.prom:-1) - (ca?ca.prom:-1);
  });
  sorted.forEach(p=>{
    const c = p['ta'+stackTA];
    const row = el('div',{class:'stack-row clickable', onclick:()=>goToProgram(p)});
    row.appendChild(el('div',{class:'stack-label'}, p.label));
    const bar = el('div',{class:'stack-bar'});
    if(c){
      ['insuf','ed','sat','sob'].forEach(k=>{
        const pct = c.pct[k];
        if(pct<=0) return;
        const seg = el('div',{class:'stack-seg', style:`width:${pct}%;background:${NIVEL_COLOR[k]};opacity:${globalHiddenLevels.has(k)?0.15:1}`});
        attachTip(seg, NIVEL_LABEL[k]+': '+fmt1(pct)+'% ('+c.counts[k]+' est.)');
        bar.appendChild(seg);
      });
    }
    row.appendChild(bar);
    row.appendChild(el('div',{class:'stack-n'}, c? 'n = '+c.n : 'sin datos'));
    stackBody.appendChild(row);
  });
}
renderStack();
gView.appendChild(sCard);

/* --- CE vs CT institutional --- */
const ceCT = {CE:[], CT:[]};
DATA.competencias.forEach(r=>{ (r.competencia.startsWith('CE')?ceCT.CE:ceCT.CT).push(r.prom); });
const avgCE = ceCT.CE.reduce((a,b)=>a+b,0)/ceCT.CE.length;
const avgCT = ceCT.CT.reduce((a,b)=>a+b,0)/ceCT.CT.length;

/* --- items institucionales: peores y mejores --- */
const worstItems = DATA.items.filter(i=>i.pct<50).sort((a,b)=>a.pct-b.pct).slice(0,10);
const bestItems = DATA.items.slice().sort((a,b)=>b.pct-a.pct).slice(0,10);

const ceCard = el('div',{class:'card'});
ceCard.appendChild(el('h2',null,[iconBadge('scale'),'Competencias específicas vs. transversales']));
ceCard.appendChild(el('p',{class:'caption'},'Promedio de logro institucional, todas las aplicaciones del test.'));
[['Específicas (CE)',avgCE,'var(--series-1)'], ['Transversales (CT)',avgCT,'var(--series-2)']].forEach(([label,val,color])=>{
  const row = el('div',{class:'hbar-row', style:'grid-template-columns:130px 1fr 46px'});
  row.appendChild(el('div',{class:'hlabel'},[el('b',null,label)]));
  const track = el('div',{class:'hbar-track'});
  const fill = el('div',{class:'hbar-fill', style:`width:${val}%;background:${color}`});
  track.appendChild(fill);
  row.appendChild(track);
  row.appendChild(el('div',{class:'hval'}, fmt1(val)+'%'));
  attachTip(row, label+': '+fmt1(val)+'% de logro promedio institucional');
  ceCard.appendChild(row);
});
gView.appendChild(ceCard);

function itemListCard(title, caption, items, emptyMsg, iconName){
  const card = el('div',{class:'card'});
  card.appendChild(el('h2',null,[iconBadge(iconName), title]));
  card.appendChild(el('p',{class:'caption'},caption));
  if(items.length===0){
    card.appendChild(el('div',{class:'empty-note'},emptyMsg));
  } else {
    items.forEach(it=>{
      const course = DATA.courses.find(c=>c.id===it.curso_id);
      const band = nivelBand(it.pct);
      const row = el('div',{class:'hbar-row clickable', onclick:()=>{
        const target = programList.find(p=> (p.ta1&&p.ta1.id===it.curso_id) || (p.ta2&&p.ta2.id===it.curso_id));
        if(target) goToProgram(target, {comp: firstCompCode(it.competencias), nivel: band, ronda: course? 'TA'+course.ta : null});
      }});
      row.appendChild(el('div',{class:'hlabel'},[el('b',null,it.codigo),' · '+(course?course.carrera:'')+' · '+it.competencias]));
      const track = el('div',{class:'hbar-track'});
      const fill = el('div',{class:'hbar-fill', style:`width:${it.pct}%;background:${NIVEL_COLOR[band]}`});
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('div',{class:'hval'}, fmt1(it.pct)+'%'));
      attachTip(row, 'Clic para ver este ítem en el detalle de '+(course?course.carrera:'su carrera'));
      card.appendChild(row);
    });
  }
  return card;
}

const grid2 = el('div',{class:'grid-2'});
grid2.appendChild(itemListCard(
  'Ítems con menor % de aciertos (institucional)',
  'Preguntas en nivel Insuficiente (< 50%) en toda la institución.',
  worstItems, 'Ningún ítem por debajo del 50% a nivel institucional.', 'alert'
));
grid2.appendChild(itemListCard(
  'Ítems con mayor % de aciertos (institucional)',
  'Las 10 preguntas con más aciertos en toda la institución.',
  bestItems, 'Sin datos.', 'check'
));
gView.appendChild(grid2);

/* ================= POR CARRERA VIEW ================= */
const cView = document.getElementById('view-carrera');
const selRow = el('div',{class:'selector-row'});
const carreraBody = el('div',null,null);
cView.appendChild(selRow);
cView.appendChild(carreraBody);

let activeProgram = programList[0];
let carreraCompFilter = null;
let carreraNivelFilter = null;
let carreraTipoFilter = null;
let carreraRondaFilter = null;
let carreraHiddenLevels = new Set();
let carreraArtExpanded = new Set();
const selBtns = [];
programList.forEach(p=>{
  const totalN2 = (p.ta1?p.ta1.n:0)+(p.ta2?p.ta2.n:0);
  const btn = el('button',{class:'sel-btn'+(p===activeProgram?' active':''), onclick:()=>{
    activeProgram = p;
    carreraCompFilter = null;
    carreraNivelFilter = null;
    carreraTipoFilter = null;
    carreraRondaFilter = null;
    carreraHiddenLevels = new Set();
    selBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderCarrera();
  }},[p.label, el('span',{class:'n'}, totalN2+' estudiantes')]);
  selBtns.push(btn);
  selRow.appendChild(btn);
});

function goToProgram(p, opts){
  activeProgram = p;
  carreraCompFilter = (opts && opts.comp) || null;
  carreraNivelFilter = (opts && opts.nivel) || null;
  carreraTipoFilter = null;
  carreraRondaFilter = (opts && opts.ronda) || null;
  carreraHiddenLevels = new Set();
  selBtns.forEach((b,i)=> b.classList.toggle('active', programList[i]===p));
  renderCarrera();
  const carreraTab = document.querySelector('.tab-btn[data-view="carrera"]');
  if(carreraTab) carreraTab.click();
}

function firstCompCode(str){ return str.split('/')[0].trim(); }

const COMP_ORDER = ['CE1','CE2','CE3','CE4','CT1','CT2','CT3','CT4'];

function renderCarrera(){
  carreraBody.innerHTML = '';
  const p = activeProgram;

  const v1 = p.ta1, v2 = p.ta2;
  const c1list = compByCourse[v1?v1.id:''] || [];
  const c2list = compByCourse[v2?v2.id:''] || [];

  /* filtro activo: por competencia especifica (carreraCompFilter) o por tipo CE/CT (carreraTipoFilter),
     cada uno combinado con una ronda (carreraRondaFilter) — las 4 combinaciones CE/CT x TA1/TA2 son
     independientes entre si, seleccionar una no afecta el calculo de la ronda que no coincide. */
  function matches(code, pred){ return pred(code); }
  function avgByPred(list, pred){
    const vals = list.filter(r=>matches(r.competencia,pred)).map(r=>r.prom);
    return vals.length? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  }
  function avgPctByPred(list, pred){
    const found = list.filter(r=>matches(r.competencia,pred));
    if(!found.length) return null;
    const out = {};
    ['insuf','ed','sat','sob'].forEach(k=> out[k] = found.reduce((a,r)=>a+r.pct[k],0)/found.length);
    return out;
  }
  function sumItemsByPred(list, pred){
    const found = list.filter(r=>matches(r.competencia,pred));
    return found.length? found.reduce((a,r)=>a+r.n_items,0) : null;
  }
  const tipoName = {CE:'Específicas (CE)', CT:'Transversales (CT)'};
  const filterPred = carreraCompFilter ? (code=>code===carreraCompFilter) : (carreraTipoFilter ? (code=>code.startsWith(carreraTipoFilter)) : null);
  const filterLabel = carreraCompFilter ? carreraCompFilter : (carreraTipoFilter ? tipoName[carreraTipoFilter] : null);
  function roundApplies(round){ return !carreraRondaFilter || carreraRondaFilter===round; }
  const appliesTA1 = !!filterPred && roundApplies('TA1');
  const appliesTA2 = !!filterPred && roundApplies('TA2');

  if(filterPred){
    const fullLabel = filterLabel+(carreraRondaFilter? ' · '+carreraRondaFilter : '');
    carreraBody.appendChild(el('button',{class:'filter-chip', style:'font-size:13px;padding:8px 10px 8px 16px;', onclick:()=>{carreraCompFilter=null;carreraTipoFilter=null;carreraRondaFilter=null;renderCarrera();}},
      ['Filtrando todo el dashboard por: '+fullLabel, el('span',{class:'x'},'✕')]));
  }

  /* si el filtro trae una ronda especifica (siempre es el caso al hacer clic en un elemento),
     la ronda que NO coincide queda excluida del todo: sus tarjetas muestran 0, no su valor original —
     asi el filtro se comporta como en PowerBI: la seleccion excluye todo lo que no calza. */
  const excludedTA1 = filterPred && !appliesTA1;
  const excludedTA2 = filterPred && !appliesTA2;
  const estudiantesTA1F = excludedTA1 ? 0 : (v1? v1.n : null);
  const estudiantesTA2F = excludedTA2 ? 0 : (v2? v2.n : null);
  const promTA1F = appliesTA1 ? avgByPred(c1list, filterPred) : (excludedTA1 ? 0 : (v1? v1.prom : null));
  const promTA2F = appliesTA2 ? avgByPred(c2list, filterPred) : (excludedTA2 ? 0 : (v2? v2.prom : null));
  const preguntasTA1F = appliesTA1 ? sumItemsByPred(c1list, filterPred) : (excludedTA1 ? 0 : (v1? nPreguntas(v1) : null));
  const preguntasTA2F = appliesTA2 ? sumItemsByPred(c2list, filterPred) : (excludedTA2 ? 0 : (v2? nPreguntas(v2) : null));
  const matTA1 = v1 ? v1.matriculados : null;
  const matTA2 = v2 ? v2.matriculados : null;
  const matTA1F = excludedTA1 ? 0 : matTA1;
  const matTA2F = excludedTA2 ? 0 : matTA2;
  const partTA1F = excludedTA1 ? 0 : (matTA1 ? estudiantesTA1F/matTA1*100 : null);
  const partTA2F = excludedTA2 ? 0 : (matTA2 ? estudiantesTA2F/matTA2*100 : null);

  carreraBody.appendChild(kpiRow([
    {label:'Estudiantes TA1', icon:'users', value: estudiantesTA1F!=null? estudiantesTA1F : '—', sub: appliesTA1? 'misma cohorte, medida en '+filterLabel : (excludedTA1? 'fuera del filtro actual' : '')},
    {label:'Participación TA1', icon:'users', value: partTA1F!=null? fmt1(partTA1F)+'%':'—', sub: matTA1F!=null? (estudiantesTA1F+' de '+matTA1F+' matriculados') : (excludedTA1? 'fuera del filtro actual' : '')},
    {label:'Preguntas TA1'+(appliesTA1?' · '+filterLabel:''), icon:'list', value: preguntasTA1F!=null? preguntasTA1F : '—'},
    {label:'Promedio TA1'+(appliesTA1?' · '+filterLabel:''), icon:'trending', value: promTA1F!=null? fmt1(promTA1F)+'%':'—', sub: v1? (appliesTA1? '' : (excludedTA1? 'fuera del filtro actual' : v1.nivel)): ''},
  ]));
  carreraBody.appendChild(kpiRow([
    {label:'Estudiantes TA2', icon:'users', value: estudiantesTA2F!=null? estudiantesTA2F : '—', sub: appliesTA2? 'misma cohorte, medida en '+filterLabel : (excludedTA2? 'fuera del filtro actual' : '')},
    {label:'Participación TA2', icon:'users', value: partTA2F!=null? fmt1(partTA2F)+'%':'—', sub: matTA2F!=null? (estudiantesTA2F+' de '+matTA2F+' matriculados') : (excludedTA2? 'fuera del filtro actual' : '')},
    {label:'Preguntas TA2'+(appliesTA2?' · '+filterLabel:''), icon:'list', value: preguntasTA2F!=null? preguntasTA2F : '—'},
    {label:'Promedio TA2'+(appliesTA2?' · '+filterLabel:''), icon:'trending', value: promTA2F!=null? fmt1(promTA2F)+'%':'—', sub: v2? (appliesTA2? '' : (excludedTA2? 'fuera del filtro actual' : v2.nivel)): ''},
  ]));

  /* stacked nivel TA1 vs TA2 */
  const sCard2 = el('div',{class:'card'});
  sCard2.appendChild(el('h2',null,[iconBadge('layers'),'Distribución de niveles: TA1 y TA2']));
  sCard2.appendChild(el('p',{class:'caption'},'Clic en la leyenda para aislar un nivel.'+((appliesTA1||appliesTA2)?(' Recalculado solo con '+filterLabel+(carreraRondaFilter?' ('+carreraRondaFilter+')':'')+'.'):'')));
  const carreraLegend = el('div',{class:'legend'});
  ['insuf','ed','sat','sob'].forEach(k=>{
    const item = el('div',{class:'legend-item toggle'+(carreraHiddenLevels.has(k)?' off':'')},[el('span',{class:'swatch',style:`background:${NIVEL_COLOR[k]}`}), NIVEL_LABEL[k]]);
    item.addEventListener('click', ()=>{
      if(carreraHiddenLevels.has(k)) carreraHiddenLevels.delete(k); else carreraHiddenLevels.add(k);
      renderCarrera();
    });
    carreraLegend.appendChild(item);
  });
  sCard2.appendChild(carreraLegend);
  [['TA1',v1,c1list,appliesTA1,excludedTA1],['TA2',v2,c2list,appliesTA2,excludedTA2]].forEach(([lbl,c,list,applies,excluded])=>{
    const row = el('div',{class:'stack-row'});
    row.appendChild(el('div',{class:'stack-label'}, lbl));
    const bar = el('div',{class:'stack-bar'});
    const pctSource = (c && !excluded) ? (applies ? avgPctByPred(list, filterPred) : c.pct) : null;
    if(pctSource){
      ['insuf','ed','sat','sob'].forEach(k=>{
        const pct = pctSource[k];
        if(pct<=0) return;
        const seg = el('div',{class:'stack-seg', style:`width:${pct}%;background:${NIVEL_COLOR[k]};opacity:${carreraHiddenLevels.has(k)?0.15:1}`});
        const tip = applies
          ? NIVEL_LABEL[k]+': '+fmt1(pct)+'% (promedio de '+filterLabel+')'
          : NIVEL_LABEL[k]+': '+fmt1(pct)+'% ('+c.counts[k]+' est.)';
        attachTip(seg, tip);
        bar.appendChild(seg);
      });
    }
    row.appendChild(bar);
    const matchCount = applies && c ? list.filter(r=>matches(r.competencia,filterPred)).length : null;
    row.appendChild(el('div',{class:'stack-n'}, excluded? 'n = 0 (fuera del filtro)' : (c? ('n = '+c.n+(matchCount!=null?' · prom. '+matchCount+' comp.':'')) : 'sin datos')));
    sCard2.appendChild(row);
  });
  const ceCard2 = el('div',{class:'card'});
  ceCard2.appendChild(el('h2',null,[iconBadge('scale'),'Competencias específicas vs. transversales']));
  ceCard2.appendChild(el('div',{class:'legend'},[
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-1)'}),'Específicas (CE)']),
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-2)'}),'Transversales (CT)']),
  ]));
  ceCard2.appendChild(el('p',{class:'caption', style:'margin-top:-8px;'},'Dentro de cada tipo: barra más clara = TA1, barra sólida = TA2. Cada fila filtra el dashboard de forma independiente.'));
  function toggleTipoRondaFilter(prefix, round){
    const already = carreraTipoFilter===prefix && carreraRondaFilter===round;
    carreraTipoFilter = already ? null : prefix;
    carreraRondaFilter = already ? null : round;
    carreraCompFilter = null;
    renderCarrera();
  }
  [['Específicas (CE)','CE','var(--series-1)'], ['Transversales (CT)','CT','var(--series-2)']].forEach(([label,prefix,color])=>{
    [['TA1',avgByPred(c1list,code=>code.startsWith(prefix)),.42],['TA2',avgByPred(c2list,code=>code.startsWith(prefix)),1]].forEach(([lbl,val,op])=>{
      if(val==null) return;
      const isSel = carreraTipoFilter===prefix && carreraRondaFilter===lbl;
      const isDimmed = (carreraTipoFilter||carreraRondaFilter) && !isSel;
      const row = el('div',{class:'hbar-row clickable'+(isSel?' selected':''), style:`grid-template-columns:130px 1fr 46px${isDimmed?';opacity:.4':''}`, onclick:()=>toggleTipoRondaFilter(prefix,lbl)});
      row.appendChild(el('div',{class:'hlabel'},[el('b',null,label),' · '+lbl]));
      const track = el('div',{class:'hbar-track'});
      const fill = el('div',{class:'hbar-fill', style:`width:${val}%;background:${color};opacity:${op}`});
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('div',{class:'hval'}, fmt1(val)+'%'));
      attachTip(row, label+' '+lbl+': '+fmt1(val)+'% de logro promedio · clic para filtrar todo el dashboard por '+label+' · '+lbl);
      ceCard2.appendChild(row);
    });
  });

  const nivelesCeGrid = el('div',{class:'grid-2'});
  nivelesCeGrid.appendChild(sCard2);
  nivelesCeGrid.appendChild(ceCard2);
  carreraBody.appendChild(nivelesCeGrid);

  /* competencias grouped bars */
  const compCard = el('div',{class:'card'});
  compCard.appendChild(el('h2',null,[iconBadge('bars'),'Logro por competencia']));
  compCard.appendChild(el('p',{class:'caption'},'TA1 (azul) y TA2 (naranja) mostrados por separado. Clic en una barra para filtrar "Resultados por ítem" por esa competencia.'));
  compCard.appendChild(el('div',{class:'legend'},[
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-1)'}),'TA1']),
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-2)'}),'TA2']),
  ]));
  const codes = COMP_ORDER.filter(code => c1list.some(r=>r.competencia===code) || c2list.some(r=>r.competencia===code));
  const gwrap = el('div',{class:'gbar-wrap'});
  function toggleCompFilter(code, round){
    const already = carreraCompFilter===code && carreraRondaFilter===round;
    carreraCompFilter = already ? null : code;
    carreraRondaFilter = already ? null : round;
    carreraTipoFilter = null;
    renderCarrera();
  }
  codes.forEach(code=>{
    const r1 = c1list.find(r=>r.competencia===code);
    const r2 = c2list.find(r=>r.competencia===code);
    const cat = el('div',{class:'gbar-cat'});
    const bars = el('div',{class:'gbar-bars'});
    if(r1){
      const isSel1 = carreraCompFilter===code && carreraRondaFilter==='TA1';
      const dim1 = filterPred && !(filterPred(code) && roundApplies('TA1')) ? ';opacity:.25' : '';
      const col1 = el('div',{class:'gbar-col'+(isSel1?' selected':''), style:`height:${r1.prom}%;background:var(--series-1)${dim1}`, onclick:()=>toggleCompFilter(code,'TA1')});
      col1.appendChild(el('div',{class:'val'}, fmt1(r1.prom)));
      attachTip(col1, code+' TA1: '+fmt1(r1.prom)+'% · '+r1.n_items+' preg. · '+r1.nivel+' · clic para filtrar');
      bars.appendChild(col1);
    }
    if(r2){
      const isSel2 = carreraCompFilter===code && carreraRondaFilter==='TA2';
      const dim2 = filterPred && !(filterPred(code) && roundApplies('TA2')) ? ';opacity:.25' : '';
      const col2 = el('div',{class:'gbar-col'+(isSel2?' selected':''), style:`height:${r2.prom}%;background:var(--series-2)${dim2}`, onclick:()=>toggleCompFilter(code,'TA2')});
      col2.appendChild(el('div',{class:'val'}, fmt1(r2.prom)));
      attachTip(col2, code+' TA2: '+fmt1(r2.prom)+'% · '+r2.n_items+' preg. · '+r2.nivel+' · clic para filtrar');
      bars.appendChild(col2);
    }
    cat.appendChild(bars);
    gwrap.appendChild(cat);
  });
  compCard.appendChild(gwrap);
  const axis = el('div',{class:'gbar-axis'});
  codes.forEach(code=>{
    const rAny = c1list.find(r=>r.competencia===code) || c2list.find(r=>r.competencia===code);
    const dimAxis = filterPred && !filterPred(code);
    const codeSpan = el('span',{class:'axis-code', style: dimAxis?'opacity:.35':''}, code);
    if(rAny && rAny.descripcion) attachTip(codeSpan, rAny.descripcion);
    axis.appendChild(el('span',null,codeSpan));
  });
  compCard.appendChild(axis);
  carreraBody.appendChild(compCard);

  /* mapa de calor competencia x nivel */
  function heatmapCard(title, list, round){
    const card = el('div',{class:'card'});
    card.appendChild(el('h2',null,[iconBadge('grid'), title]));
    card.appendChild(el('p',{class:'caption'},'% de estudiantes en cada nivel, por competencia.'));
    const scale = el('div',{class:'heat-scale'});
    scale.appendChild(el('span',null,'0%'));
    scale.appendChild(el('div',{class:'heat-scale-bar'}));
    scale.appendChild(el('span',null,'100%'));
    card.appendChild(scale);
    card.appendChild(el('p',{class:'caption'},'Clic en el código de una competencia para filtrar "Resultados por ítem" solo por esa competencia. Clic en una celda para filtrar además por nivel. Meta institucional: ≥70% de estudiantes en Satisfactorio + Sobresaliente.'));
    const ordered = COMP_ORDER.filter(code=>list.some(r=>r.competencia===code)).map(code=>list.find(r=>r.competencia===code));
    if(!ordered.length){
      card.appendChild(el('div',{class:'empty-note'},'Sin datos para esta ronda.'));
      return card;
    }
    const table = el('table',{class:'datatable heatmap'});
    table.appendChild(el('tr',null,[el('th',null,''), el('th',null,'Insuf.'), el('th',null,'En des.'), el('th',null,'Satisf.'), el('th',null,'Sobres.'), el('th',null,'Meta ≥70%')]));
    ordered.forEach(r=>{
      const cells = ['insuf','ed','sat','sob'].map(k=>{
        const pct = r.pct[k];
        const textColor = pct>=50 ? '#fff' : 'var(--text-primary)';
        const isSel = carreraCompFilter===r.competencia && carreraNivelFilter===k && carreraRondaFilter===round;
        const td = el('td',{class:'heat-cell'+(isSel?' selected':''), style:`background:color-mix(in srgb, var(--series-1) ${pct}%, var(--surface-1));color:${textColor}`, onclick:()=>{
          const same = carreraCompFilter===r.competencia && carreraNivelFilter===k && carreraRondaFilter===round;
          carreraCompFilter = same ? null : r.competencia;
          carreraNivelFilter = same ? null : k;
          carreraRondaFilter = same ? null : round;
          carreraTipoFilter = null;
          renderCarrera();
        }}, fmt1(pct)+'%');
        attachTip(td, r.competencia+' — '+NIVEL_LABEL[k]+': '+fmt1(pct)+'% · clic para filtrar');
        return td;
      });
      const isCompSel = carreraCompFilter===r.competencia && carreraNivelFilter===null && carreraRondaFilter===round;
      const compCell = el('td',{class:'heat-comp-cell'+(isCompSel?' selected':''), onclick:()=>{
        const same = carreraCompFilter===r.competencia && carreraNivelFilter===null && carreraRondaFilter===round;
        carreraCompFilter = same ? null : r.competencia;
        carreraNivelFilter = null;
        carreraRondaFilter = same ? null : round;
        carreraTipoFilter = null;
        renderCarrera();
      }},[
        el('b',{class:'heat-comp-code'}, r.competencia),
        el('div',{class:'heat-comp-n'}, r.n_items+' preg.'),
      ]);
      attachTip(compCell, (r.descripcion || (r.competencia+': sin descripción disponible.'))+' · clic para filtrar por esta competencia');
      const metaPct = r.pct.sat + r.pct.sob;
      const metaOk = metaPct >= 70;
      const metaCell = el('td',{class:'meta-cell'},
        el('div',{class:'meta-badge '+(metaOk?'good':'bad')},[icon(metaOk?'check':'alert'), el('span',null,fmt1(metaPct)+'%')])
      );
      attachTip(metaCell, r.competencia+' — Satisfactorio + Sobresaliente: '+fmt1(metaPct)+'% · Meta institucional 70% · '+(metaOk?'Cumplida':'No cumplida'));
      const dimRow = filterPred && !(filterPred(r.competencia) && roundApplies(round));
      table.appendChild(el('tr',{style: dimRow?'opacity:.35':''},[compCell, ...cells, metaCell]));
    });
    card.appendChild(table);
    return card;
  }
  const heatGrid = el('div',{class:'grid-2'});
  heatGrid.appendChild(heatmapCard('Mapa de calor — TA1', c1list, 'TA1'));
  heatGrid.appendChild(heatmapCard('Mapa de calor — TA2', c2list, 'TA2'));
  carreraBody.appendChild(heatGrid);

  /* resultados por item */
  const itCard = el('div',{class:'card'});
  itCard.appendChild(el('h2',null,[iconBadge('list'),'Resultados por ítem']));
  itCard.appendChild(el('p',{class:'caption'},'% de aciertos de cada pregunta del test, TA1 y TA2. Clic en una fila para filtrar por su competencia. Clic en una barra de "Logro por competencia", en una celda del mapa de calor o en "Competencias específicas vs. transversales" también filtra aquí.'));
  const rondaToggle = el('div',{class:'stack-toggle'});
  const btnAllRondas = el('button',{class:'pill'+(carreraRondaFilter?'':' active'), onclick:()=>{carreraRondaFilter=null;renderCarrera();}},'TA1 + TA2');
  const btnRondaTA1 = el('button',{class:'pill'+(carreraRondaFilter==='TA1'?' active':''), onclick:()=>{carreraRondaFilter = carreraRondaFilter==='TA1'?null:'TA1'; renderCarrera();}},'Solo TA1');
  const btnRondaTA2 = el('button',{class:'pill'+(carreraRondaFilter==='TA2'?' active':''), onclick:()=>{carreraRondaFilter = carreraRondaFilter==='TA2'?null:'TA2'; renderCarrera();}},'Solo TA2');
  rondaToggle.appendChild(btnAllRondas); rondaToggle.appendChild(btnRondaTA1); rondaToggle.appendChild(btnRondaTA2);
  itCard.appendChild(rondaToggle);

  const itemToggle = el('div',{class:'stack-toggle'});
  const btnAllItems = el('button',{class:'pill'+(carreraNivelFilter?'':' active'), onclick:()=>{carreraNivelFilter=null;renderCarrera();}},'Todos los ítems');
  const btnInsuf = el('button',{class:'pill'+(carreraNivelFilter==='insuf'?' active':''), onclick:()=>{carreraNivelFilter = carreraNivelFilter==='insuf'?null:'insuf'; renderCarrera();}},'Solo insuficientes (<50%)');
  const btnSob = el('button',{class:'pill'+(carreraNivelFilter==='sob'?' active':''), onclick:()=>{carreraNivelFilter = carreraNivelFilter==='sob'?null:'sob'; renderCarrera();}},'Solo sobresalientes (>89%)');
  itemToggle.appendChild(btnAllItems); itemToggle.appendChild(btnInsuf); itemToggle.appendChild(btnSob);
  itCard.appendChild(itemToggle);

  let rows = [];
  if(v1) (itemsByCourse[v1.id]||[]).forEach(i=>rows.push({...i,ronda:'TA1'}));
  if(v2) (itemsByCourse[v2.id]||[]).forEach(i=>rows.push({...i,ronda:'TA2'}));
  if(carreraNivelFilter) rows = rows.filter(r=>nivelBand(r.pct)===carreraNivelFilter);
  rows.sort((a,b)=>a.pct-b.pct);
  if(carreraCompFilter){
    rows = rows.filter(r=> r.competencias.includes(carreraCompFilter));
  }
  if(carreraTipoFilter){
    rows = rows.filter(r=> r.competencias.split('/').some(c=>c.trim().startsWith(carreraTipoFilter)));
  }
  if(carreraRondaFilter){
    rows = rows.filter(r=> r.ronda===carreraRondaFilter);
  }
  const chipRow = el('div',{style:'display:flex;flex-wrap:wrap;gap:8px;'});
  if(carreraCompFilter){
    chipRow.appendChild(el('button',{class:'filter-chip', onclick:()=>{carreraCompFilter=null;carreraRondaFilter=null;renderCarrera();}},
      ['Competencia: '+carreraCompFilter+(carreraRondaFilter?' · '+carreraRondaFilter:''), el('span',{class:'x'},'✕')]));
  }
  if(carreraTipoFilter){
    chipRow.appendChild(el('button',{class:'filter-chip', onclick:()=>{carreraTipoFilter=null;carreraRondaFilter=null;renderCarrera();}},
      ['Tipo: '+tipoName[carreraTipoFilter]+(carreraRondaFilter?' · '+carreraRondaFilter:''), el('span',{class:'x'},'✕')]));
  }
  if(carreraNivelFilter){
    chipRow.appendChild(el('button',{class:'filter-chip', onclick:()=>{carreraNivelFilter=null;renderCarrera();}},
      ['Nivel: '+NIVEL_LABEL[carreraNivelFilter], el('span',{class:'x'},'✕')]));
  }
  if(carreraRondaFilter && !carreraCompFilter && !carreraTipoFilter){
    chipRow.appendChild(el('button',{class:'filter-chip', onclick:()=>{carreraRondaFilter=null;renderCarrera();}},
      ['Ronda: '+carreraRondaFilter, el('span',{class:'x'},'✕')]));
  }
  if(chipRow.children.length) itCard.appendChild(chipRow);

  if(rows.length===0){
    itCard.appendChild(el('div',{class:'empty-note'}, 'Ningún ítem coincide con el filtro actual en este programa.'));
  } else {
    const table = el('table',{class:'datatable'});
    const thead = el('tr',null,[el('th',null,'Ronda'),el('th',null,'Código'),el('th',null,'Competencias'),el('th',null,'% Aciertos')]);
    table.appendChild(thead);
    rows.forEach(r=>{
      const band = nivelBand(r.pct);
      const tr = el('tr',{class:'clickable', onclick:()=>{
        const code = firstCompCode(r.competencias);
        const same = carreraCompFilter===code && carreraRondaFilter===r.ronda;
        carreraCompFilter = same ? null : code;
        carreraRondaFilter = same ? null : r.ronda;
        carreraTipoFilter = null;
        renderCarrera();
      }}, [
        el('td',null,r.ronda), el('td',null,r.codigo), el('td',null,r.competencias),
        el('td',null, el('span',{class:'tag '+band, style:`background:${NIVEL_COLOR[band]}`}, fmt1(r.pct)+'%'))
      ]);
      table.appendChild(tr);
    });
    const tableScroll = el('div',{class:'table-scroll'});
    tableScroll.appendChild(table);
    itCard.appendChild(tableScroll);
  }
  carreraBody.appendChild(itCard);

  /* asignaturas por competencia */
  const artData = (typeof ARTICULACION!=='undefined') ? ARTICULACION[programKey(p)] : null;
  if(artData && artData.length){
    const artCard = el('div',{class:'card'});
    artCard.appendChild(el('h2',null,[iconBadge('layers'),'Asignaturas por competencia']));
    artCard.appendChild(el('p',{class:'caption'},'Asignaturas del plan de estudios articuladas con cada resultado de aprendizaje de la carrera, según la matriz de articulación curricular. Clic en una competencia para ver sus asignaturas.'));
    const accordion = el('div',{class:'comp-accordion'});
    const ordered = COMP_ORDER.map(code=>artData.find(c=>c.codigo===code)).filter(Boolean)
      .concat(artData.filter(c=>!c.codigo));
    ordered.forEach(comp=>{
      const stateKey = programKey(p)+'|'+comp.label;
      const isOpen = carreraArtExpanded.has(stateKey);
      const item = el('div',{class:'comp-acc-item'+(isOpen?' open':'')});
      const head = el('button',{class:'comp-acc-head', onclick:()=>{
        if(isOpen) carreraArtExpanded.delete(stateKey); else carreraArtExpanded.add(stateKey);
        renderCarrera();
      }},[
        el('span',{class:'comp-acc-chevron'},'▸'),
        el('b',{class:'comp-acc-badge'}, comp.label),
        el('span',{class:'comp-acc-desc'}, comp.descripcion),
        el('span',{class:'comp-acc-n'}, comp.asignaturas.length+' asignatura'+(comp.asignaturas.length===1?'':'s')),
      ]);
      item.appendChild(head);
      if(isOpen){
        const body = el('div',{class:'comp-acc-body'});
        const chipWrap = el('div',{class:'asig-chip-wrap'});
        comp.asignaturas.forEach(a=>{
          const chip = el('span',{class:'asig-chip'}, a.nombre);
          if(a.resultado) attachTip(chip, a.resultado);
          chipWrap.appendChild(chip);
        });
        body.appendChild(chipWrap);
        item.appendChild(body);
      }
      accordion.appendChild(item);
    });
    artCard.appendChild(accordion);
    carreraBody.appendChild(artCard);
  }
}
renderCarrera();

/* ---------- tabs ---------- */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-'+btn.dataset.view).classList.add('active');
  });
});
