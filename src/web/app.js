// TeamZone SPA — multi-view app
import { setLang, getLang, i18n, applyI18n } from './i18n.js';

// ── State ──
let _charts = {};

// ── DOM helpers ──
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

// ── API ──
async function api(method, path, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...json };
}
const GET  = (p)    => api('GET',   p);
const POST = (p, b) => api('POST',  p, b);
const PATCH= (p, b) => api('PATCH', p, b);

// ── Charts ──
function makeChart(id, cfg) {
  if (_charts[id]) _charts[id].destroy();
  const c = document.getElementById(id);
  if (!c) return null;
  const ch = new Chart(c, cfg);
  _charts[id] = ch;
  return ch;
}
const ACCENT = '#2ecc71', ACCENT2 = '#e67e22', ACCENT3 = '#3498db', MUTED = '#93a1b1';
const darkOpts = () => ({
  responsive: true, maintainAspectRatio: true,
  plugins: {
    legend: { labels: { color: MUTED, boxWidth: 12 } },
    tooltip: { backgroundColor: '#232c38', titleColor: '#e8edf2', bodyColor: MUTED },
  },
});
const darkAxis = () => ({
  ticks: { color: MUTED, maxTicksLimit: 8 },
  grid: { color: 'rgba(147,161,177,0.1)' },
  border: { color: 'transparent' },
});

// ── Router ──
const VIEWS = {
  dashboard: 'nav.dashboard',
  chat: 'nav.chat',
  workouts: 'nav.workouts',
  nutrition: 'nav.nutrition',
  profile: 'nav.profile',
};

function navigate(view) {
  if (!VIEWS[view]) view = 'dashboard';
  $$('[data-view]', $('#app')).forEach(s => s.classList.remove('active'));
  $$('[data-view]').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  const titleEl = $('#page-title');
  if (titleEl) titleEl.textContent = i18n(VIEWS[view]);
  if (window.location.hash.slice(1) !== view) history.replaceState({}, '', '#' + view);
  if (view === 'dashboard') loadDashboard();
  else if (view === 'workouts') initWorkouts();
  else if (view === 'nutrition') loadNutrition();
  else if (view === 'profile') loadProfileView();
}
window.navigate = navigate;

window.addEventListener('hashchange', () => navigate(window.location.hash.slice(1)));

// ── Auth ──
async function checkAuth() {
  const me = await GET('/api/me');
  if (me.userId) showApp(me.userId);
}

function showApp(userId) {
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  const u = $('#topbar-user');
  if (u) u.textContent = userId;
  GET('/api/profile').then(d => {
    setLang(d?.profile?.language || 'en');
  }).catch(() => applyI18n());
  const p = new URLSearchParams(window.location.search);
  if (p.get('motra') === 'connected') {
    history.replaceState({}, '', '/');
    setTimeout(() => addMsg('✓ Motra connected!', 'bot'), 300);
  } else if (p.get('motra') === 'error') {
    history.replaceState({}, '', '/');
    setTimeout(() => addMsg('⚠ Motra connection failed.', 'bot'), 300);
  }
  navigate(window.location.hash.slice(1) || 'dashboard');
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#login-error').textContent = '';
  const r = await POST('/api/login', { userId: $('#login-user').value.trim(), pin: $('#login-pin').value });
  if (r.ok) showApp(r.userId);
  else $('#login-error').textContent = 'Invalid user ID or PIN';
});

$('#logout-btn').addEventListener('click', async () => { await POST('/api/logout'); location.reload(); });
$('#menu-toggle')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));

