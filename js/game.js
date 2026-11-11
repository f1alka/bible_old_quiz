window.NBB = window.NBB || {};
NBB.game = {};

const IS_MOBILE = () => window.innerWidth <= 640;

function shuffle(a){
  const x = [...a];
  for(let i = x.length-1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}
NBB.game.shuffle = shuffle;

function getShuffledOrder(q){
  const idx = [0,1,2,3];
  for(let a = 0; a < 10; a++){
    const order = shuffle(idx);
    const key = order.join(',');
    if(key !== q._lastOrderKey){ q._lastOrderKey = key; return order; }
  }
  let order = shuffle(idx);
  const shift = 1 + Math.floor(Math.random()*3);
  order = order.slice(shift).concat(order.slice(0, shift));
  q._lastOrderKey = order.join(',');
  return order;
}
function getShuffledRightOrder(q){
  const idx = q.pairs.map((_, i) => i);
  for(let a = 0; a < 10; a++){
    const order = shuffle(idx);
    const key = order.join(',');
    if(key !== q._lastRightOrderKey){ q._lastRightOrderKey = key; return order; }
  }
  let order = shuffle(idx);
  const shift = 1 + Math.floor(Math.random()*(idx.length-1));
  order = order.slice(shift).concat(order.slice(0, shift));
  q._lastRightOrderKey = order.join(',');
  return order;
}

NBB.game.start = function(){
  if(!NBB.state.currentSubject) return;

  let pool = NBB.ui.filterBySubjectAndBooks(NBB.data.all);
  const mode = document.getElementById('mode').value;
  NBB.state.roundMode = document.getElementById('mode').selectedOptions[0].textContent;

  const modeMap = {
    author: ['Автор','История'],
    goal: ['Цель'],
    theme: ['Тема','Ключевой стих'],
    structure: ['Структура','Жанр'],
    definition: ['Определение'],
    example: ['Пример'],
    keyverse: ['Ключевой стих']
  };

  if(mode === 'match') pool = pool.filter(q => q.type === 'match');
  else if(mode === 'hard') pool = pool.filter(q => q.why && q.why.length > 60);
  else if(mode === 'mixed') pool = shuffle(pool).slice(0, 20);
  else if(modeMap[mode]) pool = pool.filter(q => q.type !== 'match' && modeMap[mode].includes(q.category));

  if(document.getElementById('order').value === 'random') pool = shuffle(pool);
  const count = document.getElementById('count').value;
  if(mode !== 'mixed' && count !== 'all') pool = pool.slice(0, Number(count));

  if(!pool.length){
    alert('Для выбранного режима и фильтра нет вопросов. Попробуй расширить выбор.');
    return;
  }

  NBB.state.round = pool;
  NBB.state.index = 0;
  NBB.state.correct = 0;
  NBB.state.mistakes = [];
  NBB.state.matchState = null;
  NBB.state.questionStartTime = Date.now();

  NBB.ui.hide('intro');
  NBB.ui.hide('result');
  NBB.ui.show('game');

  NBB.game.render();
};

NBB.game.render = function(){
  const q = NBB.state.round[NBB.state.index];
  NBB.state.answered = false;
  NBB.state.matchState = null;
  NBB.state.questionStartTime = Date.now();

  document.getElementById('progressText').textContent = `Вопрос ${NBB.state.index + 1} из ${NBB.state.round.length}`;
  document.getElementById('scoreText').textContent = `Верно: ${NBB.state.correct}`;
  document.getElementById('fill').style.width = `${NBB.state.index / NBB.state.round.length * 100}%`;
  document.getElementById('bookTag').textContent = q.book;
  document.getElementById('categoryTag').textContent = q.category;
  document.getElementById('qnum').textContent = `ВОПРОС ${String(NBB.state.index + 1).padStart(2,'0')}${q.type === 'match' ? ' · СОПОСТАВЛЕНИЕ' : ''}`;
  document.getElementById('question').textContent = q.q;
  document.getElementById('feedback').className = 'feedback hidden';
  document.getElementById('feedback').textContent = '';
  document.getElementById('next').disabled = true;
  document.getElementById('next').textContent = NBB.state.index === NBB.state.round.length - 1 ? 'Показать результат' : 'Следующий →';

  if(window.scrollY > 80) window.scrollTo({top:0, behavior:'smooth'});

  if(q.type === 'match'){
    NBB.game.renderMatch(q);
  } else {
    const shuffleOn = !NBB.state.progress.settings || NBB.state.progress.settings.shuffleAnswers !== false;
    const order = shuffleOn ? getShuffledOrder(q) : [0,1,2,3];
    const shuffledA = order.map(i => q.a[i]);
    const newCorrect = order.indexOf(q.correct);
    q._shuffled = shuffledA;
    q._correct = newCorrect;

    document.getElementById('answers').innerHTML = shuffledA.map((a, i) =>
      `<button class="answer" data-i="${i}"><span class="letter">${NBB.data.LETTERS[i]}</span><span>${a}</span></button>`
    ).join('');
    document.getElementById('answers').querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => NBB.game.choose(Number(b.dataset.i)));
    });
  }
};

