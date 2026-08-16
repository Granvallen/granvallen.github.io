(function () {
  'use strict';

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
    embed.searchParams.set('autoplay', '0');
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
    embed.searchParams.set('autoplay', '0');
    return { provider: 'youtube', url: embed.href, title: 'YouTube 视频' };
  }

  function isMobileBrowser() {
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
      return navigator.userAgentData.mobile;
    }
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function getNetEaseEmbed(url) {
    if (url.hostname.toLowerCase() !== 'music.163.com') return null;

    var path = url.pathname;
    var params = url.searchParams;
    if (url.hash.indexOf('#/') === 0) {
      var hashUrl = new URL(url.hash.slice(1), 'https://music.163.com');
      path = hashUrl.pathname;
      params = hashUrl.searchParams;
    }

    var type = path === '/song' ? '2' : path === '/playlist' ? '0' : params.get('type');
    var id = params.get('id');
    if ((type !== '0' && type !== '2') || !/^\d+$/.test(id || '')) return null;

    var playerPath = isMobileBrowser() ? '/m/outchain/player' : '/outchain/player';
    var embed = new URL('https://music.163.com' + playerPath);
    embed.searchParams.set('type', type);
    embed.searchParams.set('id', id);
    embed.searchParams.set('auto', '0');
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
    var wrapper = document.createElement('span');
    wrapper.className = 'media-embed media-embed--' + embed.provider;

    var iframe = document.createElement('iframe');
    iframe.src = embed.url;
    iframe.title = embed.title;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    wrapper.appendChild(iframe);
    return wrapper;
  }

  function isStandaloneLink(link) {
    var paragraph = link.parentElement;
    if (!paragraph || paragraph.tagName !== 'P') return false;
    var meaningfulNodes = Array.prototype.filter.call(paragraph.childNodes, function (node) {
      return node.nodeType !== Node.TEXT_NODE || node.textContent.trim() !== '';
    });
    return meaningfulNodes.length === 1 && meaningfulNodes[0] === link;
  }

  function renderLinks(links, standaloneOnly) {
    Array.prototype.forEach.call(links, function (link) {
      var standalone = isStandaloneLink(link);
      if (standaloneOnly && !standalone) return;
      var embed = parseEmbed(link.getAttribute('href'));
      if (!embed) return;
      var rendered = createEmbed(embed);
      if (standalone) {
        link.parentElement.replaceWith(rendered);
      } else {
        link.replaceWith(rendered);
      }
    });
  }

  renderLinks(document.querySelectorAll('.post-content a[href]'), false);

  var comments = document.querySelector('.moments-comments');
  if (!comments) return;

  function renderMoments() {
    renderLinks(comments.querySelectorAll(
      '.tk-comments-container > .tk-comment.tk-master > .tk-main > .tk-content a[href]'
    ), true);
  }

  renderMoments();
  new MutationObserver(renderMoments).observe(comments, {
    childList: true,
    subtree: true
  });
})();
