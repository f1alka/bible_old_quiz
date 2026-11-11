window.NBB = window.NBB || {};

window.addEventListener('error', function(e){
  if(e.target && e.target.tagName === 'SCRIPT'){
    const src = e.target.src || e.target.getAttribute('src') || '?';
    if(NBB.ui && NBB.ui.showFatalError) NBB.ui.showFatalError('Не загрузился файл: ' + src.split('/').pop());
  }
}, true);

(function(){
  try {
    const errors = [];
    if(!window.NBB) errors.push('window.NBB отсутствует');
    if(!NBB.data) errors.push('NBB.data отсутствует → js/data/constants.js');
    else {
      ['all','SUBJECTS','BOOKS_OT','BOOKS_BS','MODES_OT','MODES_BS'].forEach(k => {
        if(typeof NBB.data[k] === 'undefined') errors.push('NBB.data.' + k + ' отсутствует');
      });
    }
    if(!NBB.state) errors.push('NBB.state отсутствует');
    if(!NBB.progress) errors.push('NBB.progress отсутствует');
    if(!NBB.ui) errors.push('NBB.ui отсутствует');
    if(!NBB.game) errors.push('NBB.game отсутствует');
    
    ['subjectSelect','intro','game','result','headerRight','booklist','mode','bookFilter','catButtons','backToSubject','start','themeToggle','settingsBtn'].forEach(id => {
      if(!document.getElementById(id)) errors.push('DOM: #' + id + ' отсутствует');
    });

    if(errors.length){
      console.error('[Тренажёр НББС] Ошибки:', errors);
      if(NBB.ui && NBB.ui.showFatalError) NBB.ui.showFatalError(errors.join(' | '));
      return;
    }

    const $ = id => document.getElementById(id);

    // ==== ТЕМА ====
    NBB.ui.initTheme();
    $('themeToggle').addEventListener('click', () => {
       NBB.ui.cycleTheme();
       // Синхронизируем селект в настройках, если он открыт
       const sel = $('settingTheme');
       if(sel) sel.value = NBB.state.progress.settings.theme;
    });

    // ==== НАСТРОЙКИ ====
    $('settingsBtn').addEventListener('click', NBB.ui.openSettings);
    $('closeSettings').addEventListener('click', NBB.ui.closeSettings);
    $('settingsModal').addEventListener('click', (e) => {
       if(e.target === $('settingsModal')) NBB.ui.closeSettings();
    });

    $('settingTheme').addEventListener('change', (e) => {
       NBB.state.progress.settings.theme = e.target.value;
       NBB.progress.save();
       NBB.ui.applyTheme(e.target.value);
    });

    $('settingSound').addEventListener('change', (e) => {
       NBB.state.progress.settings.sound = e.target.checked;
       NBB.progress.save();
       if(e.target.checked) NBB.ui.playSound('correct'); // тестовый звук
    });

    $('settingVibration').addEventListener('change', (e) => {
       NBB.state.progress.settings.vibration = e.target.checked;
       NBB.progress.save();
       if(e.target.checked) NBB.ui.vibrate(30); // тестовая вибрация
    });

    $('settingShuffle').addEventListener('change', (e) => {
       NBB.state.progress.settings.shuffleAnswers = e.target.checked;
       NBB.progress.save();
    });

    // ==== ЭКСПОРТ / ИМПОРТ ====
    $('exportProgress').addEventListener('click', () => {
       const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(NBB.state.progress, null, 2));
       const dlAnchorElem = document.createElement('a');
       dlAnchorElem.setAttribute("href", dataStr);
       dlAnchorElem.setAttribute("download", "nbb-quiz-progress.json");
       dlAnchorElem.click();
    });

    $('importProgressBtn').addEventListener('click', () => $('importProgressFile').click());
    
    $('importProgressFile').addEventListener('change', (e) => {
       const file = e.target.files[0];
       if(!file) return;
       const reader = new FileReader();
       reader.onload = (event) => {
           try {
               const parsed = JSON.parse(event.target.result);
               if(parsed.ot && parsed.bs) {
                   NBB.state.progress = Object.assign(NBB.progress.load(), parsed);
                   NBB.progress.save();
                   NBB.ui.applyTheme(NBB.state.progress.settings.theme);
                   NBB.ui.renderProgressPanel();
                   alert('Прогресс успешно импортирован!');
                   NBB.ui.closeSettings();
               } else {
                   alert('Неверный формат файла');
               }
           } catch(err) {
               alert('Ошибка чтения файла: ' + err.message);
           }
       };
       reader.readAsText(file);
       e.target.value = '';
    });

    $('resetProgressModal').addEventListener('click', () => {
       if(confirm('ВНИМАНИЕ! Это удалит ВСЮ статистику по ОБОИМ предметам, все настройки и историю активности. Продолжить?')) {
           NBB.state.progress = NBB.progress.load(); // загрузит дефолтные значения
           localStorage.removeItem('nbbQuiz_v6');
           NBB.progress.save();
           NBB.ui.applyTheme('auto');
           NBB.ui.renderProgressPanel();
           NBB.ui.renderSubjectStats();
           alert('Полный сброс выполнен.');
           NBB.ui.closeSettings();
       }
    });

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
      if(NBB.state.index < NBB.state.round.length - 1){ NBB.state.index++; NBB.game.render(); }
      else { NBB.game.finish(); }
    });

    // ==== ИНИЦИАЛИЗАЦИЯ ====
    NBB.ui.renderSubjectStats();
    NBB.ui.updateHeader();

    // ==== SERVICE WORKER ====
    if('serviceWorker' in navigator){
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('[SW] зарегистрирован:', reg.scope))
          .catch(err => console.warn('[SW] ошибка:', err));
      });
    }

    console.log('[Тренажёр НББС] Инициализация успешна.');
  } catch(e){
    console.error('[Тренажёр НББС] КРИТИЧЕСКАЯ ОШИБКА:', e);
    if(NBB.ui && NBB.ui.showFatalError) NBB.ui.showFatalError('Критическая ошибка: ' + e.message);
  }
})();