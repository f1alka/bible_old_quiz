window.NBB = window.NBB || {};
NBB.ui = {};

// ==== ПОЛУЧИТЬ ТЕКУЩИЕ СПИСКИ ====
NBB.ui.getBooks = function(){
  return NBB.state.currentSubject === 'ot' ? NBB.data.BOOKS_OT : NBB.data.BOOKS_BS;
};
NBB.ui.getCategories = function(){
  return NBB.state.currentSubject === 'ot' ? NBB.data.CATEGORIES_OT : NBB.data.CATEGORIES_BS;
};
NBB.ui.getModes = function(){
  return NBB.state.currentSubject === 'ot' ? NBB.data.MODES_OT : NBB.data.MODES_BS;
};

// ==== ФИЛЬТР ПО КНИГАМ ====
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

// ==== СТАТИСТИКА МЕНЮ ====
NBB.ui.renderSubjectStats = function(){
  ['ot','bs'].forEach(s => {
    const p = NBB.state.progress[s];
    const el = document.getElementById('stats_' + s);
    if(!el) return;
    if(p.totalAnswered){
      el.textContent = `${p.totalCorrect}/${p.totalAnswered} правильных (${Math.round(p.totalCorrect/p.totalAnswered*100)}%) · ${p.rounds.length} раундов`;
    } else {
      el.textContent = "Ещё не начато";
    }
  });
};

// ==== ВЫБОР ПРЕДМЕТА ====
NBB.ui.selectSubject = function(subj){
  if(!NBB.data.SUBJECTS[subj]) return;
  NBB.state.currentSubject = subj;
  NBB.state.selectedBooks.clear();

  const meta = NBB.data.SUBJECTS[subj];
  NBB.ui.updateHeader();

  document.getElementById('introBrand').textContent = meta.name;
  document.getElementById('introTitle').textContent = meta.name;
  document.getElementById('introSub').textContent = meta.sub;
  document.getElementById('introNotice').textContent = meta.notice;
  document.getElementById('filterLabel').textContent = meta.filterLabel;
  document.getElementById('listTitle').textContent = meta.listTitle;
  document.getElementById('listSub').textContent = meta.listSub;

  document.getElementById('mode').innerHTML = NBB.ui.getModes()
    .map(m => `<option value="${m.v}">${m.l}</option>`).join('');

  const books = NBB.ui.getBooks();
  document.getElementById('booklist').innerHTML = books
    .map(b => `<div class="book"><span>${b}</span><span class="bar" data-book="${b}"></span></div>`).join('');

  NBB.ui.renderCategoryButtons();
  NBB.ui.renderBookFilter();
  NBB.ui.renderProgressPanel();

  document.getElementById('subjectSelect').classList.add('hidden');
  document.getElementById('game').classList.add('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('intro').classList.remove('hidden');

  NBB.ui.onBookSelectionChange();
  window.scrollTo({top:0, behavior:'smooth'});
};

NBB.ui.backToSubject = function(){
  NBB.state.currentSubject = null;
  NBB.state.selectedBooks.clear();
  NBB.ui.updateHeader();
  document.getElementById('subjectSelect').classList.remove('hidden');
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('game').classList.add('hidden');
  document.getElementById('result').classList.add('hidden');
  NBB.ui.renderSubjectStats();
  window.scrollTo({top:0, behavior:'smooth'});
};

// ==== КАТЕГОРИИ ====
NBB.ui.renderCategoryButtons = function(){
  const cats = NBB.ui.getCategories();
  const box = document.getElementById('catButtons');
  box.innerHTML = Object.keys(cats).map(cat => {
    const n = cats[cat].length;
    return `<button type="button" class="cat-btn" data-cat="${cat}">${cat}<span class="cnt">${n}</span></button>`;
  }).join('');
  box.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      const books = cats[cat];
      const allSel = books.every(b => NBB.state.selectedBooks.has(b));
      if(allSel){
        books.forEach(b => NBB.state.selectedBooks.delete(b));
        box.parentElement.querySelectorAll('#bookFilter .book-chip').forEach(el => {
          if(books.includes(el.dataset.book)) el.classList.remove('selected');
        });
      } else {
        books.forEach(b => NBB.state.selectedBooks.add(b));
        box.parentElement.querySelectorAll('#bookFilter .book-chip').forEach(el => {
          if(books.includes(el.dataset.book)) el.classList.add('selected');
        });
      }
      NBB.ui.onBookSelectionChange();
    });
  });
};

NBB.ui.updateCategoryButtonsState = function(){
  const cats = NBB.ui.getCategories();
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
  const books = NBB.ui.getBooks();
  const box = document.getElementById('bookFilter');
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
  document.getElementById('selectedCount').textContent =
    n === 0 ? `выбрано: 0 (всё)` :
    (n === total ? `выбрано: все ${n}` : `выбрано: ${n} из ${total}`);
  NBB.ui.updateCategoryButtonsState();
  const available = NBB.ui.filterBySubjectAndBooks(NBB.data.all);
  document.getElementById('totalLabel').textContent =
    `Доступно вопросов: ${available.length}${n > 0 ? " (по выбранному)" : " (всё)"}`;
};

// ==== ПРОГРЕСС-ПАНЕЛЬ ====
NBB.ui.renderProgressPanel = function(){
  if(!NBB.state.currentSubject) return;
  const p = NBB.state.progress[NBB.state.currentSubject];
  document.getElementById('pTotalAns').textContent = p.totalAnswered;
  document.getElementById('pTotalCor').textContent = p.totalCorrect;
  const acc = p.totalAnswered ? Math.round(p.totalCorrect / p.totalAnswered * 100) : 0;
  document.getElementById('pAcc').textContent = p.totalAnswered ? acc + '%' : '—';
  document.getElementById('pRounds').textContent = p.rounds.length;

  const entries = Object.entries(p.byBook)
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
  document.getElementById('progressDetail').innerHTML = detail;

  if(p.rounds.length){
    document.getElementById('historyList').innerHTML =
      `<h4 style="margin:14px 0 6px">🕘 История раундов</h4>` +
      p.rounds.slice(0,5).map(r =>
        `<div class="history-item"><span>${r.mode} · ${r.correct}/${r.total} <span class="badge">${Math.round(r.correct/r.total*100)}%</span></span><span class="date">${new Date(r.ts).toLocaleDateString('ru-RU')}</span></div>`
      ).join('');
  } else {
    document.getElementById('historyList').innerHTML = '';
  }

  document.querySelectorAll('.bar[data-book]').forEach(el => {
    const b = el.dataset.book;
    const v = p.byBook[b];
    if(v && v.a){
      el.textContent = `${Math.round(v.c/v.a*100)}%`;
      el.style.color = v.c/v.a >= 0.7 ? '#49c58b' : '#e6bd70';
    } else {
      el.textContent = '';
    }
  });
};

// ==== СБРОС ПРОГРЕССА ====
NBB.ui.resetProgress = function(){
  if(!NBB.state.currentSubject) return;
  if(confirm(`Сбросить прогресс по предмету «${NBB.data.SUBJECTS[NBB.state.currentSubject].name}»?`)){
    NBB.state.progress[NBB.state.currentSubject] = NBB.progress.empty();
    NBB.progress.save();
    NBB.ui.renderProgressPanel();
  }
};