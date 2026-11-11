window.NBB = window.NBB || {};

// Ловим ошибки загрузки <script>
window.addEventListener('error', function(e){
  if (e.target && e.target.tagName === 'SCRIPT'){
    var src = e.target.src || e.target.getAttribute('src') || '?';
    var name = src.split('/').pop();
    if (NBB.ui && NBB.ui.showFatalError){
      NBB.ui.showFatalError('Не загрузился файл: ' + name + ' (путь: ' + src + ')');
    }
    console.error('[SCRIPT LOAD ERROR]', src);
  }
}, true);

// ==== ГЛАВНАЯ ДИАГНОСТИКА ====
(function(){
  try {
    var errors = [];

    // 1) Проверка скриптов на странице
    var scripts = document.querySelectorAll('script');
    var loadedSrcs = [];
    scripts.forEach(function(s){
      var src = s.src || s.getAttribute('src') || '';
      if (src) loadedSrcs.push(src.split('/').slice(-2).join('/'));
    });
    console.log('[diagnostics] Подключённые скрипты:', loadedSrcs);

    // 2) Проверка data-модулей
    if (!window.NBB) errors.push('window.NBB не создан');
    if (!NBB.data){
      errors.push('NBB.data отсутствует → js/data/constants.js не выполнился');
    } else {
      var required = ['all', 'SUBJECTS', 'BOOKS_OT', 'BOOKS_BS', 'MODES_OT', 'MODES_BS', 'CATEGORIES_OT', 'CATEGORIES_BS'];
      required.forEach(function(key){
        if (typeof NBB.data[key] === 'undefined'){
          errors.push('NBB.data.' + key + ' отсутствует');
        }
      });
      if (NBB.data.otQuestions && NBB.data.otQuestions.length === 0){
        errors.push('NBB.data.otQuestions пустой (массив = 0) → js/data/ot-questions.js мог не выполниться');
      }
      if (NBB.data.bsQuestions && NBB.data.bsQuestions.length === 0){
        errors.push('NBB.data.bsQuestions пустой → js/data/bs-questions.js мог не выполниться');
      }
    }

    // 3) Проверка state, progress, ui, game
    if (!NBB.state) errors.push('NBB.state отсутствует → js/state.js');
    else if (!NBB.state.progress) errors.push('NBB.state.progress = null → js/progress.js');
    if (!NBB.progress) errors.push('NBB.progress отсутствует → js/progress.js');
    if (!NBB.ui) errors.push('NBB.ui отсутствует → js/ui.js');
    else if (!NBB.ui.selectSubject) errors.push('NBB.ui.selectSubject отсутствует');
    if (!NBB.game) errors.push('NBB.game отсутствует → js/game.js');
    else if (!NBB.game.start) errors.push('NBB.game.start отсутствует');

    // 4) Проверка DOM
    var ids = ['subjectSelect','intro','game','result','headerRight','booklist','mode','bookFilter','catButtons','backToSubject','start'];
    ids.forEach(function(id){
      if (!document.getElementById(id)) errors.push('DOM: #' + id + ' отсутствует в index.html');
    });

    // ==== ВЫВОД ====
    if (errors.length){
      console.error('[Тренажёр НББС] ОШИБКИ:');
      errors.forEach(function(e){ console.error('  •', e); });
      if (NBB.ui && NBB.ui.showFatalError){
        NBB.ui.showFatalError(errors.join(' | '));
      } else {
        alert('Ошибки загрузки:\n' + errors.join('\n'));
      }
      return;
    }

    // ==== ВСЁ ОК, НАВЕШИВАЕМ ОБРАБОТЧИКИ ====
    console.log('[Тренажёр НББС] Все модули загружены. ОВЗ:', NBB.data.otQuestions.length,
                '| ОИБ:', NBB.data.bsQuestions.length,
                '| матчей:', NBB.data.otMatch.length + NBB.data.bsMatch.length);

    var $ = function(id){ return document.getElementById(id); };

    document.querySelectorAll('.subject-card').forEach(function(btn){
      btn.addEventListener('click', function(){ NBB.ui.selectSubject(btn.dataset.subject); });
    });

    $('backToSubject').addEventListener('click', NBB.ui.backToSubject);
    $('home').addEventListener('click', function(){
      NBB.ui.hide('result');
      NBB.ui.show('intro');
      window.scrollTo({top:0, behavior:'smooth'});
    });

    $('selectAllBooks').addEventListener('click', NBB.ui.selectAllBooks);
    $('clearBooks').addEventListener('click', NBB.ui.clearBooks);
    $('resetProgress').addEventListener('click', NBB.ui.resetProgress);

    $('start').addEventListener('click', NBB.game.start);
    $('quit').addEventListener('click', NBB.game.finish);
    $('again').addEventListener('click', NBB.game.start);
    $('next').addEventListener('click', function(){
      if (NBB.state.index < NBB.state.round.length - 1){
        NBB.state.index++;
        NBB.game.render();
      } else {
        NBB.game.finish();
      }
    });

    NBB.ui.renderSubjectStats();
    NBB.ui.updateHeader();
    console.log('[Тренажёр НББС] Инициализация успешна.');
  } catch(e){
    console.error('[Тренажёр НББС] КРИТИЧЕСКАЯ ОШИБКА:', e);
    if (NBB.ui && NBB.ui.showFatalError){
      NBB.ui.showFatalError('Критическая ошибка: ' + e.message);
    } else {
      alert('Критическая ошибка: ' + e.message);
    }
  }
})();