// ── Dashboard ──
async function loadDashboard() {
  const d = await GET('/api/dashboard').catch(() => null);
  if (!d) return;

  const score = d.readiness?.overallScore ?? d.readiness?.score ?? null;
  const scoreEl = $('#readiness-score');
  const labelEl = $('#readiness-label');
  if (scoreEl) {
    if (score !== null) {
      scoreEl.textContent = Math.round(score);
      scoreEl.className = 'readiness-num ' + (score>=8?'rdy-great':score>=6?'rdy-good':score>=4?'rdy-moderate':'rdy-low');
      if (labelEl) labelEl.textContent = i18n(score>=8?'readiness.great':score>=6?'readiness.good':score>=4?'readiness.moderate':'readiness.low');
    } else {
      scoreEl.textContent = '—';
      if (labelEl) labelEl.textContent = i18n('dashboard.connectMotra');
    }
  }

  const h = d.health;
  if (h) {
    const get = (key) => {
      if (Array.isArray(h)) { const m = h.find(x => x.type===key||x.identifier===key); return m?.value??m?.quantity??null; }
      return h[key]??null;
    };
    const steps = get('stepCount')??get('steps');
    const sleep = get('sleepAnalysis')??get('sleep');
    const hr    = get('restingHeartRate')??get('restingHR');
    if ($('#m-steps')) $('#m-steps').textContent = steps ? Math.round(steps).toLocaleString() : '—';
    if ($('#m-sleep')) $('#m-sleep').textContent = sleep ? (typeof sleep==='number'&&sleep>24 ? (sleep/3600).toFixed(1) : Number(sleep).toFixed(1)) : '—';
    if ($('#m-hr'))    $('#m-hr').textContent    = hr    ? Math.round(hr) : '—';
  }

  const t = d.targets;
  if (t) {
    [['ring-protein', t.protein_g, ACCENT], ['ring-carbs', t.carbs_g, ACCENT3], ['ring-fat', t.fat_g, ACCENT2]].forEach(([id, val, col]) => {
      makeChart(id, {
        type: 'doughnut',
        data: { datasets: [{ data: [1, 0], backgroundColor: [col, '#232c38'], borderWidth: 0, circumference: 270, rotation: -135 }] },
        options: { responsive: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: () => `${Math.round(val)}g` } } } },
      });
    });
  }

  const lw = d.lastWorkout;
  const lwEl = $('#last-workout-body');
  if (lw && lwEl) {
    const mins = lw.duration ? Math.round(lw.duration/60) : null;
    lwEl.innerHTML = `<strong>${lw.name||'Workout'}</strong><br><span class="muted">${fmtDate(lw.date||lw.timeStarted)}${mins?` · ${mins} min`:''}</span>`;
    lwEl.className = 'small';
  }

  const ach = d.latestAchievement;
  const achEl = $('#achievement-body');
  if (ach && achEl) {
    achEl.innerHTML = `<span class="achievement-badge">🏆</span> <strong>${ach.exerciseName||ach.exercise||''}</strong><br><span class="muted small">${ach.description||ach.value||''}</span>`;
    achEl.className = 'small';
  }
}

// ── Chat ──
const isHebrew = t => /[֐-׿]/.test(t);
function addMsg(text, who) {
  const div = document.createElement('div');
  div.className = `msg ${who}` + (isHebrew(text) ? ' rtl' : '');
  div.textContent = text;
  const msgs = $('#messages');
  if (msgs) { msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; }
  return div;
}

const chatInput = $('#input');
chatInput?.addEventListener('input', () => { chatInput.style.height='auto'; chatInput.style.height=Math.min(chatInput.scrollHeight,160)+'px'; });
chatInput?.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); $('#chat-form').requestSubmit(); } });

$('#chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  addMsg(text, 'user');
  chatInput.value=''; chatInput.style.height='auto';
  $('#send').disabled = true;
  const typing = addMsg('…', 'bot');
  typing.classList.add('typing');
  try {
    const r = await POST('/api/chat', { message: text });
    typing.remove();
    addMsg(r.ok ? r.reply : '⚠ '+(r.error||'error'), 'bot');
  } catch { typing.remove(); addMsg('⚠ Network error', 'bot'); }
  finally { $('#send').disabled=false; chatInput?.focus(); }
});

// ── Workouts ──
let calYear=new Date().getFullYear(), calMonth=new Date().getMonth(), calData={};

async function initWorkouts() { await loadCalendar(); }

