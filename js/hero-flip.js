/* Meridian6 — hero flip card: "See sample" turns the hero over to a before/after
   report card. The two previews drift slowly through the full pages while the
   back is showing; hovering (or scrolling/swiping) hands control to the visitor. */
(function(){
  var wrap = document.getElementById('hero-flip');
  if(!wrap) return;
  var front = document.getElementById('flip-front'),
      back  = document.getElementById('flip-back'),
      open  = document.getElementById('flip-open'),
      close = document.getElementById('flip-close'),
      title = document.getElementById('fb-title'),
      cta   = document.getElementById('fb-cta');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function set(on){
    wrap.classList.toggle('flipped', on);
    open.setAttribute('aria-expanded', on ? 'true' : 'false');
    if(on){ back.removeAttribute('inert'); front.setAttribute('inert',''); setTimeout(function(){ title.focus({preventScroll:true}); }, 60); }
    else  { front.removeAttribute('inert'); back.setAttribute('inert',''); setTimeout(function(){ open.focus({preventScroll:true}); }, 60); }
    if(on && typeof gtag === 'function') gtag('event', 'hero_sample_open');
    // phones: the trigger sits at the bottom of the card, so bring the card's top into view
    if(window.innerWidth <= 900){
      var top = wrap.getBoundingClientRect().top;
      if(top < 60 || top > window.innerHeight * 0.4) wrap.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }
  // The before/after screenshots (~265 KB) load only when a visitor reaches for "See sample":
  // hover/touch starts the download early, the tap guarantees it.
  var shotsLoaded = false;
  function loadShots(){
    if(shotsLoaded) return; shotsLoaded = true;
    [].forEach.call(back.querySelectorAll('img[data-src]'), function(img){ img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); });
  }
  ['pointerenter','touchstart','focus'].forEach(function(ev){ open.addEventListener(ev, loadShots, { passive: true }); });
  open.addEventListener('click', function(){ loadShots(); set(true); });
  close.addEventListener('click', function(){ set(false); });
  if(cta) cta.addEventListener('click', function(){ setTimeout(function(){ set(false); }, 400); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && wrap.classList.contains('flipped')) set(false); });

  // Gentle auto-scroll of the two page previews
  var S = [].map.call(back.querySelectorAll('.fb-scroll'), function(el){
    var s = { el: el, pos: 0, dir: 1, hold: 0, hover: false };
    function live(){ el.parentNode.classList.add('live'); }
    el.addEventListener('pointerenter', function(){ s.hover = true; live(); });
    el.addEventListener('pointerleave', function(){ s.hover = false; s.hold = performance.now() + 1500; s.pos = el.scrollTop; });
    ['wheel','touchstart','keydown'].forEach(function(ev){
      el.addEventListener(ev, function(){ s.hold = performance.now() + 2500; live(); }, { passive: true });
    });
    // progress line in place of a scrollbar
    var bar = document.createElement('span'); bar.className = 'fb-progress'; bar.setAttribute('aria-hidden','true');
    bar.appendChild(document.createElement('i')); el.parentNode.appendChild(bar);
    function progress(){ var max = el.scrollHeight - el.clientHeight; bar.style.setProperty('--p', max > 0 ? (el.scrollTop / max).toFixed(3) : 0); }
    el.addEventListener('scroll', function(){ if(s.hover || performance.now() < s.hold) s.pos = el.scrollTop; progress(); }, { passive: true });
    // mouse: grab anywhere and drag to scroll (touch already swipes natively)
    var drag = null;
    el.addEventListener('pointerdown', function(e){
      if(e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { y: e.clientY, top: el.scrollTop }; el.classList.add('dragging'); el.setPointerCapture(e.pointerId); live();
    });
    el.addEventListener('pointermove', function(e){ if(drag){ el.scrollTop = drag.top - (e.clientY - drag.y); s.pos = el.scrollTop; } });
    function end(){ if(drag){ drag = null; el.classList.remove('dragging'); s.hold = performance.now() + 2500; } }
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    return s;
  });
  if(reduce || !S.length) return;
  var last = 0;
  function tick(t){
    var dt = last ? Math.min(t - last, 50) / 1000 : 0; last = t;
    if(wrap.classList.contains('flipped')){
      S.forEach(function(s){
        if(s.hover || t < s.hold) return;
        var max = s.el.scrollHeight - s.el.clientHeight; if(max <= 0) return;
        s.pos += s.dir * 28 * dt;
        if(s.pos >= max){ s.pos = max; s.dir = -1; s.hold = t + 1800; }
        if(s.pos <= 0){ s.pos = 0; s.dir = 1; s.hold = t + 1800; }
        s.el.scrollTop = s.pos;
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
