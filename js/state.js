window.NBB = window.NBB || {};

NBB.state = {
  currentSubject: null,      // 'ot' | 'bs' | null
  selectedBooks: new Set(),
  progress: null,            // заполнится из progress.js
  round: [],
  index: 0,
  correct: 0,
  answered: false,
  mistakes: [],
  roundMode: "",
  matchState: null
};