async function loadCalendar() {
  const from=`${calYear}-${pad(calMonth+1)}-01`;
  const last=new Date(calYear,calMonth+1,0).getDate();
  const to=`${calYear}-${pad(calMonth+1)}-${pad(last)}`;
  const lbl = $('#cal-month-label');
  if (lbl) lbl.textContent = new Date(calYear,calMonth).toLocaleDateString(getLang()==='he'?'he-IL':'en-US',{month:'long',year:'numeric'});
  const data = await GET(`/api/calendar?from=${from}&to=${to}`).catch(()=>null);
  calData = data?.activities ?? data?.calendar ?? {};
  renderCalendar();
}

function renderCalendar() {
  const grid = $('#cal-grid');
  if (!grid) return;
  const first=new Date(calYear,calMonth,1).getDay();
  const days=new Date(calYear,calMonth+1,0).getDate();
  const todayStr=todayDate();
  const dow=['Su','Mo','Tu','We','Th','Fr','Sa'];
  let html=dow.map(d=>`<div class="cal-dow">${d}</div>`).join('');
  for (let i=0;i<first;i++) html+='<div class="cal-cell empty"></div>';
  for (let d=1;d<=days;d++) {
    const ds=`${calYear}-${pad(calMonth+1)}-${pad(d)}`;
    const act=calData[ds];
    const s=act?.status??(Array.isArray(act)?act[0]?.status:null);
    const dot=act?`<span class="cal-dot ${s==='completed'?'dot-done':s==='planned'?'dot-plan':'dot-rest'}"></span>`:'';
    html+=`<div class="cal-cell${ds===todayStr?' today':''}" data-date="${ds}">${d}${dot}</div>`;
  }
  grid.innerHTML=html;
  $$('.cal-cell[data-date]').forEach(c=>c.addEventListener('click',()=>showCalDetail(c.dataset.date)));
}

function showCalDetail(ds) {
  const det=$('#cal-detail');
  if (!det) return;
  const act=calData[ds];
  if (!act) { det.classList.add('hidden'); return; }
  const acts=Array.isArray(act)?act:[act];
  det.innerHTML=`<strong>${fmtDate(ds)}</strong>`+acts.map(a=>`<div class="cal-act"><span class="cal-act-name">${a.name||'Workout'}</span> <span class="cal-badge ${a.status||''}">${a.status||''}</span>${a.duration?` · ${Math.round(a.duration/60)} min`:''}</div>`).join('');
  det.classList.remove('hidden');
}

$('#cal-prev')?.addEventListener('click',()=>{ calMonth--; if(calMonth<0){calMonth=11;calYear--;} loadCalendar(); });
$('#cal-next')?.addEventListener('click',()=>{ calMonth++; if(calMonth>11){calMonth=0;calYear++;} loadCalendar(); });

$$('.sub-tab').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.sub-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  $$('.sub-panel').forEach(p=>{p.classList.add('hidden');p.classList.remove('active');});
  const el=$(`#sub-${btn.dataset.subtab}`);
  if(el){el.classList.remove('hidden');el.classList.add('active');}
  if(btn.dataset.subtab==='hist') loadWorkoutHistory();
  if(btn.dataset.subtab==='stats') loadWorkoutStats();
}));

async function loadWorkoutHistory() {
  const list=$('#workout-list');
  if(!list) return;
  list.innerHTML=`<p class="muted small">${i18n('workouts.loading')}</p>`;
  const data=await GET('/api/workouts').catch(()=>null);
  const ws=data?.workouts??[];
  if(!ws.length){list.innerHTML=`<p class="muted">${i18n('workouts.noData')}</p>`;return;}
  list.innerHTML=ws.map(w=>`<div class="workout-item" data-id="${w.id||w.workoutId}">
    <div class="wo-name">${w.name||'Workout'}</div>
    <div class="wo-meta muted small">${fmtDate(w.date||w.timeStarted||w.startTime)}${w.duration?` · ${Math.round(w.duration/60)} min`:''}${w.calories?` · ${Math.round(w.calories)} kcal`:''}</div>
    <div>${(w.muscleGroups||[]).map(m=>`<span class="tag">${m}</span>`).join('')}</div>
  </div>`).join('');
  $$('.workout-item').forEach(item=>item.addEventListener('click',()=>loadWorkoutDetail(item.dataset.id,item)));
}

