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

  function getBilibiliEmbed(url) {
    var host = url.hostname.toLowerCase();
    var bvid = '';

    if (host === 'player.bilibili.com' && url.pathname === '/player.html') {
      bvid = url.searchParams.get('bvid') || '';
    } else if (host === 'www.bilibili.com' || host === 'bilibili.com') {
      var match = url.pathname.match(/^\/video\/(BV[0-9A-Za-z]+)/i);
      bvid = match ? match[1] : '';
    }

    if (!/^BV[0-9A-Za-z]+$/i.test(bvid)) return null;

    var embed = new URL('https://player.bilibili.com/player.html');
    embed.searchParams.set('bvid', bvid);

    var page = url.searchParams.get('page') || url.searchParams.get('p');
    if (/^\d+$/.test(page || '')) embed.searchParams.set('page', page);
    if (url.searchParams.get('autoplay') === '1') embed.searchParams.set('autoplay', '1');

    return { provider: 'bilibili', url: embed.href, title: 'Bilibili 视频' };
  }

  function getYouTubeEmbed(url) {
    var host = url.hostname.toLowerCase();
    var videoId = '';

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/')[1] || '';
    } else if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'www.youtube-nocookie.com'
    ) {
      var match = url.pathname.match(/^\/(?:embed|shorts)\/([0-9A-Za-z_-]{11})/);
      videoId = match ? match[1] : (url.searchParams.get('v') || '');
    }

    if (!/^[0-9A-Za-z_-]{11}$/.test(videoId)) return null;

    var embed = new URL('https://www.youtube-nocookie.com/embed/' + videoId);
    var start = url.searchParams.get('start') || url.searchParams.get('t');
    if (/^\d+$/.test(start || '')) embed.searchParams.set('start', start);
    if (url.searchParams.get('autoplay') === '1') embed.searchParams.set('autoplay', '1');

    return { provider: 'youtube', url: embed.href, title: 'YouTube 视频' };
  }

  function getNetEaseEmbed(url) {
    if (url.hostname.toLowerCase() !== 'music.163.com' || url.pathname !== '/outchain/player') {
      return null;
    }

    var type = url.searchParams.get('type');
    var id = url.searchParams.get('id');
    if ((type !== '0' && type !== '2') || !/^\d+$/.test(id || '')) return null;

    var embed = new URL('https://music.163.com/outchain/player');
    embed.searchParams.set('type', type);
    embed.searchParams.set('id', id);
    embed.searchParams.set('auto', url.searchParams.get('auto') === '1' ? '1' : '0');
    embed.searchParams.set('height', '66');

    return { provider: 'netease', url: embed.href, title: '网易云音乐' };
  }

  function parseEmbed(href) {
    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (_) {
      return null;
    }

    if (url.protocol !== 'https:') return null;
    return getBilibiliEmbed(url) || getYouTubeEmbed(url) || getNetEaseEmbed(url);
  }

  function createEmbed(embed) {
    var wrapper = document.createElement('div');
    wrapper.className = 'moments-embed moments-embed--' + embed.provider;

    var iframe = document.createElement('iframe');
    iframe.src = embed.url;
    iframe.title = embed.title;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    wrapper.appendChild(iframe);

    return wrapper;
  }

  function renderEmbeds() {
    // 只转换博主发布的顶层动态；回复中的标记保持普通链接。
    var links = comments.querySelectorAll(
      '.tk-comments-container > .tk-comment.tk-master > .tk-main > .tk-content a'
    );

    Array.prototype.forEach.call(links, function (link) {
      var marker = link.textContent.trim().toLowerCase();
      if (marker !== 'embed' && marker !== 'iframe' && marker !== '嵌入') return;

      var embed = parseEmbed(link.getAttribute('href'));
      if (!embed) return;

      var paragraph = link.parentElement;
      var target = paragraph &&
        paragraph.tagName === 'P' &&
        paragraph.children.length === 1 &&
        paragraph.textContent.trim().toLowerCase() === marker
        ? paragraph
        : link;
      target.replaceWith(createEmbed(embed));
    });
  }

  function refreshMoments() {
    updateComposerVisibility();
    renderEmbeds();
  }

  refreshMoments();
  new MutationObserver(refreshMoments).observe(comments, {
    childList: true,
    subtree: true
  });
})();
