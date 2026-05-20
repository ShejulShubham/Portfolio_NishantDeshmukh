/**
 * Scroll Video Driver & Animation Engine
 * Handled via requestAnimationFrame for rendering optimization.
 */
(function() {
  const video = document.getElementById('scene-video');
  const scrollHint = document.getElementById('scroll-hint');
  const flash = document.getElementById('enter-flash');
  const intOverlay = document.getElementById('interior-overlay');
  const content = document.getElementById('content');
  const nav = document.getElementById('nav');
  const driver = document.getElementById('scroll-driver');
  const DURATION = 5.0;

  // Linear interpolation and easing math utilities
  function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function invlerp(a, b, v) { return clamp((v - a) / (b - a), 0, 1); }

  // Initial target setup
  video.load();
  video.addEventListener('loadedmetadata', () => {
    video.currentTime = 0;
    video.pause();
  });

  let ticking = false;
  let flashFired = false;

  function update() {
    ticking = false;
    const sy = window.scrollY;
    const sMax = driver.offsetHeight - window.innerHeight;
    const prog = clamp(sy / sMax, 0, 1);

    // Dynamic scrubbing calculation
    const vidT = invlerp(0, 0.85, prog) * DURATION;
    if (video.readyState >= 2) {
      video.currentTime = vidT;
    }

    // Fade scroll indicators out quickly (0% -> 6% progress)
    scrollHint.style.opacity = 1 - ease(invlerp(0, 0.06, prog));

    // Dynamic flashing effect triggers around the room entry step (58% -> 62%)
    if (prog >= 0.58 && prog <= 0.62) {
      if (!flashFired) {
        flash.style.transition = 'none';
        flash.style.opacity = '0.6';
        setTimeout(() => {
          flash.style.transition = 'opacity 0.35s';
          flash.style.opacity = '0';
        }, 80);
        flashFired = true;
      }
    } else if (prog < 0.55 || prog > 0.65) {
      flashFired = false;
    }

    // Dark ambient transition depth (60% -> 85%)
    intOverlay.style.opacity = invlerp(0.60, 0.85, prog) * 0.65;

    // Interface elements container reveal triggers past the target zone
    if (prog >= 0.85) {
      content.classList.add('visible');
      nav.classList.add('visible');
    } else {
      content.classList.remove('visible');
      nav.classList.remove('visible');
    }
  }

  // Window Event Listeners optimized via microtask frame execution
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  window.addEventListener('resize', update);
  
  // Initial frame alignment kick off
  update();
})();