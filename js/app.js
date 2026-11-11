window.NBB = window.NBB || {};

// Ловим ошибки загрузки <script> — покажет имя файла в баннере
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

function validateSetup(){
  var errors = [];
  var fileMap = {
    'otQuestions': 'js/data/ot-questions.js',
    'otMatch':     'js/data/ot-match.js',
    'bsQuestions': 'js/data/bs-questions.js',
    'bsMatch':     'js/data/bs-match.js',
    'all':         'js/data/constants.js (строка: NBB.data.all = ...)',
    'SUBJECTS':    'js/data/constants.js (строка: NBB.data.SUBJECTS = ...)',
    'BOOKS_OT':    'js/data/constants.js (строка: NBB.data.BOOKS_OT = ...)',
    'BOOKS_BS':    'js/data/constants.js (строка: NBB.data.BOOKS_BS = ...)',
    'MODES_OT':    'js/data/constants.js (строка: NBB.data.MODES_OT = ...)',
    'MODES_BS':    'js/data/constants.js (строка: NBB.data.MODES_BS = ...)'
  };

  if (!window.NBB) errors.push('window.NBB отсутствует');
  if (!NBB.data){
    errors.push('NBB.data отсутствует → js/data/constants.js не выполнился');
  } else {
    for (var key in fileMap){
      if (typeof NBB.data[key] === 'undefined'){
        errors.push('NBB.data.' + key + ' отсутствует → проверьте ' + fileMap[key]);
      }
    }
  }
  if (!NBB.state) errors.push('NBB.state отсутствует → js/state.js');
  else if (!NBB.state.progress) errors.push('NBB.state.progress = null → js/progress.js (последняя строка: NBB.state.progress = NBB.progress.load();)');
  if (!NBB.progress) errors.push('NBB.progress отсутствует → js/progress.js');
  if (!NBB.ui) errors.push('NBB.ui отсутствует → js/ui.js');
  else if (!NBB.ui.selectSubject) errors.push('NBB.ui.selectSubject отсутствует → js/ui.js');
  if (!NBB.game) errors.push('NBB.game отсутствует → js/game.js');
  else if (!NBB.game.start) errors.push('NBB.game.start отсутствует → js/game.js');

  var ids = ['subjectSelect','intro','game','result','headerRight','booklist','mode','bookFilter','catButtons','backToSubject','start'];
  ids.forEach(function(id){
    if (!document.getElementById(id)) errors.push('DOM: #' + id + ' отсутствует в index.html');
  });

  return errors;
}

(function(){
  try {
    var errors = validateSetup();

    // Если дошли до ui.js — можно показать красивый баннер
    if (errors.length){
      console.error('[Тренажёр НББС] Ошибки:');
      errors.forEach(function(e){ console.error(' •', e); });
      if (NBB.ui && NBB.ui.showFatalError){
        NBB.ui.showFatalError(errors.join(' | '));
      } else {
        alert('Ошибки загрузки:\n' + errors.join('\n'));
      }
      return;
    }

    console.log('[Тренажёр НББС] Все файлы загружены. ОВЗ:', NBB.data.otQuestions.length,
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
    console.error('[Тренажёр НББС] Критическая ошибка:', e);
    if (NBB.ui && NBB.ui.showFatalError){
      NBB.ui.showFatalError('Критическая ошибка: ' + e.message);
    } else {
      alert('Критическая ошибка: ' + e.message);
    }
  }
})();