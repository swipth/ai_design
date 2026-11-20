const AUTH_STORAGE_KEY = "ai_design_authenticated";
const ACCESS_CODE = "212";

const gate = document.getElementById("access-gate");
const form = document.getElementById("access-form");
const input = document.getElementById("access-input");
const errorEl = document.getElementById("access-error");
const appShell = document.getElementById("app-shell");

function unlockApp() {
  document.body.classList.remove("locked");
  sessionStorage.setItem(AUTH_STORAGE_KEY, "1");
  if (appShell) {
    appShell.hidden = false;
  }
  initPage();
}

function showAccessError() {
  if (!errorEl) return;
  errorEl.hidden = false;
  if (input) {
    input.classList.add("access-gate__input--error");
    input.select();
  }
}

function clearAccessError() {
  if (errorEl) errorEl.hidden = true;
  if (input) input.classList.remove("access-gate__input--error");
}

function initAccessGate() {
  if (sessionStorage.getItem(AUTH_STORAGE_KEY) === "1") {
    unlockApp();
    return;
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearAccessError();
      const value = input ? input.value.trim() : "";
      if (value === ACCESS_CODE) {
        unlockApp();
      } else {
        showAccessError();
      }
    });
  }

  if (input) {
    input.addEventListener("input", clearAccessError);
    input.focus();
  }
}

