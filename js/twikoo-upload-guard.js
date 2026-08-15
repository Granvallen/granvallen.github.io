(function () {
  'use strict';

  // 这只是前端入口限制，不是后端上传权限校验。
  var comments = document.querySelector('.twikoo-comments');
  if (!comments) return;

  var envId = comments.getAttribute('data-twikoo-env');
  var isAdmin = false;
  var refreshTimer = null;
  var requestNumber = 0;

  function updateImageButton() {
    comments.classList.toggle('twikoo-image-admin', isAdmin);

    // 兼容不支持 CSS :has() 的浏览器。
    var imageInputs = comments.querySelectorAll('.tk-input-image');
    Array.prototype.forEach.call(imageInputs, function (input) {
      var button = input.previousElementSibling;
      if (!button || !button.classList.contains('tk-submit-action-icon')) return;
      button.style.display = isAdmin ? '' : 'none';
    });
  }

  function setAdmin(value) {
    isAdmin = Boolean(value);
    updateImageButton();
  }

  function getAccessToken() {
    try {
      return localStorage.getItem('twikoo-access-token') || '';
    } catch (error) {
      return '';
    }
  }

  function refreshAdminStatus() {
    if (!envId || !/^https?:\/\//i.test(envId)) {
      setAdmin(Boolean(comments.querySelector('.tk-panel-logout')));
      return;
    }

    var currentRequest = ++requestNumber;
    fetch(envId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'GET_CONFIG',
        accessToken: getAccessToken()
      })
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Twikoo config request failed');
        return response.json();
      })
      .then(function (result) {
        if (currentRequest !== requestNumber) return;
        setAdmin(Boolean(result && result.config && result.config.IS_ADMIN));
      })
      .catch(function () {
        if (currentRequest !== requestNumber) return;
        setAdmin(false);
      });
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshAdminStatus, 300);
  }

  updateImageButton();
  refreshAdminStatus();

  new MutationObserver(function () {
    updateImageButton();
    scheduleRefresh();
  }).observe(comments, {
    childList: true,
    subtree: true
  });

  window.addEventListener('storage', scheduleRefresh);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refreshAdminStatus();
  });
})();