NBB.game.renderMatch = function(q){
  const rightOrder = getShuffledRightOrder(q);
  NBB.state.matchState = { pairs: q.pairs, rightOrder, matchedLeft: new Set(), matchedRight: new Set(), selectedLeft: null, correctCount: 0 };

  const leftHTML = q.pairs.map((p, i) => `<button type="button" class="match-item" data-side="left" data-idx="${i}">${p.left}</button>`).join('');
  const rightHTML = rightOrder.map(i => `<button type="button" class="match-item" data-side="right" data-idx="${i}">${q.pairs[i].right}</button>`).join('');

  document.getElementById('answers').innerHTML = `
    <div class="match-wrap">
      <div class="match-selection-bar" id="matchSelBar"></div>
      <div class="match-columns">
        <div class="match-col"><div class="match-col-header">${q.leftLabel || 'Столбец A'}</div>${leftHTML}</div>
        <div class="match-col"><div class="match-col-header">${q.rightLabel || 'Столбец B'}</div>${rightHTML}</div>
      </div>
      <div class="match-progress"><div class="match-progress-fill" id="matchFill" style="width:0%"></div></div>
      <div class="match-status" id="matchStatus">Совпадений: 0 из ${q.pairs.length}</div>
      <div class="match-hint">${IS_MOBILE() ? 'Выбери элемент в верхнем списке, затем пару в нижнем ↓' : 'Кликни по элементу слева, затем по соответствующему справа'}</div>
    </div>`;

  document.getElementById('answers').querySelectorAll('.match-item').forEach(el => el.addEventListener('click', NBB.game.onMatchClick));
};

function updateSelectionBanner(text){
  const bar = document.getElementById('matchSelBar');
  if(!bar) return;
  if(text){ bar.classList.add('active'); bar.innerHTML = `Выбрано: <strong>${text}</strong><span style="color:var(--muted);font-weight:normal">↓ теперь выберите пару ниже</span>`; }
  else { bar.classList.remove('active'); bar.innerHTML = ''; }
}

NBB.game.onMatchClick = function(e){
  if(NBB.state.answered) return;
  const el = e.currentTarget;
  if(el.classList.contains('matched')) return;
  const side = el.dataset.side;
  const idx = Number(el.dataset.idx);
  const ms = NBB.state.matchState;

  if(side === 'left'){
    document.querySelectorAll('.match-item[data-side="left"].selected').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
    ms.selectedLeft = idx;
    updateSelectionBanner(ms.pairs[idx].left);
    return;
  }

  if(ms.selectedLeft === null) return;
  const leftIdx = ms.selectedLeft;

  if(leftIdx === idx){
    ms.matchedLeft.add(leftIdx);
    ms.matchedRight.add(idx);
    ms.correctCount++;
    const leftEl = document.querySelector(`.match-item[data-side="left"][data-idx="${leftIdx}"]`);
    if(leftEl){ leftEl.classList.remove('selected'); leftEl.classList.add('matched'); }
    el.classList.add('matched');
    ms.selectedLeft = null;
    updateSelectionBanner(null);

    const pct = Math.round(ms.correctCount / ms.pairs.length * 100);
    const fill = document.getElementById('matchFill');
    if(fill) fill.style.width = pct + '%';
    const st = document.getElementById('matchStatus');
    if(st) st.textContent = `Совпадений: ${ms.correctCount} из ${ms.pairs.length}`;

    NBB.ui.playSound('correct');
    NBB.ui.vibrate(20);

    if(IS_MOBILE() && ms.correctCount < ms.pairs.length){
      setTimeout(() => { const w = document.querySelector('.match-wrap'); if(w) w.scrollIntoView({behavior:'smooth', block:'start'}); }, 250);
    }
    if(ms.correctCount === ms.pairs.length) NBB.game.finishMatch();
  } else {
    el.classList.add('wrong-flash');
    const leftEl = document.querySelector(`.match-item[data-side="left"][data-idx="${leftIdx}"]`);
    if(leftEl) leftEl.classList.add('wrong-flash');
    setTimeout(() => {
      el.classList.remove('wrong-flash');
      if(leftEl) leftEl.classList.remove('wrong-flash');
    }, 500);
    NBB.ui.playSound('wrong');
    NBB.ui.vibrate(60);
  }
};

