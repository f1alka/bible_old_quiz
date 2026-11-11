window.NBB = window.NBB || {};
NBB.ui = {};

// ==== ПОКАЗ/СКРЫТИЕ ====
function show(id){ const el = document.getElementById(id); if(el){ el.classList.remove('hidden'); el.style.display = ''; } }
function hide(id){ const el = document.getElementById(id); if(el){ el.classList.add('hidden'); el.style.display = 'none'; } }
NBB.ui.show = show;
NBB.ui.hide = hide;

// ==== ОШИБКИ ====
function showFatalError(msg){
  let banner = document.getElementById('_fatalErr');
  if(!banner){
    banner = document.createElement('div');
    banner.id = '_fatalErr';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#8a444a;color:#fff;padding:14px 18px;font:14px/1.4 system-ui;z-index:9999;text-align:center;box-shadow:0 4px 12px #0008';
    document.body.appendChild(banner);
  }
  banner.textContent = '⚠ ' + msg;
}
NBB.ui.showFatalError = showFatalError;

// ==== СПИСКИ ====
NBB.ui.getBooks = function(){ return NBB.state.currentSubject === 'ot' ? NBB.data.BOOKS_OT : NBB.data.BOOKS_BS; };
NBB.ui.getCategories = function(){ return NBB.state.currentSubject === 'ot' ? NBB.data.CATEGORIES_OT : NBB.data.CATEGORIES_BS; };
NBB.ui.getModes = function(){ return NBB.state.currentSubject === 'ot' ? NBB.data.MODES_OT : NBB.data.MODES_BS; };

function bookMatches(q, selectedSet){
  if(selectedSet.size === 0) return true;
  if(q.type === "match"){ if(!q.books) return false; return q.books.some(b => selectedSet.has(b)); }
  return selectedSet.has(q.book);
}
NBB.ui.filterBySubjectAndBooks = function(pool){
  return pool.filter(q => q.subject === NBB.state.currentSubject && bookMatches(q, NBB.state.selectedBooks));
};

// ==== ХЕДЕР ====
NBB.ui.updateHeader = function(){
  const hr = document.getElementById('headerRight');
  if(!hr) return;
  if(!NBB.state.currentSubject){
    hr.innerHTML = `<div class="pill">Тренажёр НББС</div>`;
  } else {
    hr.innerHTML = `<div class="pill pill-btn" id="topPill">${NBB.data.SUBJECTS[NBB.state.currentSubject].name} · сменить</div>`;
    const pill = hr.querySelector('#topPill');
    if(pill) pill.onclick = NBB.ui.backToSubject;
  }
};

// ==== ТЕМА ====
NBB.ui.updateThemeButton = function(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;
  const mode = (NBB.state.progress.settings && NBB.state.progress.settings.theme) || 'auto';
  const labels = { auto: 'Тема: авто', light: 'Тема: светлая', dark: 'Тема: тёмная' };
  const icons  = { auto: '🌗', light: '☀️', dark: '🌙' };
  btn.textContent = icons[mode] || '🌗';
  btn.title = labels[mode] || 'Сменить тему';
};

NBB.ui.applyTheme = function(mode){
  const root = document.documentElement;
  let effective = mode;
  if(!mode || mode === 'auto'){
    effective = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  root.setAttribute('data-theme', effective);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    m.setAttribute('content', effective === 'light' ? '#f5f7fa' : '#101b2b');
  });
  NBB.ui.updateThemeButton();
};

NBB.ui.cycleTheme = function(){
  if(!NBB.state.progress.settings) NBB.state.progress.settings = { theme: 'auto' };
  const cur = NBB.state.progress.settings.theme || 'auto';
  const next = cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto';
  NBB.state.progress.settings.theme = next;
  NBB.progress.save();
  NBB.ui.applyTheme(next);
  const sel = document.getElementById('settingTheme');
  if(sel) sel.value = next;
};

