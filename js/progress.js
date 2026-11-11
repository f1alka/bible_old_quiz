window.NBB = window.NBB || {};
NBB.progress = {};

const STORAGE_KEY = "nbbQuiz_v6";

function emptySubjectProgress(){
  return { totalAnswered:0, totalCorrect:0, byBook:{}, byCategory:{}, rounds:[], streak:0, bestStreak:0 };
}
function defaultProgress(){
  return { ot: emptySubjectProgress(), bs: emptySubjectProgress() };
}

NBB.progress.empty = emptySubjectProgress;

NBB.progress.load = function(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultProgress();
    const saved = JSON.parse(raw);
    const p = defaultProgress();
    if(saved.ot) p.ot = Object.assign(emptySubjectProgress(), saved.ot);
    if(saved.bs) p.bs = Object.assign(emptySubjectProgress(), saved.bs);
    return p;
  }catch(e){ return defaultProgress(); }
};

NBB.progress.save = function(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(NBB.state.progress)); }catch(e){}
};

NBB.progress.recordAnswer = function(subject, book, category, isCorrect){
  const p = NBB.state.progress[subject];
  p.totalAnswered++;
  if(isCorrect) p.totalCorrect++;
  if(!p.byBook[book]) p.byBook[book] = {a:0,c:0};
  p.byBook[book].a++; if(isCorrect) p.byBook[book].c++;
  if(!p.byCategory[category]) p.byCategory[category] = {a:0,c:0};
  p.byCategory[category].a++; if(isCorrect) p.byCategory[category].c++;
  if(isCorrect){ p.streak++; if(p.streak>p.bestStreak) p.bestStreak=p.streak; }
  else p.streak = 0;
  NBB.progress.save();
};

NBB.progress.recordRound = function(subject, data){
  const p = NBB.state.progress[subject];
  p.rounds.unshift(data);
  if(p.rounds.length > 20) p.rounds.pop();
  NBB.progress.save();
};

// Инициализация при загрузке
NBB.state.progress = NBB.progress.load();