

window.NBB = window.NBB || {};

NBB.state = {
  currentSubject: null,
  selectedBooks: new Set(),
  progress: null,
  round: [],
  index: 0,
  correct: 0,
  answered: false,
  mistakes: [],
  roundMode: "",
  matchState: null,
  questionStartTime: 0
};