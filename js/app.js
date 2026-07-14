/* Requiere que js/data.js se cargue antes y defina la constante global DATA. */

/* ---------- helpers ---------- */
const NIVEL_COLOR = {insuf:'var(--nivel-insuf)', ed:'var(--nivel-ed)', sat:'var(--nivel-sat)', sob:'var(--nivel-sob)'};
const NIVEL_LABEL = {insuf:'Insuficiente', ed:'En desarrollo', sat:'Satisfactorio', sob:'Sobresaliente'};
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
DATA.competencias.forEach(r=>{ (compByCourse[r.curso_id] ||= []).push(r); });
const itemsByCourse = {};
DATA.items.forEach(r=>{ (itemsByCourse[r.curso_id] ||= []).push(r); });

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

/* ================= GLOBAL VIEW ================= */
const gView = document.getElementById('view-global');

function kpiRow(items){
  const row = el('div',{class:'kpi-row'});
  items.forEach(it=>{
    const box = el('div',{class:'kpi'},[
      el('div',{class:'label'}, it.label),
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
  {label:'Evaluaciones aplicadas (TA1+TA2)', value: totalN.toLocaleString('es-EC'), sub: DATA.courses.length+' aplicaciones del test · '+carreraCount+' carreras'},
  {label:'Promedio TA1', value: fmt1(promTA1)+'%', sub: totalN1.toLocaleString('es-EC')+' estudiantes evaluados'},
  {label:'Promedio TA2', value: fmt1(promTA2)+'%', sub: totalN2.toLocaleString('es-EC')+' estudiantes evaluados'},
  {label:'% Satisfactorio o superior — TA1', value: fmt1(satSob1/totalN1*100)+'%'},
  {label:'% Satisfactorio o superior — TA2', value: fmt1(satSob2/totalN2*100)+'%'},
]));

/* --- resultado por programa, TA1 y TA2 como paneles independientes --- */
function rankCard(title, taKey){
  const card = el('div',{class:'card'});
  card.appendChild(el('h2',null,title));
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

/* --- stacked 100% bar: distribución de niveles por programa --- */
const sCard = el('div',{class:'card'});
sCard.appendChild(el('h2',null,'Distribución de niveles de logro por programa'));
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

/* --- top items criticos institucional --- */
const critItems = DATA.items.filter(i=>i.pct<40).sort((a,b)=>a.pct-b.pct).slice(0,10);

const grid2 = el('div',{class:'grid-2'});

const ceCard = el('div',{class:'card'});
ceCard.appendChild(el('h2',null,'Competencias específicas vs. transversales'));
ceCard.appendChild(el('p',{class:'caption'},'Promedio de logro institucional, todas las aplicaciones del test.'));
[['Específicas (CE)',avgCE,'var(--series-1)'], ['Transversales (CT)',avgCT,'var(--series-2)']].forEach(([label,val,color])=>{
  const row = el('div',{class:'hbar-row', style:'grid-template-columns:130px 1fr 46px'});
  row.appendChild(el('div',{class:'hlabel'},[el('b',null,label)]));
  const track = el('div',{class:'hbar-track'});
  const fill = el('div',{class:'hbar-fill', style:`width:${val}%;background:${color}`});
  track.appendChild(fill);
  row.appendChild(track);
  row.appendChild(el('div',{class:'hval'}, fmt1(val)+'%'));
  ceCard.appendChild(row);
});
grid2.appendChild(ceCard);

const critCard = el('div',{class:'card'});
critCard.appendChild(el('h2',null,'Ítems críticos institucionales'));
critCard.appendChild(el('p',{class:'caption'},'Preguntas con menor % de aciertos en toda la institución (< 40%).'));
if(critItems.length===0){
  critCard.appendChild(el('div',{class:'empty-note'},'Ningún ítem por debajo del 40% a nivel institucional.'));
} else {
  critItems.forEach(it=>{
    const course = DATA.courses.find(c=>c.id===it.curso_id);
    const row = el('div',{class:'hbar-row'});
    row.appendChild(el('div',{class:'hlabel'},[el('b',null,it.codigo),' · '+(course?course.carrera:'')+' · '+it.competencias]));
    const track = el('div',{class:'hbar-track'});
    const fill = el('div',{class:'hbar-fill', style:`width:${it.pct}%;background:var(--nivel-insuf)`});
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('div',{class:'hval'}, fmt1(it.pct)+'%'));
    critCard.appendChild(row);
  });
}
grid2.appendChild(critCard);
gView.appendChild(grid2);

/* ================= POR CARRERA VIEW ================= */
const cView = document.getElementById('view-carrera');
const selRow = el('div',{class:'selector-row'});
const carreraBody = el('div',null,null);
cView.appendChild(selRow);
cView.appendChild(carreraBody);

let activeProgram = programList[0];
let carreraCompFilter = null;
let carreraHiddenLevels = new Set();
const selBtns = [];
programList.forEach(p=>{
  const totalN2 = (p.ta1?p.ta1.n:0)+(p.ta2?p.ta2.n:0);
  const btn = el('button',{class:'sel-btn'+(p===activeProgram?' active':''), onclick:()=>{
    activeProgram = p;
    carreraCompFilter = null;
    carreraHiddenLevels = new Set();
    selBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderCarrera();
  }},[p.label, el('span',{class:'n'}, totalN2+' estudiantes')]);
  selBtns.push(btn);
  selRow.appendChild(btn);
});

function goToProgram(p){
  activeProgram = p;
  carreraCompFilter = null;
  carreraHiddenLevels = new Set();
  selBtns.forEach((b,i)=> b.classList.toggle('active', programList[i]===p));
  renderCarrera();
  const carreraTab = document.querySelector('.tab-btn[data-view="carrera"]');
  if(carreraTab) carreraTab.click();
}

const COMP_ORDER = ['CE1','CE2','CE3','CE4','CT1','CT2','CT3','CT4'];

function renderCarrera(){
  carreraBody.innerHTML = '';
  const p = activeProgram;
  const isReconstructed = (p.carrera==='Economía' && p.modalidad==='Presencial');

  if(isReconstructed){
    carreraBody.appendChild(el('div',{class:'notice'},'Este programa no estaba incluido en Cuadros_oficiales_por_carrera.xlsx (solo tenía 5 hojas, faltaba Economía Presencial). Los valores aquí se calcularon directamente desde informe_test_aprendizaje.xlsx con la misma metodología.'));
  }

  const v1 = p.ta1, v2 = p.ta2;
  carreraBody.appendChild(kpiRow([
    {label:'Estudiantes TA1', value: v1? v1.n : '—'},
    {label:'Estudiantes TA2', value: v2? v2.n : '—'},
    {label:'Promedio TA1', value: v1? fmt1(v1.prom)+'%':'—', sub: v1? v1.nivel: ''},
    {label:'Promedio TA2', value: v2? fmt1(v2.prom)+'%':'—', sub: v2? v2.nivel: ''},
  ]));

  /* competencias grouped bars */
  const compCard = el('div',{class:'card'});
  compCard.appendChild(el('h2',null,'Logro por competencia'));
  compCard.appendChild(el('p',{class:'caption'},'CE = competencia específica de la carrera · CT = competencia transversal. TA1 y TA2 mostrados por separado. Clic en una barra para filtrar los ítems críticos por esa competencia.'));
  compCard.appendChild(el('div',{class:'legend'},[
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-1);opacity:.42'}),'TA1']),
    el('div',{class:'legend-item'},[el('span',{class:'swatch',style:'background:var(--series-1)'}),'TA2']),
  ]));
  const c1list = compByCourse[v1?v1.id:''] || [];
  const c2list = compByCourse[v2?v2.id:''] || [];
  const codes = COMP_ORDER.filter(code => c1list.some(r=>r.competencia===code) || c2list.some(r=>r.competencia===code));
  const gwrap = el('div',{class:'gbar-wrap'});
  function toggleCompFilter(code){
    carreraCompFilter = (carreraCompFilter===code) ? null : code;
    renderCarrera();
  }
  codes.forEach(code=>{
    const r1 = c1list.find(r=>r.competencia===code);
    const r2 = c2list.find(r=>r.competencia===code);
    const cat = el('div',{class:'gbar-cat'});
    const bars = el('div',{class:'gbar-bars'});
    const isSel = carreraCompFilter===code;
    if(r1){
      const col1 = el('div',{class:'gbar-col'+(isSel?' selected':''), style:`height:${r1.prom}%;background:var(--series-1);opacity:.42`, onclick:()=>toggleCompFilter(code)});
      col1.appendChild(el('div',{class:'val'}, fmt1(r1.prom)));
      attachTip(col1, code+' TA1: '+fmt1(r1.prom)+'% · '+r1.n_items+' preg. · '+r1.nivel+' · clic para filtrar');
      bars.appendChild(col1);
    }
    if(r2){
      const col2 = el('div',{class:'gbar-col'+(isSel?' selected':''), style:`height:${r2.prom}%;background:var(--series-1)`, onclick:()=>toggleCompFilter(code)});
      col2.appendChild(el('div',{class:'val'}, fmt1(r2.prom)));
      attachTip(col2, code+' TA2: '+fmt1(r2.prom)+'% · '+r2.n_items+' preg. · '+r2.nivel+' · clic para filtrar');
      bars.appendChild(col2);
    }
    cat.appendChild(bars);
    gwrap.appendChild(cat);
  });
  compCard.appendChild(gwrap);
  const axis = el('div',{class:'gbar-axis'});
  codes.forEach(code=> axis.appendChild(el('span',null,code)));
  compCard.appendChild(axis);
  carreraBody.appendChild(compCard);

  /* stacked nivel TA1 vs TA2 */
  const sCard2 = el('div',{class:'card'});
  sCard2.appendChild(el('h2',null,'Distribución de niveles: TA1 y TA2'));
  sCard2.appendChild(el('p',{class:'caption'},'Clic en la leyenda para aislar un nivel.'));
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
  [['TA1',v1],['TA2',v2]].forEach(([lbl,c])=>{
    const row = el('div',{class:'stack-row'});
    row.appendChild(el('div',{class:'stack-label'}, lbl));
    const bar = el('div',{class:'stack-bar'});
    if(c){
      ['insuf','ed','sat','sob'].forEach(k=>{
        const pct = c.pct[k];
        if(pct<=0) return;
        const seg = el('div',{class:'stack-seg', style:`width:${pct}%;background:${NIVEL_COLOR[k]};opacity:${carreraHiddenLevels.has(k)?0.15:1}`});
        attachTip(seg, NIVEL_LABEL[k]+': '+fmt1(pct)+'% ('+c.counts[k]+' est.)');
        bar.appendChild(seg);
      });
    }
    row.appendChild(bar);
    row.appendChild(el('div',{class:'stack-n'}, c? 'n = '+c.n : 'sin datos'));
    sCard2.appendChild(row);
  });
  carreraBody.appendChild(sCard2);

  /* items criticos table */
  const itCard = el('div',{class:'card'});
  itCard.appendChild(el('h2',null,'Ítems críticos (< 40% de aciertos)'));
  let rows = [];
  if(v1) (itemsByCourse[v1.id]||[]).filter(i=>i.pct<40).forEach(i=>rows.push({...i,ronda:'TA1'}));
  if(v2) (itemsByCourse[v2.id]||[]).filter(i=>i.pct<40).forEach(i=>rows.push({...i,ronda:'TA2'}));
  rows.sort((a,b)=>a.pct-b.pct);
  if(carreraCompFilter){
    rows = rows.filter(r=> r.competencias.includes(carreraCompFilter));
    const chip = el('button',{class:'filter-chip', onclick:()=>{carreraCompFilter=null;renderCarrera();}},
      ['Filtrando por '+carreraCompFilter, el('span',{class:'x'},'✕')]);
    itCard.appendChild(chip);
  }
  if(rows.length===0){
    itCard.appendChild(el('div',{class:'empty-note'}, carreraCompFilter? 'Ningún ítem crítico para '+carreraCompFilter+' en este programa.' : 'Ninguno. Todos los ítems superan el 40% de aciertos en este programa.'));
  } else {
    const table = el('table',{class:'datatable'});
    const thead = el('tr',null,[el('th',null,'Ronda'),el('th',null,'Código'),el('th',null,'Competencias'),el('th',null,'% Aciertos')]);
    table.appendChild(thead);
    rows.forEach(r=>{
      table.appendChild(el('tr',null,[
        el('td',null,r.ronda), el('td',null,r.codigo), el('td',null,r.competencias),
        el('td',null, el('span',{class:'tag', style:'background:var(--nivel-insuf)'}, fmt1(r.pct)+'%'))
      ]));
    });
    itCard.appendChild(table);
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

/* ---------- data notice ---------- */
document.getElementById('dataNotice').textContent = 'Nota: se incluyen '+DATA.courses.length+' aplicaciones del test (TA1+TA2) de '+carreraCount+' carreras. La carrera "Economía (Presencial)" no estaba incluida en Cuadros_oficiales_por_carrera.xlsx y se reconstruyó desde informe_test_aprendizaje.xlsx con la misma metodología.';
