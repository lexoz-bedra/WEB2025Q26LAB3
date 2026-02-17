(function () {
  'use strict';

  var leadersModal = document.getElementById('leaders-modal');
  var gameOverOverlay = document.getElementById('game-over-overlay');
  var controlsMobile = document.getElementById('controls-mobile');
  var gameGridEl = document.getElementById('game-grid');
  var scoreEl = document.getElementById('score');
  var btnLeaders = document.getElementById('btn-leaders');
  var btnCloseLeaders = document.getElementById('btn-close-leaders');
  var btnRestart = document.getElementById('btn-restart');
  var btnRestartOverlay = document.getElementById('btn-restart-overlay');
  var btnUp = document.getElementById('btn-up');
  var btnDown = document.getElementById('btn-down');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');

  var DIRECTION = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' };
  var SIZE = 4;

  var grid = [];
  var score = 0;
  var cellElements = [];

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

    if (gameOverOverlay) gameOverOverlay.hidden = true;
    updateControlsVisibility();
  }

  window.addEventListener('game:restart', startGame);

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

  startGame();
})();