NBB.ui.initTheme = function(){
  const mode = (NBB.state.progress.settings && NBB.state.progress.settings.theme) || 'auto';
  NBB.ui.applyTheme(mode);
  if(window.matchMedia){
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = function(){
      const cur = (NBB.state.progress.settings && NBB.state.progress.settings.theme) || 'auto';
      if(cur === 'auto') NBB.ui.applyTheme('auto');
    };
    if(mql.addEventListener) mql.addEventListener('change', handler);
    else if(mql.addListener) mql.addListener(handler);
  }
};

// ==== ЗВУК И ВИБРАЦИЯ ====
function playTone(freq, type, duration) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if(!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e) { console.warn('Web Audio не поддерживается'); }
}

NBB.ui.playSound = function(type) {
  if(!NBB.state.progress.settings || !NBB.state.progress.settings.sound) return;
  if(type === 'correct') playTone(880, 'sine', 0.15);
  else if(type === 'wrong') playTone(220, 'sawtooth', 0.2);
};

NBB.ui.vibrate = function(pattern) {
  if(!NBB.state.progress.settings || !NBB.state.progress.settings.vibration) return;
  if(navigator.vibrate) navigator.vibrate(pattern);
};

// ==== СТАТИСТИКА В МЕНЮ ====
NBB.ui.renderSubjectStats = function(){
  if(!NBB.state.progress) return;
  ['ot','bs'].forEach(s => {
    const p = NBB.state.progress[s];
    const el = document.getElementById('stats_' + s);
    if(!el || !p) return;
    if(p.totalAnswered){
      el.textContent = `${p.totalCorrect}/${p.totalAnswered} правильных (${Math.round(p.totalCorrect/p.totalAnswered*100)}%) · ${p.rounds.length} раундов`;
    } else {
      el.textContent = "Ещё не начато";
    }
  });
};

// ==== ВЫБОР ПРЕДМЕТА ====
NBB.ui.selectSubject = function(subj){
  try {
    if(!NBB.data || !NBB.data.SUBJECTS) throw new Error('NBB.data.SUBJECTS не загружен');
    if(!NBB.data.SUBJECTS[subj]) throw new Error('Предмет не найден: ' + subj);
    if(!NBB.state.progress) throw new Error('NBB.state.progress не инициализирован');

    NBB.state.currentSubject = subj;
    if(NBB.state.selectedBooks) NBB.state.selectedBooks.clear();

    const meta = NBB.data.SUBJECTS[subj];
    NBB.ui.updateHeader();

    const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    setText('introBrand', meta.name);
    setText('introTitle', meta.name);
    setText('introSub', meta.sub);
    setText('introNotice', meta.notice);
    setText('filterLabel', meta.filterLabel);
    setText('listTitle', meta.listTitle);
    setText('listSub', meta.listSub);

    const modeEl = document.getElementById('mode');
    if(modeEl) modeEl.innerHTML = NBB.ui.getModes().map(m => `<option value="${m.v}">${m.l}</option>`).join('');

    const books = NBB.ui.getBooks();
    const listEl = document.getElementById('booklist');
    if(listEl) listEl.innerHTML = books.map(b => `<div class="book"><span>${b}</span><span class="bar" data-book="${b}"></span></div>`).join('');

    NBB.ui.renderCategoryButtons();
    NBB.ui.renderBookFilter();
    NBB.ui.renderProgressPanel();

    hide('subjectSelect');
    hide('game');
    hide('result');
    show('intro');

    NBB.ui.onBookSelectionChange();
    window.scrollTo({top:0, behavior:'smooth'});
  } catch(e){
    console.error('[selectSubject] ОШИБКА:', e);
    showFatalError('Не удалось открыть предмет: ' + e.message);
  }
};

NBB.ui.backToSubject = function(){
  NBB.state.currentSubject = null;
  if(NBB.state.selectedBooks) NBB.state.selectedBooks.clear();
  NBB.ui.updateHeader();
  show('subjectSelect');
  hide('intro');
  hide('game');
  hide('result');
  NBB.ui.renderSubjectStats();
  window.scrollTo({top:0, behavior:'smooth'});
};