async function loadWorkoutDetail(id, container) {
  const ex=container.querySelector('.wo-detail');
  if(ex){ex.remove();return;}
  const data=await GET(`/api/workouts/${id}`).catch(()=>null);
  if(!data) return;
  const segs=data.segments??data.exercises??[];
  const div=document.createElement('div');
  div.className='wo-detail';
  div.innerHTML=segs.map(seg=>{
    const sets=seg.sets??seg.exercises??[];
    return `<div class="wo-seg"><strong>${seg.name||seg.exerciseName||''}</strong><div class="wo-sets">${sets.map(s=>`<span class="set-chip">${s.weight?s.weight+'kg':''}${s.reps?' × '+s.reps:''}${s.rpe?' @'+s.rpe:''}</span>`).join('')}</div></div>`;
  }).join('')||'<em class="muted small">No detail available</em>';
  container.appendChild(div);
}

async function loadWorkoutStats() {
  const cards=$('#stat-cards');
  if(!cards) return;
  const data=await GET('/api/stats').catch(()=>null);
  if(!data){cards.innerHTML=`<p class="muted">${i18n('workouts.noData')}</p>`;return;}
  const cnt=data.totalWorkouts?.count??data.totalWorkouts?.value??'—';
  const vol=data.totalVolume?.sum??data.totalVolume?.value;
  cards.innerHTML=`
    <div class="stat-card"><span class="stat-val">${cnt}</span><span class="stat-lbl">workouts this month</span></div>
    <div class="stat-card"><span class="stat-val">${vol?(vol/1000).toFixed(1)+'t':'—'}</span><span class="stat-lbl">total volume</span></div>
    ${(data.topExercises?.exercises??data.topExercises?.items??[]).slice(0,3).map(e=>`<div class="stat-card"><span class="stat-val">${e.value?(e.value/1000).toFixed(1)+'t':'—'}</span><span class="stat-lbl">${e.name||e.exerciseName||''}</span></div>`).join('')}`;
}

// ── Nutrition ──
async function loadNutrition() {
  const [profData, logData, trendData] = await Promise.all([
    GET('/api/profile').catch(()=>null),
    GET('/api/nutrition/log').catch(()=>null),
    GET(`/api/health/trend?type=bodyMass&subType=bodyMass&aggregation=avg&period=week&from=${weeksAgo(12)}&to=${todayDate()}`).catch(()=>null),
  ]);

  const t=profData?.targets;
  const macroEl=$('#macro-bars');
  if(t&&macroEl) {
    macroEl.innerHTML=[
      {label:i18n('macro.protein'),val:t.protein_g,col:ACCENT},
      {label:i18n('macro.carbs'),  val:t.carbs_g,  col:ACCENT3},
      {label:i18n('macro.fat'),    val:t.fat_g,    col:ACCENT2},
    ].map(m=>`<div class="macro-bar-row"><span class="macro-name">${m.label}</span><div class="macro-track"><div class="macro-fill" style="width:100%;background:${m.col}"></div></div><span class="macro-val">${m.val}g</span></div>`).join('');
  }

  const pts=trendData?.data??trendData?.trend??trendData?.entries??[];
  if(pts.length) {
    makeChart('chart-weight',{
      type:'line',
      data:{
        labels:pts.map(p=>p.date||p.period||p.start||''),
        datasets:[{label:'kg',data:pts.map(p=>p.value??p.avg??p.average??null),borderColor:ACCENT,backgroundColor:'rgba(46,204,113,0.08)',tension:0.4,pointRadius:3,fill:true}],
      },
      options:{...darkOpts(),scales:{y:{...darkAxis(),title:{display:true,text:'kg',color:MUTED}},x:{...darkAxis()}}},
    });
  }

  const logEl=$('#meal-log');
  if(logEl){
    const entries=logData?.entries??[];
    logEl.innerHTML=entries.length?entries.map(e=>`<div class="log-entry">• ${e}</div>`).join(''):
      `<p class="muted small">${i18n('nutrition.noLog')}</p>`;
  }
}

