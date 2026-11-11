window.NBB = window.NBB || {};
NBB.ui = {};

// ==== УТИЛИТЫ ПОКАЗА/СКРЫТИЯ ====
// Используем inline style — работает даже если .hidden в CSS отсутствует или переопределён
function show(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.remove('hidden');
  el.style.display = '';
}
function hide(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('hidden');
  el.style.display = 'none';
}
NBB.ui.show = show;
NBB.ui.hide = hide;

// ==== ФАТАЛЬНАЯ ОШИБКА ====
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

// ==== СПИСКИ ПО ТЕКУЩЕМУ ПРЕДМЕТУ ====
NBB.ui.getBooks = function(){
  return NBB.state.currentSubject === 'ot' ? NBB.data.BOOKS_OT : NBB.data.BOOKS_BS;
};
NBB.ui.getCategories = function(){
  return NBB.state.currentSubject === 'ot' ? NBB.data.CATEGORIES_OT : NBB.data.CATEGORIES_BS;
};
NBB.ui.getModes = function(){
  return NBB.state.currentSubject === 'ot' ? NBB.data.MODES_OT : NBB.data.MODES_BS;
};

// ==== ФИЛЬТР ====
function bookMatches(q, selectedSet){
  if(selectedSet.size === 0) return true;
  if(q.type === "match"){
    if(!q.books) return false;
    return q.books.some(b => selectedSet.has(b));
  }
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
  console.log('[selectSubject] вход, subj =', subj);
  try {
    // 1) Проверки
    if(!NBB.data || !NBB.data.SUBJECTS) throw new Error('NBB.data.SUBJECTS не загружен (проверьте js/data/constants.js)');
    if(!NBB.data.SUBJECTS[subj]) throw new Error('Предмет не найден: ' + subj);
    if(!NBB.state.progress) throw new Error('NBB.state.progress не инициализирован (проверьте js/progress.js)');

    // 2) Состояние
    NBB.state.currentSubject = subj;
    if(NBB.state.selectedBooks) NBB.state.selectedBooks.clear();

    const meta = NBB.data.SUBJECTS[subj];
    NBB.ui.updateHeader();

    // 3) Тексты
    const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    setText('introBrand', meta.name);
    setText('introTitle', meta.name);
    setText('introSub', meta.sub);
    setText('introNotice', meta.notice);
    setText('filterLabel', meta.filterLabel);
    setText('listTitle', meta.listTitle);
    setText('listSub', meta.listSub);

    // 4) Режимы
    const modeEl = document.getElementById('mode');
    if(!modeEl) throw new Error('Элемент #mode не найден в HTML');
    const modes = NBB.ui.getModes();
    if(!modes || !modes.length) throw new Error('MODES для предмета не найдены');
    modeEl.innerHTML = modes.map(m => `<option value="${m.v}">${m.l}</option>`).join('');

    // 5) Список книг/глав
    const listEl = document.getElementById('booklist');
    if(!listEl) throw new Error('Элемент #booklist не найден в HTML');
    const books = NBB.ui.getBooks();
    if(!books || !books.length) throw new Error('BOOKS для предмета не найдены');
    listEl.innerHTML = books.map(b =>
      `<div class="book"><span>${b}</span><span class="bar" data-book="${b}"></span></div>`
    ).join('');

    // 6) Отрисовка фильтра
    NBB.ui.renderCategoryButtons();
    NBB.ui.renderBookFilter();
    NBB.ui.renderProgressPanel();

    // 7) Показ/скрытие — через inline style
    hide('subjectSelect');
    hide('game');
    hide('result');
    show('intro');

    NBB.ui.onBookSelectionChange();
    window.scrollTo({top:0, behavior:'smooth'});
    console.log('[selectSubject] OK');
  } catch(e){
    console.error('[selectSubject] ОШИБКА:', e);
    showFatalError('Не удалось открыть предмет: ' + e.message);
  }
};