// ==== КАТЕГОРИИ ====
NBB.ui.renderCategoryButtons = function(){
  const box = document.getElementById('catButtons');
  if(!box) return;
  const cats = NBB.ui.getCategories();
  if(!cats) return;
  box.innerHTML = Object.keys(cats).map(cat => {
    const n = cats[cat].length;
    return `<button type="button" class="cat-btn" data-cat="${cat}">${cat}<span class="cnt">${n}</span></button>`;
  }).join('');
  box.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      const books = cats[cat];
      const allSel = books.every(b => NBB.state.selectedBooks.has(b));
      const filterBox = document.getElementById('bookFilter');
      if(!filterBox) return;
      if(allSel){
        books.forEach(b => NBB.state.selectedBooks.delete(b));
        filterBox.querySelectorAll('.book-chip').forEach(el => { if(books.includes(el.dataset.book)) el.classList.remove('selected'); });
      } else {
        books.forEach(b => NBB.state.selectedBooks.add(b));
        filterBox.querySelectorAll('.book-chip').forEach(el => { if(books.includes(el.dataset.book)) el.classList.add('selected'); });
      }
      NBB.ui.onBookSelectionChange();
    });
  });
};

NBB.ui.updateCategoryButtonsState = function(){
  const cats = NBB.ui.getCategories();
  if(!cats) return;
  document.querySelectorAll('#catButtons .cat-btn').forEach(btn => {
    const cat = btn.dataset.cat;
    const books = cats[cat];
    const sel = books.filter(b => NBB.state.selectedBooks.has(b)).length;
    btn.classList.remove('selected','partial');
    if(sel === books.length) btn.classList.add('selected');
    else if(sel > 0) btn.classList.add('partial');
  });
};

NBB.ui.renderBookFilter = function(){
  const box = document.getElementById('bookFilter');
  if(!box) return;
  const books = NBB.ui.getBooks();
  if(!books) return;
  box.innerHTML = books.map(b => `<button type="button" class="book-chip" data-book="${b}">${b}</button>`).join('');
  box.querySelectorAll('.book-chip').forEach(el => {
    el.addEventListener('click', () => {
      const b = el.dataset.book;
      if(NBB.state.selectedBooks.has(b)) NBB.state.selectedBooks.delete(b);
      else NBB.state.selectedBooks.add(b);
      el.classList.toggle('selected');
      NBB.ui.onBookSelectionChange();
    });
  });
};

NBB.ui.selectAllBooks = function(){
  NBB.ui.getBooks().forEach(b => NBB.state.selectedBooks.add(b));
  document.querySelectorAll('#bookFilter .book-chip').forEach(el => el.classList.add('selected'));
  NBB.ui.onBookSelectionChange();
};
NBB.ui.clearBooks = function(){
  NBB.state.selectedBooks.clear();
  document.querySelectorAll('#bookFilter .book-chip').forEach(el => el.classList.remove('selected'));
  NBB.ui.onBookSelectionChange();
};

NBB.ui.onBookSelectionChange = function(){
  if(!NBB.state.currentSubject) return;
  const total = NBB.ui.getBooks().length;
  const n = NBB.state.selectedBooks.size;
  const countEl = document.getElementById('selectedCount');
  if(countEl) countEl.textContent = n === 0 ? `выбрано: 0 (всё)` : (n === total ? `выбрано: все ${n}` : `выбрано: ${n} из ${total}`);
  NBB.ui.updateCategoryButtonsState();
  const available = NBB.ui.filterBySubjectAndBooks(NBB.data.all || []);
  const labelEl = document.getElementById('totalLabel');
  if(labelEl) labelEl.textContent = `Доступно вопросов: ${available.length}${n > 0 ? " (по выбранному)" : " (всё)"}`;
};

