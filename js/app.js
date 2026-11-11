window.NBB = window.NBB || {};

(function(){
  const $ = id => document.getElementById(id);

  // ==== ВЫБОР ПРЕДМЕТА ====
  document.querySelectorAll('.subject-card').forEach(btn => {
    btn.addEventListener('click', () => NBB.ui.selectSubject(btn.dataset.subject));
  });

  // ==== НАВИГАЦИЯ ====
  $('backToSubject').addEventListener('click', NBB.ui.backToSubject);
  $('home').addEventListener('click', () => {
    $('result').classList.add('hidden');
    $('intro').classList.remove('hidden');
    window.scrollTo({top:0, behavior:'smooth'});
  });

  // ==== ФИЛЬТР КНИГ ====
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
})();