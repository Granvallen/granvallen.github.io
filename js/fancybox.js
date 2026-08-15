$(document).ready(function() {
  $('.post-content img').each(function() {
    if ($(this).parent().hasClass('fancybox')) return;
    if ($(this).hasClass('nofancybox')) return;
    var alt = this.alt;
    if (alt) $(this).after('<span class="caption">' + alt + '</span>');
    $(this).wrap('<a href="' + ($(this).attr('data-src') == null ? this.src : $(this).attr('data-src')) + '" class="fancybox"></a>');
  });

  $('.post-content a.fancybox').each(function() {
    var image = $(this).find('img').first();
    $(this).attr('data-fancybox', 'article');
    if (image.attr('alt')) $(this).attr('data-caption', image.attr('alt'));
  });
});