// ==== ГРАФИКИ ====
NBB.ui.renderCharts = function(){
  if(!NBB.state.currentSubject) return;

  // Heatmap
  const heatmapContainer = document.getElementById('heatmapContainer');
  if(heatmapContainer) {
    const activity = NBB.state.progress.dailyActivity || {};
    let html = '<div class="heatmap-wrapper"><div class="heatmap">';
    const today = new Date();
    for(let i = 139; i >= 0; i--) {
       const d = new Date(today);
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().slice(0,10);
       const count = activity[dateStr] || 0;
       let level = 0;
       if(count > 0 && count <= 3) level = 1;
       else if(count <= 7) level = 2;
       else if(count <= 15) level = 3;
       else if(count > 15) level = 4;
       html += `<div class="heatmap-day" data-level="${level}" title="${dateStr}: ${count} ответов"></div>`;
    }
    html += '</div></div>';
    heatmapContainer.innerHTML = html;
  }

  // Radar
  const radarContainer = document.getElementById('radarContainer');
  if(radarContainer) {
    const cats = Object.keys(NBB.ui.getCategories());
    const p = NBB.state.progress[NBB.state.currentSubject];
    const data = cats.map(c => { const v = p.byCategory[c]; return (v && v.a > 0) ? (v.c / v.a) : 0; });
    const cx = 100, cy = 100, r = 70;
    let svg = `<svg viewBox="0 0 200 200" class="radar-chart">`;
    for(let i=1; i<=4; i++) {
       let pts = [];
       for(let j=0; j<5; j++) {
          const angle = -Math.PI/2 + (j * 2 * Math.PI / 5);
          const radius = r * (i/4);
          pts.push(`${cx + Math.cos(angle)*radius},${cy + Math.sin(angle)*radius}`);
       }
       svg += `<polygon points="${pts.join(' ')}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
    }
    let pts = [];
    for(let j=0; j<5; j++) {
       const angle = -Math.PI/2 + (j * 2 * Math.PI / 5);
       const radius = r * data[j];
       pts.push(`${cx + Math.cos(angle)*radius},${cy + Math.sin(angle)*radius}`);
    }
    svg += `<polygon points="${pts.join(' ')}" fill="color-mix(in srgb, var(--gold) 20%, transparent)" stroke="var(--gold)" stroke-width="2"/>`;
    for(let j=0; j<5; j++) {
       const angle = -Math.PI/2 + (j * 2 * Math.PI / 5);
       const lx = cx + Math.cos(angle)*(r+30);
       const ly = cy + Math.sin(angle)*(r+20);
       const shortLabel = cats[j].length > 10 ? cats[j].slice(0,8)+'…' : cats[j];
       svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="var(--muted)">${shortLabel}</text>`;
    }
    svg += `</svg>`;
    radarContainer.innerHTML = svg;
  }

  // Line Chart
  const lineContainer = document.getElementById('lineChartContainer');
  if(lineContainer) {
    const rounds = (NBB.state.progress[NBB.state.currentSubject].rounds || []).slice(0, 20).reverse();
    if(rounds.length < 2) {
      lineContainer.innerHTML = '<div class="small" style="text-align:center;padding:20px">Сыграй 2+ раунда, чтобы увидеть график</div>';
    } else {
      let svg = `<svg viewBox="0 0 300 100" class="line-chart" preserveAspectRatio="none">`;
      for(let i=0; i<=4; i++) svg += `<line x1="0" y1="${i*25}" x2="300" y2="${i*25}" stroke="var(--line)" stroke-width="0.5"/>`;
      let pts = [];
      rounds.forEach((r, i) => {
         const x = (i / (rounds.length - 1)) * 280 + 10;
         const pct = r.correct / r.total;
         const y = 90 - pct * 80;
         pts.push(`${x},${y}`);
      });
      svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--green)" stroke-width="2"/>`;
      rounds.forEach((r, i) => {
         const x = (i / (rounds.length - 1)) * 280 + 10;
         const pct = r.correct / r.total;
         const y = 90 - pct * 80;
         svg += `<circle cx="${x}" cy="${y}" r="3" fill="var(--green)"><title>${r.mode}: ${Math.round(pct*100)}%</title></circle>`;
      });
      svg += `</svg>`;
      lineContainer.innerHTML = svg;
    }
  }
};

