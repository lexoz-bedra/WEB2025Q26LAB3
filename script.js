(function () {
  'use strict';

  var leadersModal = document.getElementById('leaders-modal');
  var gameOverOverlay = document.getElementById('game-over-overlay');
  var controlsMobile = document.getElementById('controls-mobile');
  var btnLeaders = document.getElementById('btn-leaders');
  var btnCloseLeaders = document.getElementById('btn-close-leaders');
  var btnUp = document.getElementById('btn-up');
  var btnDown = document.getElementById('btn-down');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');

  var DIRECTION = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' };

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
})();
