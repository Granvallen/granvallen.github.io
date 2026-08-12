(function () {
  'use strict';

  var comments = document.getElementById('tcomment');
  if (!comments) return;

  function updateComposerVisibility() {
    // Twikoo 非腾讯云环境在管理员登录后保存此令牌，退出时会移除。
    var isAdmin = Boolean(localStorage.getItem('twikoo-access-token'));
    comments.classList.toggle('moments-locked', !isAdmin);
  }

  updateComposerVisibility();
  window.addEventListener('storage', updateComposerVisibility);

  // 登录和退出发生在 Twikoo 弹窗内，同页 localStorage 变化不会触发 storage 事件。
  window.setInterval(updateComposerVisibility, 1000);
})();
