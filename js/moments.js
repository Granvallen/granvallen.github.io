(function () {
  'use strict';

  // Twikoo 会替换 #tcomment 本身，因此登录状态类必须放在外层容器上。
  var comments = document.querySelector('.moments-comments');
  if (!comments) return;

  function updateComposerVisibility() {
    // 以 Twikoo 实际渲染出的管理面板为准，避免残留或过期令牌误判登录。
    var isAdmin = Boolean(comments.querySelector('.tk-panel-logout'));
    comments.classList.toggle('moments-locked', !isAdmin);
  }

  updateComposerVisibility();
  new MutationObserver(updateComposerVisibility).observe(comments, {
    childList: true,
    subtree: true
  });
})();
