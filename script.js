(function () {
  'use strict';

  var leadersModal = document.getElementById('leaders-modal');
  var btnLeaders = document.getElementById('btn-leaders');
  var btnCloseLeaders = document.getElementById('btn-close-leaders');

  if (btnLeaders && leadersModal) {
    btnLeaders.addEventListener('click', function () {
      leadersModal.hidden = false;
    });
  }

  if (btnCloseLeaders && leadersModal) {
    btnCloseLeaders.addEventListener('click', function () {
      leadersModal.hidden = true;
    });
  }

  if (leadersModal) {
    leadersModal.addEventListener('click', function (e) {
      if (e.target === leadersModal) {
        leadersModal.hidden = true;
      }
    });
  }
})();
