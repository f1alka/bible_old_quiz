window.NBB = window.NBB || {};
window.NBB.data = window.NBB.data || {};

// Защита от отсутствующих файлов данных
if (!NBB.data.otQuestions) { console.warn('ot-questions.js не загружен'); NBB.data.otQuestions = []; }
if (!NBB.data.otMatch)     { console.warn('ot-match.js не загружен');     NBB.data.otMatch = []; }
if (!NBB.data.bsQuestions) { console.warn('bs-questions.js не загружен'); NBB.data.bsQuestions = []; }
if (!NBB.data.bsMatch)     { console.warn('bs-match.js не загружен');     NBB.data.bsMatch = []; }

// ТЕГИ
var i;
for (i = 0; i < NBB.data.otQuestions.length; i++) {
  NBB.data.otQuestions[i].subject = 'ot';
  NBB.data.otQuestions[i].type = 'single';
}
for (i = 0; i < NBB.data.otMatch.length; i++) {
  NBB.data.otMatch[i].subject = 'ot';
  NBB.data.otMatch[i].type = 'match';
}
for (i = 0; i < NBB.data.bsQuestions.length; i++) {
  NBB.data.bsQuestions[i].subject = 'bs';
  NBB.data.bsQuestions[i].type = 'single';
}
for (i = 0; i < NBB.data.bsMatch.length; i++) {
  NBB.data.bsMatch[i].subject = 'bs';
  NBB.data.bsMatch[i].type = 'match';
}

// ОБЩИЙ БАНК
NBB.data.all = []
  .concat(NBB.data.otQuestions)
  .concat(NBB.data.otMatch)
  .concat(NBB.data.bsQuestions)
  .concat(NBB.data.bsMatch);

// ПРЕДМЕТЫ
NBB.data.SUBJECTS = {
  ot: {
    name: "Обзор Ветхого Завета",
    sub: "Проверь, насколько хорошо ты запомнил авторов, цели, главные темы, структуры и особенности книг.",
    notice: "Источник — презентация «Обзор Ветхого Завета» и «Тестики на пятёрочку».",
    filterLabel: "📚 Выбрать книги (работает во всех режимах)",
    listTitle: "Все 39 книг Ветхого Завета",
    listSub: "Прогресс по книге показан справа."
  },
  bs: {
    name: "Основы изучения Библии",
    sub: "Герменевтика, экзегетика, принципы толкования, ошибки, наблюдение, применение.",
    notice: "Источник — конспект курса «Основы изучения Библии» (НББС).",
    filterLabel: "📖 Выбрать главы (работает во всех режимах)",
    listTitle: "Все 10 глав курса",
    listSub: "Прогресс по каждой главе показан справа."
  }
};

// РЕЖИМЫ
NBB.data.MODES_OT = [
  {v:"all", l:"Все темы вперемешку"},
  {v:"match", l:"🔗 Сопоставление"},
  {v:"author", l:"Автор и дата"},
  {v:"goal", l:"Цели книг"},
  {v:"theme", l:"Главные темы"},
  {v:"structure", l:"Структура и жанр"},
  {v:"hard", l:"🔥 Сложные"},
  {v:"mixed", l:"Экзамен — 20 вопросов"}
];

NBB.data.MODES_BS = [
  {v:"all", l:"Все темы вперемешку"},
  {v:"match", l:"🔗 Сопоставление"},
  {v:"definition", l:"Определения"},
  {v:"example", l:"Примеры и иллюстрации"},
  {v:"theme", l:"Темы и содержание"},
  {v:"keyverse", l:"Ключевые стихи"},
  {v:"hard", l:"🔥 Сложные"},
  {v:"mixed", l:"Экзамен — 20 вопросов"}
];

// КНИГИ / ГЛАВЫ
NBB.data.BOOKS_OT = [
  "Бытие","Исход","Левит","Числа","Второзаконие",
  "Иисус Навин","Судьи","Руфь",
  "1 Царств","2 Царств","3 Царств","4 Царств",
  "1 Паралипоменон","2 Паралипоменон",
  "Ездра","Неемия","Есфирь",
  "Иов","Псалтирь","Притчи","Екклесиаст","Песнь песней",
  "Исаия","Иеремия","Плач Иеремии","Иезекииль","Даниил",
  "Осия","Иоиль","Амос","Авдий","Иона","Михей","Наум","Аввакум","Софония","Аггей","Захария","Малахия"
];

NBB.data.BOOKS_BS = [
  "Глава 1","Глава 2","Глава 3","Глава 4","Глава 5",
  "Глава 6","Глава 7","Глава 8","Глава 9","Глава 10"
];

// КАТЕГОРИИ
NBB.data.CATEGORIES_OT = {
  "Пятикнижие": ["Бытие","Исход","Левит","Числа","Второзаконие"],
  "Исторические": ["Иисус Навин","Судьи","Руфь","1 Царств","2 Царств","3 Царств","4 Царств","1 Паралипоменон","2 Паралипоменон","Ездра","Неемия","Есфирь"],
  "Поэтические": ["Иов","Псалтирь","Притчи","Екклесиаст","Песнь песней"],
  "Большие пророки": ["Исаия","Иеремия","Плач Иеремии","Иезекииль","Даниил"],
  "Малые пророки": ["Осия","Иоиль","Амос","Авдий","Иона","Михей","Наум","Аввакум","Софония","Аггей","Захария","Малахия"]
};

NBB.data.CATEGORIES_BS = {
  "Гл. 1–2 · Введение": ["Глава 1","Глава 2"],
  "Гл. 3 · Ошибки": ["Глава 3"],
  "Гл. 4–5 · Метод": ["Глава 4","Глава 5"],
  "Гл. 6–7 · Барьеры": ["Глава 6","Глава 7"],
  "Гл. 8–10 · Практика": ["Глава 8","Глава 9","Глава 10"]
};

NBB.data.LETTERS = ["А","Б","В","Г"];

console.log('[constants] УСПЕХ. ОВЗ:', NBB.data.otQuestions.length,
            '| ОИБ:', NBB.data.bsQuestions.length,
            '| матчей:', NBB.data.otMatch.length + NBB.data.bsMatch.length);