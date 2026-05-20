/**
 * Fixed Video Background Overlay Scroll Engine
 */
(function () {
  const video = document.getElementById("scene-video");
  const scrollHint = document.getElementById("scroll-hint");
  const flash = document.getElementById("enter-flash");
  const content = document.getElementById("content");
  const nav = document.getElementById("nav");
  const DURATION = 5.0;

  // Math Utilities
  function ease(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function invlerp(a, b, v) {
    return clamp((v - a) / (b - a), 0, 1);
  }

  // Inertia Parameters
  let currentScroll = 0;
  let targetScroll = 0;
  let maxVideoScrollRange = 0;
  const EASING_FACTOR = 0.08;

  function updateScrollBounds() {
    // Calculates the playback range based on the padding track before the content arrives
    maxVideoScrollRange =
      parseInt(window.getComputedStyle(content).paddingTop, 10) ||
      window.innerHeight * 4;
  }

  window.addEventListener(
    "scroll",
    () => {
      targetScroll = window.scrollY;
    },
    { passive: true },
  );

  video.load();
  video.addEventListener("loadedmetadata", () => {
    video.currentTime = 0;
    video.pause();
    updateScrollBounds();
    animate();
  });

  let flashFired = false;

  function animate() {
    const diff = targetScroll - currentScroll;
    currentScroll += diff * EASING_FACTOR;

    if (Math.abs(diff) < 0.1) {
      currentScroll = targetScroll;
    }

    // Map playback progress smoothly relative to our tracking bounds
    const videoProg = clamp(currentScroll / maxVideoScrollRange, 0, 1);

    // Scrub video timeline
    const vidT = videoProg * DURATION;
    if (video.readyState >= 2) {
      video.currentTime = vidT;
    }

    // Scroll hint handling
    scrollHint.style.opacity = 1 - ease(invlerp(0, 0.15, videoProg));

    // Dynamic Flash effect triggers during mid-track approach (e.g., around 70% video progress)
    if (videoProg >= 0.68 && videoProg <= 0.74) {
      if (!flashFired) {
        flash.style.transition = "none";
        flash.style.opacity = "0.4";
        setTimeout(() => {
          flash.style.transition = "opacity 0.4s ease";
          flash.style.opacity = "0";
        }, 60);
        flashFired = true;
      }
    } else if (videoProg < 0.65 || videoProg > 0.78) {
      flashFired = false;
    }

    // Reveal glass-panel stream container seamlessly right as the video finishes
    if (videoProg >= 0.90) {
      content.classList.add("visible");
    } else {
      content.classList.remove("visible");
    }

    // Reveal navigation header lines
    if (videoProg >= 0.95) {
      nav.classList.add("visible");
    } else {
      nav.classList.remove("visible");
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    updateScrollBounds();
  });
})();