function initPage() {
  const links = [...document.querySelectorAll(".side a")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const progress = document.querySelector(".scroll-progress");

  function markCurrent() {
    const line = window.scrollY + 140;
    let current = sections[0];
    for (const section of sections) {
      if (section.offsetTop <= line) current = section;
    }
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`);
    });
  }

  function updateProgress() {
    if (!progress) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${pct}%`;
  }

  function initReveal() {
    const blocks = document.querySelectorAll("section.reveal");
    if (!blocks.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      blocks.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    blocks.forEach((el) => io.observe(el));
  }

  function onScroll() {
    markCurrent();
    updateProgress();
  }

  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  initReveal();
  initFigureLightbox();
}

function initFigureLightbox() {
  const lightbox = document.getElementById("figure-lightbox");
  const lbImg = document.getElementById("figure-lightbox-img");
  const lbTitle = document.getElementById("figure-lightbox-title");
  const stage = document.getElementById("figure-lightbox-stage");
  const resetBtn = lightbox?.querySelector('[data-zoom="reset"]');
  const triggers = document.querySelectorAll(".figure-zoom");

  if (!lightbox || !lbImg || !stage) return;

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.2;
  let zoom = 1;
  let fitScale = 1;
  let lastFocused = null;

  function updateImageSize() {
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const iw = lbImg.naturalWidth;
    const ih = lbImg.naturalHeight;
    if (!sw || !sh || !iw || !ih) return;
    fitScale = Math.min(sw / iw, sh / ih) * 0.96;
    const scale = fitScale * zoom;
    lbImg.style.width = `${iw * scale}px`;
    lbImg.style.height = `${ih * scale}px`;
    if (resetBtn) {
      const label = Math.round(zoom * 100);
      resetBtn.textContent = label === 100 ? "适应" : `${label}%`;
    }
  }

  function centerScroll() {
    requestAnimationFrame(() => {
      const maxL = Math.max(0, stage.scrollWidth - stage.clientWidth);
      const maxT = Math.max(0, stage.scrollHeight - stage.clientHeight);
      stage.scrollLeft = maxL / 2;
      stage.scrollTop = maxT / 2;
    });
  }

  function zoomAt(stageX, stageY, nextZoom) {
    const prev = zoom;
    zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom));
    if (zoom === prev) return;
    const ratio = zoom / prev;
    const offsetX = stageX - stage.scrollLeft;
    const offsetY = stageY - stage.scrollTop;
    updateImageSize();
    stage.scrollLeft = stageX * ratio - offsetX;
    stage.scrollTop = stageY * ratio - offsetY;
  }

  function setZoom(next, clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    let stageX;
    let stageY;
    if (clientX == null) {
      stageX = stage.scrollLeft + stage.clientWidth / 2;
      stageY = stage.scrollTop + stage.clientHeight / 2;
    } else {
      stageX = clientX - rect.left + stage.scrollLeft;
      stageY = clientY - rect.top + stage.scrollTop;
    }
    zoomAt(stageX, stageY, next);
  }

  function fitToScreen() {
    zoom = 1;
    updateImageSize();
    centerScroll();
  }

  function openPreview(sourceImg) {
    if (!sourceImg?.src) return;
    lastFocused = document.activeElement;
    zoom = 1;
    const onReady = () => {
      updateImageSize();
      centerScroll();
    };
    lbImg.onload = onReady;
    lbImg.src = sourceImg.currentSrc || sourceImg.src;
    lbImg.alt = sourceImg.alt || "";
    if (lbTitle) lbTitle.textContent = sourceImg.alt || "架构图预览";
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    if (lbImg.complete) onReady();
    lightbox.querySelector('[data-zoom="in"]')?.focus();
  }

  window.addEventListener("resize", () => {
    if (!lightbox.hidden) {
      const cx = stage.scrollLeft + stage.clientWidth / 2;
      const cy = stage.scrollTop + stage.clientHeight / 2;
      const prev = zoom;
      updateImageSize();
      zoomAt(cx, cy, prev);
    }
  });

  function closePreview() {
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    lbImg.removeAttribute("src");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  triggers.forEach((wrap) => {
    const img = wrap.querySelector("img");
    if (!img) return;

    wrap.addEventListener("click", () => openPreview(img));
    wrap.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPreview(img);
      }
    });
  });

  lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => {
    el.addEventListener("click", closePreview);
  });

  lightbox.querySelector('[data-zoom="in"]')?.addEventListener("click", () => {
    setZoom(zoom + ZOOM_STEP);
  });

  lightbox.querySelector('[data-zoom="out"]')?.addEventListener("click", () => {
    setZoom(zoom - ZOOM_STEP);
  });

  resetBtn?.addEventListener("click", () => fitToScreen());

  lightbox.querySelector('[data-zoom="recenter"]')?.addEventListener("click", () => {
    centerScroll();
  });

  stage.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(zoom + delta, event.clientX, event.clientY);
    },
    { passive: false }
  );

  stage.addEventListener("dblclick", (event) => {
    event.preventDefault();
    if (zoom > 1.05) {
      fitToScreen();
    } else {
      setZoom(2, event.clientX, event.clientY);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closePreview();
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setZoom(zoom + ZOOM_STEP);
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      setZoom(zoom - ZOOM_STEP);
    }
    if (event.key === "0") {
      event.preventDefault();
      fitToScreen();
    }
  });

  let dragActive = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let scrollStartX = 0;
  let scrollStartY = 0;

  function endDrag() {
    dragActive = false;
    stage.classList.remove("is-grabbing");
  }

  stage.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    dragActive = true;
    stage.classList.add("is-grabbing");
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    scrollStartX = stage.scrollLeft;
    scrollStartY = stage.scrollTop;
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragActive) return;
    event.preventDefault();
    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    stage.scrollLeft = scrollStartX - dx;
    stage.scrollTop = scrollStartY - dy;
  });

  window.addEventListener("mouseup", endDrag);

  let touchMode = null;
  let touchStartDist = 0;
  let touchStartZoom = 1;
  let touchPanStartX = 0;
  let touchPanStartY = 0;
  let touchScrollStartX = 0;
  let touchScrollStartY = 0;

  stage.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 1) {
        touchMode = "pan";
        const t = event.touches[0];
        touchPanStartX = t.clientX;
        touchPanStartY = t.clientY;
        touchScrollStartX = stage.scrollLeft;
        touchScrollStartY = stage.scrollTop;
      } else if (event.touches.length === 2) {
        touchMode = "pinch";
        const [a, b] = event.touches;
        touchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        touchStartZoom = zoom;
      }
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchmove",
    (event) => {
      if (touchMode === "pan" && event.touches.length === 1) {
        event.preventDefault();
        const t = event.touches[0];
        stage.scrollLeft = touchScrollStartX - (t.clientX - touchPanStartX);
        stage.scrollTop = touchScrollStartY - (t.clientY - touchPanStartY);
      } else if (touchMode === "pinch" && event.touches.length === 2) {
        event.preventDefault();
        const [a, b] = event.touches;
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const midX = (a.clientX + b.clientX) / 2;
        const midY = (a.clientY + b.clientY) / 2;
        const next = touchStartZoom * (dist / touchStartDist);
        setZoom(next, midX, midY);
      }
    },
    { passive: false }
  );

  stage.addEventListener("touchend", () => {
    touchMode = null;
  });
}

initAccessGate();