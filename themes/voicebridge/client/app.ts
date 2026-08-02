/** VoiceBridge 主题客户端：导航滚动变色 + 卡片入场动画。零依赖，编译为 public/app.js。 */
(function () {
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      (nav as HTMLElement).classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var cards = document.querySelectorAll<HTMLElement>('.card');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e, i) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.transitionDelay = (i % 2) * 0.08 + 's';
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    cards.forEach(function (c) {
      io.observe(c);
    });
  } else {
    cards.forEach(function (c) {
      c.classList.add('in');
    });
  }
})();