NBB.game.finishMatch = function(){
  NBB.state.answered = true;
  const q = NBB.state.round[NBB.state.index];
  const elapsed = Date.now() - NBB.state.questionStartTime;
  NBB.progress.recordTime(elapsed);
  NBB.progress.recordAnswer(NBB.state.currentSubject, q.book, q.category, true);
  NBB.state.correct++;

  const fb = document.getElementById('feedback');
  fb.classList.remove('hidden');
  fb.classList.add('good');
  fb.innerHTML = `<strong>✅ Все пары найдены верно!</strong><span>${q.why || ''}</span>`;
  document.getElementById('scoreText').textContent = `Верно: ${NBB.state.correct}`;
  document.getElementById('next').disabled = false;
  NBB.ui.playSound('correct');
  NBB.ui.vibrate([40, 40, 40]);
};

NBB.game.choose = function(n){
  if(NBB.state.answered) return;
  NBB.state.answered = true;

  const elapsed = Date.now() - NBB.state.questionStartTime;
  NBB.progress.recordTime(elapsed);

  const q = NBB.state.round[NBB.state.index];
  const good = n === q._correct;
  NBB.progress.recordAnswer(NBB.state.currentSubject, q.book, q.category, good);
  if(good) NBB.state.correct++;
  else NBB.state.mistakes.push({q, chosen:n});

  [...document.getElementById('answers').children].forEach((b, i) => {
    b.disabled = true;
    if(i === q._correct) b.classList.add('correct');
    else if(i === n) b.classList.add('wrong');
  });

  const fb = document.getElementById('feedback');
  fb.classList.remove('hidden');
  fb.classList.add(good ? 'good' : 'bad');
  fb.innerHTML = `<strong>${good ? '✅ Верно! Отличная работа.' : '❌ Не совсем. Правильный ответ: ' + NBB.data.LETTERS[q._correct] + '.'}</strong><span>${q.why}</span>`;

  document.getElementById('scoreText').textContent = `Верно: ${NBB.state.correct}`;
  document.getElementById('next').disabled = false;

  NBB.ui.playSound(good ? 'correct' : 'wrong');
  NBB.ui.vibrate(good ? 30 : [40, 40]);

  if(IS_MOBILE()) setTimeout(() => fb.scrollIntoView({behavior:'smooth', block:'nearest'}), 100);
};

NBB.game.finish = function(){
  NBB.ui.hide('game');
  NBB.ui.show('result');

  const pct = Math.round(NBB.state.correct / NBB.state.round.length * 100);
  document.getElementById('finalScore').textContent = `${pct}%`;
  document.getElementById('resultText').textContent =
    `Правильных ответов: ${NBB.state.correct} из ${NBB.state.round.length}. ${
      pct >= 90 ? 'Отличное знание материала!' :
      pct >= 70 ? 'Хороший результат. Повтори вопросы с ошибками.' :
      pct >= 50 ? 'Есть основа — закрепи слабые места и сыграй ещё раз.' :
      'Стоит повторить материал и пройти раунд снова.'
    }`;

  document.getElementById('missed').innerHTML = NBB.state.mistakes.length
    ? `<h3>Что стоит повторить</h3>` + NBB.state.mistakes.map(m => {
        if(m.q.type === 'match') return `<div class="feedback bad"><strong>${m.q.q}</strong><div class="small">${m.q.why || ''}</div></div>`;
        return `<div class="feedback bad"><strong>${m.q.book}: ${m.q.q}</strong><div>Правильный ответ: ${m.q.a[m.q.correct]}</div><div class="small">${m.q.why}</div></div>`;
      }).join('')
    : '<h3>Без ошибок — так держать!</h3>';

  NBB.progress.recordRound(NBB.state.currentSubject, { ts: Date.now(), mode: NBB.state.roundMode, total: NBB.state.round.length, correct: NBB.state.correct });
  NBB.ui.renderProgressPanel();
  window.scrollTo({top:0, behavior:'smooth'});
};