// ==== ПРОГРЕСС-ПАНЕЛЬ ====
NBB.ui.renderProgressPanel = function(){
  if(!NBB.state.currentSubject || !NBB.state.progress) return;
  const p = NBB.state.progress[NBB.state.currentSubject];
  if(!p) return;

  const setNum = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setNum('pTotalAns', p.totalAnswered);
  setNum('pTotalCor', p.totalCorrect);
  const acc = p.totalAnswered ? Math.round(p.totalCorrect / p.totalAnswered * 100) : 0;
  setNum('pAcc', p.totalAnswered ? acc + '%' : '—');
  setNum('pRounds', p.rounds.length);

  const avgTime = p.totalAnswered > 0 ? (NBB.state.progress.totalTime / p.totalAnswered / 1000).toFixed(1) : '0.0';

  let detail = '';
  const entries = Object.entries(p.byBook || {}).filter(([,v]) => v.a > 0).sort((a,b) => (b[1].c/b[1].a) - (a[1].c/a[1].a));
  if(entries.length > 0) {
    detail += `<p class="small" style="margin-bottom:8px">⏱ Среднее время на вопрос: <strong>${avgTime} с</strong></p>`;
  }

  const pd = document.getElementById('progressDetail');
  if(pd) pd.innerHTML = detail;

  const hl = document.getElementById('historyList');
  if(hl){
    if(p.rounds && p.rounds.length){
      hl.innerHTML = `<h4 style="margin:14px 0 6px">🕘 Последние раунды</h4>` +
        p.rounds.slice(0,5).map(r =>
          `<div class="history-item"><span>${r.mode} · ${r.correct}/${r.total} <span class="badge">${Math.round(r.correct/r.total*100)}%</span></span><span class="date">${new Date(r.ts).toLocaleDateString('ru-RU')}</span></div>`
        ).join('');
    } else {
      hl.innerHTML = '';
    }
  }

  document.querySelectorAll('.bar[data-book]').forEach(el => {
    const b = el.dataset.book;
    const v = p.byBook && p.byBook[b];
    if(v && v.a){
      el.textContent = `${Math.round(v.c/v.a*100)}%`;
      el.style.color = v.c/v.a >= 0.7 ? 'var(--green)' : 'var(--gold)';
    } else {
      el.textContent = '';
    }
  });

  NBB.ui.renderCharts();
};

NBB.ui.resetProgress = function(){
  if(!NBB.state.currentSubject || !NBB.state.progress) return;
  if(confirm(`Сбросить прогресс по предмету «${NBB.data.SUBJECTS[NBB.state.currentSubject].name}»?`)){
    NBB.state.progress[NBB.state.currentSubject] = NBB.progress.empty();
    NBB.progress.save();
    NBB.ui.renderProgressPanel();
  }
};

// ==== НАСТРОЙКИ (МОДАЛКА) ====
NBB.ui.openSettings = function(){
  const modal = document.getElementById('settingsModal');
  if(!modal) return;
  const s = NBB.state.progress.settings || {};
  const themeSel = document.getElementById('settingTheme');
  if(themeSel) themeSel.value = s.theme || 'auto';
  const soundBox = document.getElementById('settingSound');
  if(soundBox) soundBox.checked = s.sound !== false;
  const vibBox = document.getElementById('settingVibration');
  if(vibBox) vibBox.checked = s.vibration !== false;
  const shufBox = document.getElementById('settingShuffle');
  if(shufBox) shufBox.checked = s.shuffleAnswers !== false;
  modal.classList.remove('hidden');
};

NBB.ui.closeSettings = function(){
  const modal = document.getElementById('settingsModal');
  if(modal) modal.classList.add('hidden');
};