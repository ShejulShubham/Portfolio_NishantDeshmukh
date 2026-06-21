/**
 * Steady-Pace Virtual Scroll Accumulator Engine
 */
(function () {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  const video = document.getElementById("scene-video");
  const scrollHint = document.getElementById("scroll-hint");
  const content = document.getElementById("content");
  const nav = document.getElementById("nav");
  const DURATION = 5.0;

  // Math Utilities
  function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function invlerp(a, b, v) { return clamp((v - a) / (b - a), 0, 1); }

  // Virtual Tracking Framework Channels
  let virtualScrollY = 0;
  let targetVirtualScrollY = 0;
  let maxVideoScrollRange = window.innerHeight * 3.5; 
  let maxTotalVirtualRange = 0;

  // STRICT PACING SPEEDS
  const FRAME_STEP_SPEED = 12; 
  const WHEEL_SENSITIVITY = 0.45;

  function updateLayoutBounds() {
    // Capture the absolute rendering height footprint of your element layers
    const originalDisplay = content.style.display;
    content.style.display = 'block';
    const trueContentHeight = content.scrollHeight;
    content.style.display = originalDisplay;

    // Boundary range targets the track limits flawlessly
    maxTotalVirtualRange = maxVideoScrollRange + (trueContentHeight - window.innerHeight);
  }

  // Intercept scroll wheel events
  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    const direction = Math.sign(e.deltaY);
    targetVirtualScrollY += direction * 120 * WHEEL_SENSITIVITY;
    targetVirtualScrollY = clamp(targetVirtualScrollY, 0, maxTotalVirtualRange);
  }, { passive: false });

  // Intercept touch movements
  let touchStartY = 0;
  window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const currentTouchY = e.touches[0].clientY;
    const deltaY = touchStartY - currentTouchY;
    touchStartY = currentTouchY;

    targetVirtualScrollY += deltaY * 1.5;
    targetVirtualScrollY = clamp(targetVirtualScrollY, 0, maxTotalVirtualRange);
  }, { passive: false });

  let isEngineRunning = false;
  function initializeEngine() {
    if (isEngineRunning) return;
    isEngineRunning = true;
    
    video.currentTime = 0;
    video.pause();
    updateLayoutBounds();
    requestAnimationFrame(animate);
  }

  if (video.readyState >= 1) {
    initializeEngine();
  } else {
    video.addEventListener("loadedmetadata", initializeEngine);
    setTimeout(initializeEngine, 300); 
  }

  function animate() {
    const diff = targetVirtualScrollY - virtualScrollY;

    if (Math.abs(diff) > 0.1) {
      const step = clamp(diff, -FRAME_STEP_SPEED, FRAME_STEP_SPEED);
      virtualScrollY += step;
    } else {
      virtualScrollY = targetVirtualScrollY;
    }

    const videoProg = clamp(virtualScrollY / maxVideoScrollRange, 0, 1);
    const vidT = videoProg * DURATION;

    // Chrome seeking queue protection guard
    if (!video.seeking && video.readyState >= 1) {
      video.currentTime = vidT;
    }

    if (scrollHint) {
      scrollHint.style.opacity = 1 - ease(invlerp(0, 0.15, videoProg));
    }

    // Handles the sliding translation transitions perfectly without early cut-offs
    if (videoProg >= 0.99) {
      const contentScrollOffset = virtualScrollY - maxVideoScrollRange;
      content.style.transform = `translateY(${-contentScrollOffset}px)`;
      content.classList.add("visible");
      nav.classList.add("visible");
    } else {
      content.style.transform = `translateY(0px)`;
      content.classList.remove("visible");
      nav.classList.remove("visible");
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    updateLayoutBounds();
  });
})();