NBB.ui.backToSubject = function(){
  try {
    NBB.state.currentSubject = null;
    if(NBB.state.selectedBooks) NBB.state.selectedBooks.clear();
    NBB.ui.updateHeader();
    show('subjectSelect');
    hide('intro');
    hide('game');
    hide('result');
    NBB.ui.renderSubjectStats();
    window.scrollTo({top:0, behavior:'smooth'});
  } catch(e){
    console.error('[backToSubject] ОШИБКА:', e);
    showFatalError('Не удалось вернуться в меню: ' + e.message);
  }
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
        filterBox.querySelectorAll('.book-chip').forEach(el => {
          if(books.includes(el.dataset.book)) el.classList.remove('selected');
        });
      } else {
        books.forEach(b => NBB.state.selectedBooks.add(b));
        filterBox.querySelectorAll('.book-chip').forEach(el => {
          if(books.includes(el.dataset.book)) el.classList.add('selected');
        });
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

// ==== ЧИПЫ КНИГ ====
NBB.ui.renderBookFilter = function(){
  const box = document.getElementById('bookFilter');
  if(!box) return;
  const books = NBB.ui.getBooks();
  if(!books) return;
  box.innerHTML = books.map(b =>
    `<button type="button" class="book-chip" data-book="${b}">${b}</button>`
  ).join('');
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
  if(countEl){
    countEl.textContent =
      n === 0 ? `выбрано: 0 (всё)` :
      (n === total ? `выбрано: все ${n}` : `выбрано: ${n} из ${total}`);
  }
  NBB.ui.updateCategoryButtonsState();
  const available = NBB.ui.filterBySubjectAndBooks(NBB.data.all || []);
  const labelEl = document.getElementById('totalLabel');
  if(labelEl){
    labelEl.textContent = `Доступно вопросов: ${available.length}${n > 0 ? " (по выбранному)" : " (всё)"}`;
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

  const entries = Object.entries(p.byBook || {})
    .filter(([,v]) => v.a > 0)
    .sort((a,b) => (b[1].c/b[1].a) - (a[1].c/a[1].a));
  const top = entries.slice(0, 12);
  let detail = '';
  if(top.length){
    detail += `<h4 style="margin:6px 0">📚 По разделам</h4><div class="chart">`;
    top.forEach(([book, v]) => {
      const pct = Math.round(v.c/v.a*100);
      const label = book.length > 8 ? book.slice(0,7)+'…' : book;
      detail += `<div class="chart-bar" title="${book}: ${v.c}/${v.a} (${pct}%)"><div class="inner" style="height:${pct}%"></div><div class="lbl">${label}</div></div>`;
    });
    detail += `</div>`;
  } else {
    detail = `<p class="small">Начни игру — здесь появится статистика по разделам и категориям.</p>`;
  }
  const pd = document.getElementById('progressDetail');
  if(pd) pd.innerHTML = detail;

  const hl = document.getElementById('historyList');
  if(hl){
    if(p.rounds && p.rounds.length){
      hl.innerHTML = `<h4 style="margin:14px 0 6px">🕘 История раундов</h4>` +
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
      el.style.color = v.c/v.a >= 0.7 ? '#49c58b' : '#e6bd70';
    } else {
      el.textContent = '';
    }
  });
};

NBB.ui.resetProgress = function(){
  if(!NBB.state.currentSubject || !NBB.state.progress) return;
  if(confirm(`Сбросить прогресс по предмету «${NBB.data.SUBJECTS[NBB.state.currentSubject].name}»?`)){
    NBB.state.progress[NBB.state.currentSubject] = NBB.progress.empty();
    NBB.progress.save();
    NBB.ui.renderProgressPanel();
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
    btn.setAttribute('aria-label', btn.title);
  };
  
  NBB.ui.applyTheme = function(mode){
    const root = document.documentElement;
    let effective = mode;
    if(!mode || mode === 'auto'){
      effective = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
        ? 'light' : 'dark';
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