window.NBB = window.NBB || {};

// ==== ДИАГНОСТИКА ====
function validateSetup(){
  const errors = [];
  if(!window.NBB) errors.push('window.NBB не создан');
  if(!NBB.data) errors.push('NBB.data не создан (js/data/constants.js не выполнился)');
  else {
    if(!NBB.data.all) errors.push('NBB.data.all отсутствует');
    if(!NBB.data.SUBJECTS) errors.push('NBB.data.SUBJECTS отсутствует');
    if(!NBB.data.BOOKS_OT) errors.push('NBB.data.BOOKS_OT отсутствует');
    if(!NBB.data.BOOKS_BS) errors.push('NBB.data.BOOKS_BS отсутствует');
    if(!NBB.data.MODES_OT) errors.push('NBB.data.MODES_OT отсутствует');
    if(!NBB.data.MODES_BS) errors.push('NBB.data.MODES_BS отсутствует');
    if(!NBB.data.otQuestions) errors.push('NBB.data.otQuestions отсутствует (js/data/ot-questions.js)');
    if(!NBB.data.bsQuestions) errors.push('NBB.data.bsQuestions отсутствует (js/data/bs-questions.js)');
    if(!NBB.data.otMatch) errors.push('NBB.data.otMatch отсутствует (js/data/ot-match.js)');
    if(!NBB.data.bsMatch) errors.push('NBB.data.bsMatch отсутствует (js/data/bs-match.js)');
  }
  if(!NBB.state) errors.push('NBB.state не создан (js/state.js)');
  else if(!NBB.state.progress) errors.push('NBB.state.progress = null (js/progress.js не выполнил инициализацию)');
  if(!NBB.progress) errors.push('NBB.progress не создан (js/progress.js)');
  if(!NBB.ui) errors.push('NBB.ui не создан (js/ui.js)');
  else if(!NBB.ui.selectSubject) errors.push('NBB.ui.selectSubject отсутствует');
  if(!NBB.game) errors.push('NBB.game не создан (js/game.js)');
  else if(!NBB.game.start) errors.push('NBB.game.start отсутствует');

  // DOM
  const requiredIds = ['subjectSelect','intro','game','result','headerRight','booklist','mode','bookFilter','catButtons'];
  requiredIds.forEach(id => {
    if(!document.getElementById(id)) errors.push('DOM: #' + id + ' не найден в HTML');
  });

  return errors;
}

(function(){
  try {
    const errors = validateSetup();
    if(errors.length){
      console.error('[Тренажёр НББС] Ошибки инициализации:');
      errors.forEach(e => console.error(' •', e));
      NBB.ui.showFatalError('Проблемы при загрузке: ' + errors.join('; '));
      return;
    }

    console.log('[Тренажёр НББС] Все модули загружены. Вопросов ОВЗ:', NBB.data.otQuestions.length,
                '| ОИБ:', NBB.data.bsQuestions.length,
                '| Сопоставлений:', NBB.data.otMatch.length + NBB.data.bsMatch.length);

    const $ = id => document.getElementById(id);

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

    // ==== СТАРТ ====
    NBB.ui.renderSubjectStats();
    NBB.ui.updateHeader();
    console.log('[Тренажёр НББС] Инициализация успешна.');
  } catch(e){
    console.error('[Тренажёр НББС] Критическая ошибка:', e);
    if(NBB.ui && NBB.ui.showFatalError){
      NBB.ui.showFatalError('Критическая ошибка: ' + e.message);
    }
  }
})();