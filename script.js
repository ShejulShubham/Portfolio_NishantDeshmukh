/**
 * Steady-Pace Virtual Scroll Accumulator Engine
 * Bypasses native browser document scroll pipelines to enforce strict speed limits.
 */
(function () {
  // Force reset baseline window views on load execution
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

  // Virtual Scroll Tracking Channels
  let virtualScrollY = 0;
  let targetVirtualScrollY = 0;
  let maxVideoScrollRange = window.innerHeight * 3; // Virtual space allocation for track transitions
  let contentHeight = 0;
  let maxTotalVirtualRange = 0;

  // STRICT VELOCITY CONTROLS
  const FRAME_STEP_SPEED = 6; // Maximum virtual pixels the engine can crawl per animation frame
  const WHEEL_SENSITIVITY = 0.4; // Softens input multipliers

  function updateLayoutBounds() {
    contentHeight = content.offsetHeight;
    maxTotalVirtualRange = maxVideoScrollRange + contentHeight;
  }

  // INTERCEPT COGNITIVE WHEEL EVENTS
  window.addEventListener("wheel", (e) => {
    e.preventDefault(); // Lock down native browser layout viewport jumps
    
    // Normalize direction indicator delta properties across browsers
    const direction = Math.sign(e.deltaY);
    
    // Increment target layout tracking coordinates by strict steady bounds
    targetVirtualScrollY += direction * 120 * WHEEL_SENSITIVITY;
    targetVirtualScrollY = clamp(targetVirtualScrollY, 0, maxTotalVirtualRange);
  }, { passive: false });

  // MOBILE INTERCEPT TOUCH MECHANICS
  let touchStartY = 0;
  window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Stop mobile elastic rebound bouncing actions
    const currentTouchY = e.touches[0].clientY;
    const deltaY = touchStartY - currentTouchY;
    touchStartY = currentTouchY; // Continually reset tracking base coordinates

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
      // Enforce absolute maximum velocity parameters per paint cycle
      const step = clamp(diff, -FRAME_STEP_SPEED, FRAME_STEP_SPEED);
      virtualScrollY += step;
    } else {
      virtualScrollY = targetVirtualScrollY;
    }

    // Isolate calculation parameters for video tracking segments
    const videoProg = clamp(virtualScrollY / maxVideoScrollRange, 0, 1);
    const vidT = videoProg * DURATION;

    // Direct performance seek tracking guard line
    if (!video.seeking && video.readyState >= 1) {
      video.currentTime = vidT;
    }

    // Scroll hint handling
    if (scrollHint) {
      scrollHint.style.opacity = 1 - ease(invlerp(0, 0.15, videoProg));
    }

    // STAGE TWO: If video is done, handle smooth layout translation transformations
    if (videoProg >= 1) {
      const contentScrollOffset = virtualScrollY - maxVideoScrollRange;
      
      // Shift overlay pane vertically across display limits smoothly
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