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
  if(children) (Array.isArray(children)?children:[children]).forEach(c=>{
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
const totalN = DATA.courses.reduce((a,c)=>a+c.n,0);
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

const carreraCount = programList.length;

gView.appendChild(kpiRow([
  {label:'Evaluaciones aplicadas (TA1+TA2)', icon:'clipboard', value: totalN.toLocaleString('es-EC'), sub: DATA.courses.length+' aplicaciones del test · '+carreraCount+' carreras'},
  {label:'Promedio TA1', icon:'trending', value: fmt1(promTA1)+'%', sub: totalN1.toLocaleString('es-EC')+' estudiantes evaluados'},
  {label:'Preguntas — TA1', icon:'list', value: totalPreguntasTA1.toLocaleString('es-EC'), sub: ta1Courses.length+' carreras evaluadas'},
  {label:'% Satisfactorio o superior — TA1', icon:'award', value: fmt1(satSob1/totalN1*100)+'%'},
  {label:'Promedio TA2', icon:'trending', value: fmt1(promTA2)+'%', sub: totalN2.toLocaleString('es-EC')+' estudiantes evaluados'},
  {label:'Preguntas — TA2', icon:'list', value: totalPreguntasTA2.toLocaleString('es-EC'), sub: ta2Courses.length+' carreras evaluadas'},
  {label:'% Satisfactorio o superior — TA2', icon:'award', value: fmt1(satSob2/totalN2*100)+'%'},
]));

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
gView.appendChild(qCard);

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
        if(target) goToProgram(target, {comp: firstCompCode(it.competencias), nivel: band});
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
let carreraHiddenLevels = new Set();
const selBtns = [];
programList.forEach(p=>{
  const totalN2 = (p.ta1?p.ta1.n:0)+(p.ta2?p.ta2.n:0);
  const btn = el('button',{class:'sel-btn'+(p===activeProgram?' active':''), onclick:()=>{
    activeProgram = p;
    carreraCompFilter = null;
    carreraNivelFilter = null;
    carreraTipoFilter = null;
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
  carreraBody.appendChild(kpiRow([
    {label:'Estudiantes TA1', icon:'users', value: v1? v1.n : '—'},
    {label:'Preguntas TA1', icon:'list', value: v1? nPreguntas(v1) : '—'},
    {label:'Promedio TA1', icon:'trending', value: v1? fmt1(v1.prom)+'%':'—', sub: v1? v1.nivel: ''},
    {label:'Estudiantes TA2', icon:'users', value: v2? v2.n : '—'},
    {label:'Preguntas TA2', icon:'list', value: v2? nPreguntas(v2) : '—'},
    {label:'Promedio TA2', icon:'trending', value: v2? fmt1(v2.prom)+'%':'—', sub: v2? v2.nivel: ''},
  ]));

  /* CE vs CT summary for this carrera */
  function avgByPrefix(list, prefix){
    const vals = list.filter(r=>r.competencia.startsWith(prefix)).map(r=>r.prom);
    return vals.length? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  }
  function avgPctByPrefix(list, prefix){
    const matches = list.filter(r=>r.competencia.startsWith(prefix));
    if(!matches.length) return null;
    const out = {};
    ['insuf','ed','sat','sob'].forEach(k=> out[k] = matches.reduce((a,r)=>a+r.pct[k],0)/matches.length);
    return out;
  }
  const tipoName = {CE:'Específicas (CE)', CT:'Transversales (CT)'};

  /* stacked nivel TA1 vs TA2 */
  const sCard2 = el('div',{class:'card'});
  sCard2.appendChild(el('h2',null,[iconBadge('layers'),'Distribución de niveles: TA1 y TA2']));
  sCard2.appendChild(el('p',{class:'caption'},'Clic en la leyenda para aislar un nivel.'+(carreraTipoFilter?(' Recalculado solo con competencias '+tipoName[carreraTipoFilter]+'.'):'')));
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
  [['TA1',v1,c1list],['TA2',v2,c2list]].forEach(([lbl,c,list])=>{
    const row = el('div',{class:'stack-row'});
    row.appendChild(el('div',{class:'stack-label'}, lbl));
    const bar = el('div',{class:'stack-bar'});
    const pctSource = c ? (carreraTipoFilter ? avgPctByPrefix(list, carreraTipoFilter) : c.pct) : null;
    if(pctSource){
      ['insuf','ed','sat','sob'].forEach(k=>{
        const pct = pctSource[k];
        if(pct<=0) return;
        const seg = el('div',{class:'stack-seg', style:`width:${pct}%;background:${NIVEL_COLOR[k]};opacity:${carreraHiddenLevels.has(k)?0.15:1}`});
        const tip = carreraTipoFilter
          ? NIVEL_LABEL[k]+': '+fmt1(pct)+'% (promedio de competencias '+tipoName[carreraTipoFilter]+')'
          : NIVEL_LABEL[k]+': '+fmt1(pct)+'% ('+c.counts[k]+' est.)';
        attachTip(seg, tip);
        bar.appendChild(seg);
      });
    }
    row.appendChild(bar);
    const matchCount = carreraTipoFilter && c ? list.filter(r=>r.competencia.startsWith(carreraTipoFilter)).length : null;
    row.appendChild(el('div',{class:'stack-n'}, c? ('n = '+c.n+(matchCount!=null?' · prom. '+matchCount+' comp.':'')) : 'sin datos'));
    sCard2.appendChild(row);
  });
  const ceCard2 = el('div',{class:'card'});
  ceCard2.appendChild(el('h2',null,[iconBadge('scale'),'Competencias específicas vs. transversales']));
  ceCard2.appendChild(el('div',{class:'legend'},[
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-1)'}),'Específicas (CE)']),
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-2)'}),'Transversales (CT)']),
  ]));
  ceCard2.appendChild(el('p',{class:'caption', style:'margin-top:-8px;'},'Dentro de cada tipo: barra más clara = TA1, barra sólida = TA2.'));
  function toggleTipoFilter(prefix){
    carreraTipoFilter = (carreraTipoFilter===prefix) ? null : prefix;
    carreraCompFilter = null;
    renderCarrera();
  }
  [['Específicas (CE)','CE','var(--series-1)'], ['Transversales (CT)','CT','var(--series-2)']].forEach(([label,prefix,color])=>{
    const isSel = carreraTipoFilter===prefix;
    const isDimmed = carreraTipoFilter && !isSel;
    [['TA1',avgByPrefix(c1list,prefix),.42],['TA2',avgByPrefix(c2list,prefix),1]].forEach(([lbl,val,op])=>{
      if(val==null) return;
      const row = el('div',{class:'hbar-row clickable'+(isSel?' selected':''), style:`grid-template-columns:130px 1fr 46px${isDimmed?';opacity:.4':''}`, onclick:()=>toggleTipoFilter(prefix)});
      row.appendChild(el('div',{class:'hlabel'},[el('b',null,label),' · '+lbl]));
      const track = el('div',{class:'hbar-track'});
      const fill = el('div',{class:'hbar-fill', style:`width:${val}%;background:${color};opacity:${op}`});
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('div',{class:'hval'}, fmt1(val)+'%'));
      attachTip(row, label+' '+lbl+': '+fmt1(val)+'% de logro promedio · clic para filtrar todos los gráficos por '+label);
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
  compCard.appendChild(el('p',{class:'caption'},'TA1 y TA2 mostrados por separado. Clic en una barra para filtrar "Resultados por ítem" por esa competencia.'));
  compCard.appendChild(el('div',{class:'legend'},[
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-1)'}),'CE (específica)']),
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-2)'}),'CT (transversal)']),
  ]));
  compCard.appendChild(el('p',{class:'caption', style:'margin-top:-6px;'},'Dentro de cada competencia: barra más clara = TA1, barra sólida = TA2.'));
  const codes = COMP_ORDER.filter(code => c1list.some(r=>r.competencia===code) || c2list.some(r=>r.competencia===code));
  const gwrap = el('div',{class:'gbar-wrap'});
  function toggleCompFilter(code){
    carreraCompFilter = (carreraCompFilter===code) ? null : code;
    carreraTipoFilter = null;
    renderCarrera();
  }
  codes.forEach(code=>{
    const r1 = c1list.find(r=>r.competencia===code);
    const r2 = c2list.find(r=>r.competencia===code);
    const cat = el('div',{class:'gbar-cat'});
    const bars = el('div',{class:'gbar-bars'});
    const isSel = carreraCompFilter===code;
    const color = code.startsWith('CE') ? 'var(--series-1)' : 'var(--series-2)';
    const dim = carreraTipoFilter && !code.startsWith(carreraTipoFilter) ? ';opacity:.25' : '';
    if(r1){
      const col1 = el('div',{class:'gbar-col'+(isSel?' selected':''), style:`height:${r1.prom}%;background:${color};opacity:.42${dim}`, onclick:()=>toggleCompFilter(code)});
      col1.appendChild(el('div',{class:'val'}, fmt1(r1.prom)));
      attachTip(col1, code+' TA1: '+fmt1(r1.prom)+'% · '+r1.n_items+' preg. · '+r1.nivel+' · clic para filtrar');
      bars.appendChild(col1);
    }
    if(r2){
      const col2 = el('div',{class:'gbar-col'+(isSel?' selected':''), style:`height:${r2.prom}%;background:${color}${dim}`, onclick:()=>toggleCompFilter(code)});
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
    const dimAxis = carreraTipoFilter && !code.startsWith(carreraTipoFilter);
    const codeSpan = el('span',{class:'axis-code', style: dimAxis?'opacity:.35':''}, code);
    if(rAny && rAny.descripcion) attachTip(codeSpan, rAny.descripcion);
    axis.appendChild(el('span',null,codeSpan));
  });
  compCard.appendChild(axis);
  carreraBody.appendChild(compCard);

  /* mapa de calor competencia x nivel */
  function heatmapCard(title, list){
    const card = el('div',{class:'card'});
    card.appendChild(el('h2',null,[iconBadge('grid'), title]));
    card.appendChild(el('p',{class:'caption'},'% de estudiantes en cada nivel, por competencia.'));
    const scale = el('div',{class:'heat-scale'});
    scale.appendChild(el('span',null,'0%'));
    scale.appendChild(el('div',{class:'heat-scale-bar'}));
    scale.appendChild(el('span',null,'100%'));
    card.appendChild(scale);
    card.appendChild(el('p',{class:'caption'},'Clic en una celda para filtrar "Resultados por ítem" por esa competencia y nivel. Meta institucional: ≥70% de estudiantes en Satisfactorio + Sobresaliente.'));
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
        const isSel = carreraCompFilter===r.competencia && carreraNivelFilter===k;
        const td = el('td',{class:'heat-cell'+(isSel?' selected':''), style:`background:color-mix(in srgb, var(--series-1) ${pct}%, var(--surface-1));color:${textColor}`, onclick:()=>{
          const same = carreraCompFilter===r.competencia && carreraNivelFilter===k;
          carreraCompFilter = same ? null : r.competencia;
          carreraNivelFilter = same ? null : k;
          carreraTipoFilter = null;
          renderCarrera();
        }}, fmt1(pct)+'%');
        attachTip(td, r.competencia+' — '+NIVEL_LABEL[k]+': '+fmt1(pct)+'% · clic para filtrar');
        return td;
      });
      const compCell = el('td',null,[
        el('b',{class:'heat-comp-code'}, r.competencia),
        el('div',{class:'heat-comp-n'}, r.n_items+' preg.'),
      ]);
      attachTip(compCell, r.descripcion || (r.competencia+': sin descripción disponible.'));
      const metaPct = r.pct.sat + r.pct.sob;
      const metaOk = metaPct >= 70;
      const metaCell = el('td',{class:'meta-cell'},
        el('div',{class:'meta-badge '+(metaOk?'good':'bad')},[icon(metaOk?'check':'alert'), el('span',null,fmt1(metaPct)+'%')])
      );
      attachTip(metaCell, r.competencia+' — Satisfactorio + Sobresaliente: '+fmt1(metaPct)+'% · Meta institucional 70% · '+(metaOk?'Cumplida':'No cumplida'));
      const dimRow = carreraTipoFilter && !r.competencia.startsWith(carreraTipoFilter);
      table.appendChild(el('tr',{style: dimRow?'opacity:.35':''},[compCell, ...cells, metaCell]));
    });
    card.appendChild(table);
    return card;
  }
  const heatGrid = el('div',{class:'grid-2'});
  heatGrid.appendChild(heatmapCard('Mapa de calor — TA1', c1list));
  heatGrid.appendChild(heatmapCard('Mapa de calor — TA2', c2list));
  carreraBody.appendChild(heatGrid);

  /* resultados por item */
  const itCard = el('div',{class:'card'});
  itCard.appendChild(el('h2',null,[iconBadge('list'),'Resultados por ítem']));
  itCard.appendChild(el('p',{class:'caption'},'% de aciertos de cada pregunta del test, TA1 y TA2. Clic en una fila para filtrar por su competencia. Clic en una barra de "Logro por competencia", en una celda del mapa de calor o en "Competencias específicas vs. transversales" también filtra aquí.'));
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
  const chipRow = el('div',{style:'display:flex;flex-wrap:wrap;gap:8px;'});
  if(carreraCompFilter){
    chipRow.appendChild(el('button',{class:'filter-chip', onclick:()=>{carreraCompFilter=null;renderCarrera();}},
      ['Competencia: '+carreraCompFilter, el('span',{class:'x'},'✕')]));
  }
  if(carreraTipoFilter){
    chipRow.appendChild(el('button',{class:'filter-chip', onclick:()=>{carreraTipoFilter=null;renderCarrera();}},
      ['Tipo: '+tipoName[carreraTipoFilter], el('span',{class:'x'},'✕')]));
  }
  if(carreraNivelFilter){
    chipRow.appendChild(el('button',{class:'filter-chip', onclick:()=>{carreraNivelFilter=null;renderCarrera();}},
      ['Nivel: '+NIVEL_LABEL[carreraNivelFilter], el('span',{class:'x'},'✕')]));
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
        carreraCompFilter = (carreraCompFilter===code) ? null : code;
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
