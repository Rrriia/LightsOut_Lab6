let levels = [
     "levels/level1.json",
     "levels/level2.json",
     "levels/level3.json"
   ];
   
   let currentLevel = "";       // Поточний рівень (щоб уникнути повторного завантаження)
   let gridData = [];           // Поточний стан ігрового поля
   let originalGridData = [];   // Початковий стан, який зберігається для можливості Restart
   let moves = 0;               // Лічильник ходів
   let lastClicked = null;      // Об’єкт для відстеження останнього клацання (координати та кількість послідовних кліків)
   let timerInterval = null;    // Ідентифікатор інтервалу таймера
   let startTime = null;        // Час старту гри
   
   // Отримання посилань на елементи DOM
   const boardElement = document.getElementById("game-board");
   const movesElement = document.getElementById("moves");
   const targetElement = document.getElementById("target");
   const timerElement = document.getElementById("timer");
   
   /**
    * Функція рендерингу поля за даними матриці.
    * Для кожного значення в матриці створюється елемент <div> з класом .cell.
    * Якщо значення 1 (вімкнено), додається клас .on, що змінює колір.
    */
   function renderBoard(grid) {
     boardElement.innerHTML = "";
     grid.forEach((row, i) => {
       row.forEach((cell, j) => {
         let cellDiv = document.createElement("div");
         cellDiv.classList.add("cell");
         cellDiv.dataset.row = i;
         cellDiv.dataset.col = j;
         if (cell === 1) {
           cellDiv.classList.add("on");
         }
         // Прив’язка обробника події кліку для кожної клітинки
         cellDiv.addEventListener("click", cellClickHandler);
         boardElement.appendChild(cellDiv);
       });
     });
   }
   
   /**
    * Функція для перемикання стану клітинки за заданими індексами i, j.
    * Якщо клітинка увімкнена (1) – вимикаємо, і навпаки.
    */
   function toggleCell(i, j, grid) {
     if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
       grid[i][j] = grid[i][j] === 1 ? 0 : 1;
     }
   }
   
   /**
    * Обробник кліку по клітинці.
    * Реалізовано логіку:
    * - Якщо користувач натискає ту ж саму клітинку, що і попередньо, збільшуємо лічильник послідовних кліків.
    *   При парному значенні цей клік "скасовує" попередній (віднімає хід, але не опускаючи нижче 0).
    *   При непарному – додається звичайний хід.
    * - Якщо клітинка змінюється, зберігаємо нові координати і скидаємо лічильник послідовних кліків.
    * - Після цього перемикаємо стан самої клітинки та її сусідів (зверху, знизу, зліва, справа),
    *   оновлюємо розмітку та змінюємо лічильник ходів.
    */
   function cellClickHandler(event) {
     let cellDiv = event.currentTarget;
     let i = parseInt(cellDiv.dataset.row);
     let j = parseInt(cellDiv.dataset.col);
   
     if (lastClicked && lastClicked.row === i && lastClicked.col === j) {
       lastClicked.count++;
       if (lastClicked.count % 2 === 0) {
         // При кожному парному натисканні повертаємо бал назад,
         // але гарантуємо, що значення moves не опуститься нижче 0.
         moves = Math.max(0, moves - 1);
       } else {
         moves++;
       }
     } else {
       // Якщо натиснута нова клітинка - оновлюємо lastClicked і додаємо звичайний хід.
       lastClicked = { row: i, col: j, count: 1 };
       moves++;
     }
   
     // Перемикаємо стан вибраної клітинки та її сусідів.
     toggleCell(i, j, gridData);
     toggleCell(i - 1, j, gridData); // Верхня клітинка
     toggleCell(i + 1, j, gridData); // Нижня клітинка
     toggleCell(i, j - 1, gridData); // Ліва клітинка
     toggleCell(i, j + 1, gridData); // Права клітинка
   
     renderBoard(gridData);
     movesElement.textContent = "Moves: " + moves;
   }
   
   /**
    * Запуск таймера гри.
    * За допомогою функції setInterval кожну секунду оновлюємо елемент, який показує скільки часу пройшло.
    */
   function startTimer() {
     clearInterval(timerInterval);
     startTime = Date.now();
     timerInterval = setInterval(() => {
       let seconds = Math.floor((Date.now() - startTime) / 1000);
       timerElement.textContent = "Time: " + seconds + " s";
     }, 1000);
   }
   
   /**
    * Завантаження рівня із JSON-файлу за допомогою методу fetch (асинхронний AJAX-запит).
    * JSON-файли мають містити об'єкт з властивостями:
    *   grid – матриця 5×5 із значеннями 0 (чорні, вимкнені) або 1 (жовті, увімкнені)
    *   target – мінімальна кількість ходів для вирішення задачі.
    */
   function loadLevel(levelUrl) {
     fetch(levelUrl)
       .then(response => {
         if (!response.ok) {
           throw new Error("HTTP error " + response.status);
         }
         return response.json();
       })
       .then(data => {
         // Глибоке копіювання для збереження початкового стану (для можливості Restart)
         gridData = JSON.parse(JSON.stringify(data.grid));
         originalGridData = JSON.parse(JSON.stringify(data.grid));
         targetElement.textContent = "Target: " + data.target + " moves";
         moves = 0;
         movesElement.textContent = "Moves: " + moves;
         lastClicked = null;
         renderBoard(gridData);
         startTimer();
         currentLevel = levelUrl;
       })
       .catch(error => {
         console.error("Помилка завантаження рівня:", error);
       });
   }
   
   /**
    * Функція для вибору нового рівня, що відрізняється від поточного.
    * Випадковим чином обирається рівень із масиву levels таким чином,
    * щоб не повторювати останній завантажений рівень підряд.
    */
   function getNextLevelUrl() {
     let available = levels.filter(url => url !== currentLevel);
     let randomIndex = Math.floor(Math.random() * available.length);
     return available[randomIndex];
   }
   
   // Обробники подій для кнопок "New Game" і "Restart".
   // Кнопка "New Game" завантажує новий рівень (ще один із JSON-файлів),
   // а "Restart" повертає поле до початкового стану завантаженого рівня без перезавантаження сторінки.
   document.getElementById("new-game").addEventListener("click", () => {
     let levelUrl = getNextLevelUrl();
     loadLevel(levelUrl);
   });
   
   document.getElementById("restart").addEventListener("click", () => {
     gridData = JSON.parse(JSON.stringify(originalGridData));
     moves = 0;
     movesElement.textContent = "Moves: " + moves;
     lastClicked = null;
     renderBoard(gridData);
     startTimer();
   });
   
   // Завантаження початкового рівня при старті сторінки.
   loadLevel(levels[0]);