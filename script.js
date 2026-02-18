(function () {
  'use strict';

  var leadersModal = document.getElementById('leaders-modal');
  var gameOverOverlay = document.getElementById('game-over-overlay');
  var controlsMobile = document.getElementById('controls-mobile');
  var gameGridEl = document.getElementById('game-grid');
  var scoreEl = document.getElementById('score');
  var btnLeaders = document.getElementById('btn-leaders');
  var btnCloseLeaders = document.getElementById('btn-close-leaders');
  var btnUndo = document.getElementById('btn-undo');
  var btnRestart = document.getElementById('btn-restart');
  var btnRestartOverlay = document.getElementById('btn-restart-overlay');
  var btnSaveResult = document.getElementById('btn-save-result');
  var playerNameInput = document.getElementById('player-name');
  var gameOverSave = document.getElementById('game-over-save');
  var gameOverSaved = document.getElementById('game-over-saved');
  var leadersTbody = document.getElementById('leaders-tbody');
  var btnUp = document.getElementById('btn-up');
  var btnDown = document.getElementById('btn-down');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');

  var DIRECTION = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' };
  var SIZE = 4;

  var grid = [];
  var score = 0;
  var cellElements = [];
  var undoState = null;

  var STORAGE_KEY_GAME = '2048-game';
  var STORAGE_KEY_LEADERS = '2048-leaders';

  function saveGameState() {
    try {
      var payload = {
        grid: grid.slice(),
        score: score,
        gameOver: gameOverOverlay && !gameOverOverlay.hidden
      };
      localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify(payload));
    } catch (e) {}
  }

  function loadGameState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_GAME);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data.grid || data.grid.length !== SIZE * SIZE) return false;
      grid = data.grid.slice();
      score = data.score || 0;
      if (gameOverOverlay && data.gameOver) {
        gameOverOverlay.hidden = false;
      } else if (gameOverOverlay) {
        gameOverOverlay.hidden = true;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function getLeaders() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_LEADERS);
      if (!raw) return [];
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeaders(list) {
    try {
      list.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
      var top = list.slice(0, 10);
      localStorage.setItem(STORAGE_KEY_LEADERS, JSON.stringify(top));
    } catch (e) {}
  }

  function addLeader(name, scoreValue) {
    var list = getLeaders();
    list.push({
      name: String(name).trim() || 'Игрок',
      score: scoreValue,
      date: new Date().toLocaleString('ru-RU')
    });
    saveLeaders(list);
  }

  function renderLeadersTable() {
    if (!leadersTbody) return;
    var list = getLeaders();
    leadersTbody.innerHTML = '';
    if (list.length === 0) {
      var tr = document.createElement('tr');
      tr.className = 'empty-row';
      tr.innerHTML = '<td colspan="3">Пока нет рекордов</td>';
      leadersTbody.appendChild(tr);
      return;
    }
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + escapeHtml(row.name) + '</td><td>' + row.score + '</td><td>' + escapeHtml(row.date) + '</td>';
      leadersTbody.appendChild(tr);
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function isMobile() {
    return window.matchMedia('(max-width: 480px)').matches;
  }

  function updateControlsVisibility() {
    if (!controlsMobile) return;
    var modalOpen = leadersModal && !leadersModal.hidden;
    var gameOverVisible = gameOverOverlay && !gameOverOverlay.hidden;
    controlsMobile.hidden = !isMobile() || modalOpen || gameOverVisible;
  }

  function dispatchMove(direction) {
    window.dispatchEvent(new CustomEvent('game:move', { detail: { direction: direction } }));
  }

  // --- сетка ---
  function buildGrid() {
    if (!gameGridEl) return;
    gameGridEl.innerHTML = '';
    cellElements = [];
    for (var i = 0; i < SIZE * SIZE; i++) {
      var cell = document.createElement('div');
      cell.className = 'tile-cell';
      cell.setAttribute('data-index', i);
      gameGridEl.appendChild(cell);
      cellElements.push(cell);
    }
  }

  function getEmptyIndices() {
    var indices = [];
    for (var i = 0; i < grid.length; i++) {
      if (grid[i] === 0) indices.push(i);
    }
    return indices;
  }

  function randomInt(max) {
    return Math.floor(Math.random() * (max + 1));
  }

  function spawnTile() {
    var empty = getEmptyIndices();
    if (empty.length === 0) return false;
    var index = empty[randomInt(empty.length - 1)];
    grid[index] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  function render() {
    for (var i = 0; i < cellElements.length; i++) {
      var cell = cellElements[i];
      var value = grid[i];
      cell.innerHTML = '';
      if (value > 0) {
        var tile = document.createElement('div');
        tile.className = 'tile tile-' + value;
        tile.textContent = value;
        cell.appendChild(tile);
      }
    }
  }

  function updateScoreDisplay() {
    if (scoreEl) scoreEl.textContent = score;
  }

  function getRow(row) {
    var r = [];
    for (var c = 0; c < SIZE; c++) r.push(grid[row * SIZE + c]);
    return r;
  }

  function setRow(row, values) {
    for (var c = 0; c < SIZE; c++) grid[row * SIZE + c] = values[c];
  }

  function getCol(col) {
    var r = [];
    for (var rn = 0; rn < SIZE; rn++) r.push(grid[rn * SIZE + col]);
    return r;
  }

  function setCol(col, values) {
    for (var rn = 0; rn < SIZE; rn++) grid[rn * SIZE + col] = values[rn];
  }

  function slideAndMergeLine(line) {
    var arr = line.slice();
    var totalScore = 0;
    for (;;) {
      var compact = [];
      for (var i = 0; i < SIZE; i++) if (arr[i] > 0) compact.push(arr[i]);
      while (compact.length < SIZE) compact.push(0);
      var merged = false;
      for (var i = 0; i < SIZE - 1; i++) {
        if (compact[i] > 0 && compact[i] === compact[i + 1]) {
          compact[i] *= 2;
          totalScore += compact[i];
          compact[i + 1] = 0;
          merged = true;
          i++;
        }
      }
      var next = [];
      for (var i = 0; i < SIZE; i++) if (compact[i] > 0) next.push(compact[i]);
      while (next.length < SIZE) next.push(0);
      arr = next;
      if (!merged) break;
    }
    return { line: arr, score: totalScore };
  }

  function move(direction) {
    if (gameOverOverlay && !gameOverOverlay.hidden) return;
    var prevUndo = undoState;
    undoState = { grid: grid.slice(), score: score };
    var before = grid.slice();
    var addScore = 0;

    if (direction === DIRECTION.LEFT || direction === DIRECTION.RIGHT) {
      for (var row = 0; row < SIZE; row++) {
        var arr = getRow(row);
        if (direction === DIRECTION.RIGHT) arr.reverse();
        var result = slideAndMergeLine(arr);
        if (direction === DIRECTION.RIGHT) result.line.reverse();
        setRow(row, result.line);
        addScore += result.score;
      }
    } else {
      for (var col = 0; col < SIZE; col++) {
        var arr = getCol(col);
        if (direction === DIRECTION.DOWN) arr.reverse();
        var result = slideAndMergeLine(arr);
        if (direction === DIRECTION.DOWN) result.line.reverse();
        setCol(col, result.line);
        addScore += result.score;
      }
    }

    var changed = false;
    for (var i = 0; i < grid.length; i++) {
      if (grid[i] !== before[i]) { changed = true; break; }
    }
    score += addScore;

    if (changed) {
      var spawnCount = randomInt(1) + 1;
      for (var k = 0; k < spawnCount; k++) spawnTile();
    } else {
      undoState = prevUndo;
    }

    render();
    updateScoreDisplay();

    if (!hasPossibleMoves()) {
      undoState = null;
      if (gameOverOverlay) gameOverOverlay.hidden = false;
      updateControlsVisibility();
    }
    updateUndoButton();
    saveGameState();
  }

  function undo() {
    if (!undoState || (gameOverOverlay && !gameOverOverlay.hidden)) return;
    grid = undoState.grid.slice();
    score = undoState.score;
    undoState = null;
    render();
    updateScoreDisplay();
    updateUndoButton();
    saveGameState();
  }

  function updateUndoButton() {
    if (btnUndo) {
      btnUndo.disabled = !undoState;
    }
  }

  function hasPossibleMoves() {
    if (getEmptyIndices().length > 0) return true;
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE - 1; c++) {
        var i = r * SIZE + c;
        if (grid[i] === grid[i + 1]) return true;
      }
    }
    for (var c = 0; c < SIZE; c++) {
      for (var r = 0; r < SIZE - 1; r++) {
        var i = r * SIZE + c;
        if (grid[i] === grid[i + SIZE]) return true;
      }
    }
    return false;
  }

  window.addEventListener('game:move', function (e) {
    if (e.detail && e.detail.direction) move(e.detail.direction);
  });

  function startGame() {
    grid = new Array(SIZE * SIZE);
    for (var i = 0; i < grid.length; i++) grid[i] = 0;
    score = 0;

    if (cellElements.length !== SIZE * SIZE) {
      buildGrid();
    }

    var count = randomInt(2) + 1;
    for (var k = 0; k < count; k++) spawnTile();
    render();
    updateScoreDisplay();

    undoState = null;
    if (gameOverOverlay) gameOverOverlay.hidden = true;
    if (gameOverSave) gameOverSave.hidden = false;
    if (gameOverSaved) gameOverSaved.hidden = true;
    if (playerNameInput) playerNameInput.value = '';
    updateControlsVisibility();
    updateUndoButton();
    saveGameState();
  }

  window.addEventListener('game:restart', startGame);

  if (btnSaveResult && playerNameInput) {
    btnSaveResult.addEventListener('click', function () {
      addLeader(playerNameInput.value, score);
      if (gameOverSave) gameOverSave.hidden = true;
      if (gameOverSaved) gameOverSaved.hidden = false;
      saveGameState();
    });
  }

  if (btnUndo) {
    btnUndo.addEventListener('click', undo);
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', function () {
      window.dispatchEvent(new CustomEvent('game:restart'));
    });
  }
  if (btnRestartOverlay) {
    btnRestartOverlay.addEventListener('click', function () {
      window.dispatchEvent(new CustomEvent('game:restart'));
    });
  }

  // --- управление для компьютера (с клавиатуры) ---
  document.addEventListener('keydown', function (e) {
    var keyToDirection = {
      ArrowUp: DIRECTION.UP,
      ArrowDown: DIRECTION.DOWN,
      ArrowLeft: DIRECTION.LEFT,
      ArrowRight: DIRECTION.RIGHT
    };
    var direction = keyToDirection[e.key];
    if (direction) {
      e.preventDefault();
      dispatchMove(direction);
    }
  });

  // --- управление для телефона (кнопки) ---
  if (btnUp) btnUp.addEventListener('click', function () { dispatchMove(DIRECTION.UP); });
  if (btnDown) btnDown.addEventListener('click', function () { dispatchMove(DIRECTION.DOWN); });
  if (btnLeft) btnLeft.addEventListener('click', function () { dispatchMove(DIRECTION.LEFT); });
  if (btnRight) btnRight.addEventListener('click', function () { dispatchMove(DIRECTION.RIGHT); });

  if (leadersModal) {
    leadersModal.addEventListener('click', function (e) {
      if (e.target === leadersModal) {
        leadersModal.hidden = true;
        updateControlsVisibility();
      }
    });
  }

  if (btnLeaders && leadersModal) {
    btnLeaders.addEventListener('click', function () {
      renderLeadersTable();
      leadersModal.hidden = false;
      updateControlsVisibility();
    });
  }

  if (btnCloseLeaders && leadersModal) {
    btnCloseLeaders.addEventListener('click', function () {
      leadersModal.hidden = true;
      updateControlsVisibility();
    });
  }

  window.addEventListener('resize', updateControlsVisibility);
  updateControlsVisibility();

  if (cellElements.length !== SIZE * SIZE) buildGrid();
  if (loadGameState()) {
    render();
    updateScoreDisplay();
    updateUndoButton();
  } else {
    startGame();
  }
})();