// ── Profile ──
async function loadProfileView() {
  const data=await GET('/api/profile').catch(()=>null);
  if(!data) return;
  const p=data.profile, t=data.targets;
  if(p) {
    const form=$('#profile-form');
    ['name','weight_kg','height_cm','bodyfat_pct','age'].forEach(f=>{ const el=form?.elements[f]; if(el&&p[f]!=null) el.value=p[f]; });
    if(form?.elements['activity']&&p.activity) form.elements['activity'].value=p.activity;
    if(p.goal) { const r=document.querySelector(`input[name="goal"][value="${p.goal}"]`); if(r) r.checked=true; }
  }
  if(t) renderTargets(t);

  const ms=await GET('/api/motra/status').catch(()=>({connected:false}));
  const conn=ms.connected;
  const stEl=$('#motra-status-text'), btnEl=$('#motra-toggle-btn');
  if(stEl) stEl.textContent=i18n(conn?'profile.motraConnected':'profile.motraDisconnected');
  if(btnEl) {
    btnEl.textContent=i18n(conn?'profile.motraDisconnect':'profile.motraConnect');
    btnEl.onclick=async()=>{
      if(conn){if(!confirm('Disconnect Motra?'))return; await POST('/api/motra/disconnect'); loadProfileView();}
      else window.location.href='/api/motra/connect';
    };
  }
}

function renderTargets(t) {
  const card=$('#targets-card'), el=$('#targets-display');
  if(!el||!t) return;
  el.innerHTML=[
    {label:'Calories',val:t.calories_kcal+' kcal'},
    {label:i18n('macro.protein'),val:t.protein_g+'g'},
    {label:i18n('macro.carbs'),val:t.carbs_g+'g'},
    {label:i18n('macro.fat'),val:t.fat_g+'g'},
  ].map(r=>`<div class="target-row"><span class="target-lbl">${r.label}</span><span class="target-val">${r.val}</span></div>`).join('');
  if(card) card.style.display='';
}

$('#profile-form').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const form=e.target, body={};
  ['name','weight_kg','height_cm','bodyfat_pct','age','activity'].forEach(f=>{ const el=form.elements[f]; if(el&&el.value!=='') body[f]=f==='name'||f==='activity'?el.value:Number(el.value)||undefined; });
  const gr=form.querySelector('input[name="goal"]:checked');
  if(gr) body.goal=gr.value;
  const r=await PATCH('/api/profile',body);
  const msg=$('#profile-msg');
  if(r.ok){
    if(msg){msg.textContent=i18n('profile.saved');setTimeout(()=>{msg.textContent='';},2000);}
    if(r.targets)renderTargets(r.targets);
  } else if(msg) msg.textContent=r.error||'Error saving';
});

$('#btn-lang-he')?.addEventListener('click',()=>{ setLang('he'); PATCH('/api/profile',{language:'he'}).catch(()=>{}); });
$('#btn-lang-en')?.addEventListener('click',()=>{ setLang('en'); PATCH('/api/profile',{language:'en'}).catch(()=>{}); });

// ── Nav binding ──
$$('.nav-item,.bnav-item').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();
  if(a.dataset.view) navigate(a.dataset.view);
  $('#sidebar')?.classList.remove('open');
}));

// ── Helpers ──
const pad = n => String(n).padStart(2, '0');
const todayDate = () => new Date().toISOString().slice(0, 10);
const weeksAgo = n => { const d=new Date(); d.setDate(d.getDate()-n*7); return d.toISOString().slice(0,10); };
function fmtDate(str) {
  if(!str) return '';
  const d=new Date(str);
  return isNaN(d)?str:d.toLocaleDateString(getLang()==='he'?'he-IL':'en-US',{month:'short',day:'numeric'});
}

// ── Boot ──
checkAuth();
