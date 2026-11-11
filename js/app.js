window.NBB = window.NBB || {};

// Ловим ошибки загрузки <script>
window.addEventListener('error', function(e){
  if(e.target && e.target.tagName === 'SCRIPT'){
    const src = e.target.src || e.target.getAttribute('src') || '?';
    if(NBB.ui && NBB.ui.showFatalError){
      NBB.ui.showFatalError('Не загрузился файл: ' + src.split('/').pop());
    }
  }
}, true);

(function(){
  try {
    // Проверки
    const errors = [];
    if(!window.NBB) errors.push('window.NBB отсутствует');
    if(!NBB.data) errors.push('NBB.data отсутствует → js/data/constants.js не выполнился');
    else {
      ['all','SUBJECTS','BOOKS_OT','BOOKS_BS','MODES_OT','MODES_BS'].forEach(k => {
        if(typeof NBB.data[k] === 'undefined') errors.push('NBB.data.' + k + ' отсутствует');
      });
    }
    if(!NBB.state) errors.push('NBB.state отсутствует');
    else if(!NBB.state.progress) errors.push('NBB.state.progress = null');
    if(!NBB.progress) errors.push('NBB.progress отсутствует');
    if(!NBB.ui) errors.push('NBB.ui отсутствует');
    if(!NBB.game) errors.push('NBB.game отсутствует');
    ['subjectSelect','intro','game','result','headerRight','booklist','mode','bookFilter','catButtons','backToSubject','start','themeToggle'].forEach(id => {
      if(!document.getElementById(id)) errors.push('DOM: #' + id + ' отсутствует в index.html');
    });

    if(errors.length){
      console.error('[Тренажёр НББС] Ошибки:', errors);
      if(NBB.ui && NBB.ui.showFatalError) NBB.ui.showFatalError(errors.join(' | '));
      return;
    }

    const $ = id => document.getElementById(id);

    // ==== ТЕМА ====
    NBB.ui.initTheme();
    $('themeToggle').addEventListener('click', NBB.ui.cycleTheme);

    // ==== ВЫБОР ПРЕДМЕТА ====
    document.querySelectorAll('.subject-card').forEach(btn => {
      btn.addEventListener('click', () => NBB.ui.selectSubject(btn.dataset.subject));
    });

    // ==== НАВИГАЦИЯ ====
    $('backToSubject').addEventListener('click', NBB.ui.backToSubject);
    $('home').addEventListener('click', () => {
      NBB.ui.hide('result');
      NBB.ui.show('intro');
      window.scrollTo({top:0, behavior:'smooth'});
    });

    // ==== ФИЛЬТР ====
    $('selectAllBooks').addEventListener('click', NBB.ui.selectAllBooks);
    $('clearBooks').addEventListener('click', NBB.ui.clearBooks);
    $('resetProgress').addEventListener('click', NBB.ui.resetProgress);

    // ==== ИГРА ====
    $('start').addEventListener('click', NBB.game.start);
    $('quit').addEventListener('click', NBB.game.finish);
    $('again').addEventListener('click', NBB.game.start);
    $('next').addEventListener('click', () => {
      if(NBB.state.index < NBB.state.round.length - 1){
        NBB.state.index++;
        NBB.game.render();
      } else {
        NBB.game.finish();
      }
    });

    // ==== ИНИЦИАЛИЗАЦИЯ ====
    NBB.ui.renderSubjectStats();
    NBB.ui.updateHeader();
    console.log('[Тренажёр НББС] Инициализация успешна.');

    // ==== SERVICE WORKER ====
    if('serviceWorker' in navigator){
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[SW] зарегистрирован:', reg.scope))
          .catch(err => console.warn('[SW] ошибка регистрации:', err));
      });
    }
  } catch(e){
    console.error('[Тренажёр НББС] КРИТИЧЕСКАЯ ОШИБКА:', e);
    if(NBB.ui && NBB.ui.showFatalError) NBB.ui.showFatalError('Критическая ошибка: ' + e.message);
  }
})();