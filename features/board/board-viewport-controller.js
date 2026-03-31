import {
  WHEEL_LINE_HEIGHT,
  WHEEL_PAGE_MULTIPLIER,
  WHEEL_ZOOM_INTENSITY,
  ZOOM_ANIMATION_DURATION,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_PRESETS,
  ZOOM_WHEEL_ITEM_HEIGHT,
} from "./board-config.js";
import { clamp } from "./board-geometry.js";

export function createBoardViewportController({
  scheduleViewportSave,
  getText,
  getCanvas,
  getCtx,
  getItemSelectionLayer,
  getLinksSvg,
  getStage,
  getViewport,
  getZoomControls,
  getZoomInButton,
  getZoomLabel,
  getZoomOutButton,
  getZoomPanel,
  isTextEditingActive,
  isViewportInteractionBlocked,
  redrawCanvas,
  updateLinks,
  scheduleShapeToolbarUpdate,
  scheduleItemToolbarUpdate,
  updateLinkPreviewFromState,
  updateLinkControlsPosition,
  cancelScheduledLinkUpdate,
}) {
  let viewPan = { x: 0, y: 0 };
  let viewZoom = 1;
  let linkRenderZoom = 1;
  let isPanning = false;
  let panStart = null;
  let panOrigin = null;
  let panUsedRightButton = false;
  let gestureZoomStart = null;
  let zoomAnimationFrame = 0;
  let zoomPresetButtons = [];
  let zoomWheel = null;
  let zoomWheelScrollFrame = 0;
  let zoomWheelIgnoreScroll = false;
  let zoomControlsStateTimeout = 0;

  function getViewportState() {
    return {
      zoom: getBoardZoom(),
      pan: {
        x: viewPan.x,
        y: viewPan.y,
      },
    };
  }

  function queueViewportSave() {
    scheduleViewportSave?.(getViewportState());
  }

  function applyViewportState(
    viewportState,
    { persist = false, redraw = true } = {}
  ) {
    const nextZoom = Number(viewportState?.zoom);
    const nextPan = viewportState?.pan;
    cancelZoomAnimation();
    gestureZoomStart = null;
    viewZoom =
      Number.isFinite(nextZoom) && nextZoom > 0
        ? clamp(nextZoom, ZOOM_MIN, ZOOM_MAX)
        : 1;
    viewPan = {
      x: Number.isFinite(Number(nextPan?.x)) ? Number(nextPan.x) : 0,
      y: Number.isFinite(Number(nextPan?.y)) ? Number(nextPan.y) : 0,
    };
    updateViewportTransform();
    if (redraw) {
      redrawCanvas();
    }
    if (persist) {
      queueViewportSave();
    }
  }

  function getBoardZoom() {
    return Number.isFinite(viewZoom) && viewZoom > 0 ? viewZoom : 1;
  }

  function getViewPan() {
    return viewPan;
  }

  function isPanningActive() {
    return isPanning;
  }

  function clearZoomControlsTransitionState() {
    if (zoomControlsStateTimeout) {
      window.clearTimeout(zoomControlsStateTimeout);
      zoomControlsStateTimeout = 0;
    }
    const zoomControls = getZoomControls();
    zoomControls?.classList.remove("is-opening");
    zoomControls?.classList.remove("is-collapsing");
  }

  function cancelZoomAnimation() {
    if (!zoomAnimationFrame) return;
    cancelAnimationFrame(zoomAnimationFrame);
    zoomAnimationFrame = 0;
  }

  function getClosestZoomPresetIndex(targetZoom = getBoardZoom()) {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    ZOOM_PRESETS.forEach((value, index) => {
      const distance = Math.abs(value - targetZoom);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  }

  function alignZoomWheelToSelection(options = {}) {
    if (!zoomWheel) return;
    const useSmooth = options.smooth !== false;
    const index = getClosestZoomPresetIndex();
    const maxTop = Math.max(0, zoomWheel.scrollHeight - zoomWheel.clientHeight);
    const targetTop = clamp(index * ZOOM_WHEEL_ITEM_HEIGHT, 0, maxTop);
    zoomWheelIgnoreScroll = true;
    zoomWheel.scrollTo({ top: targetTop, behavior: useSmooth ? "smooth" : "auto" });
    window.setTimeout(() => {
      zoomWheelIgnoreScroll = false;
    }, useSmooth ? 180 : 32);
  }

  function syncZoomPresetButtons(options = {}) {
    if (!zoomPresetButtons.length) return;
    const shouldAlignWheel = Boolean(options.alignWheel);
    const smooth = options.smooth !== false;
    const currentZoom = getBoardZoom();
    const closestIndex = getClosestZoomPresetIndex(currentZoom);
    zoomPresetButtons.forEach((button, index) => {
      const isActive = index === closestIndex;
      button.classList.toggle("is-selected", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    if (shouldAlignWheel) {
      alignZoomWheelToSelection({ smooth });
    }
  }

  function updateZoomControls() {
    const zoomLabel = getZoomLabel();
    const zoomOutButton = getZoomOutButton();
    const zoomInButton = getZoomInButton();
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(getBoardZoom() * 100)}%`;
    }
    syncZoomPresetButtons();
    if (zoomOutButton) {
      zoomOutButton.disabled = getBoardZoom() <= ZOOM_MIN + 0.001;
      zoomOutButton.setAttribute(
        "aria-disabled",
        zoomOutButton.disabled ? "true" : "false"
      );
    }
    if (zoomInButton) {
      zoomInButton.disabled = getBoardZoom() >= ZOOM_MAX - 0.001;
      zoomInButton.setAttribute(
        "aria-disabled",
        zoomInButton.disabled ? "true" : "false"
      );
    }
  }

  function updateBoardGrid() {
    const stage = getStage();
    if (!stage) return;
    const zoom = getBoardZoom();
    stage.style.setProperty("--board-grid-small", `${24 * zoom}px`);
    stage.style.setProperty("--board-grid-large", `${120 * zoom}px`);
    stage.style.setProperty("--board-grid-offset-x", `${viewPan.x}px`);
    stage.style.setProperty("--board-grid-offset-y", `${viewPan.y}px`);
  }

  function updateViewportTransform() {
    const viewport = getViewport();
    const linksSvg = getLinksSvg();
    const itemSelectionLayer = getItemSelectionLayer();
    const zoom = getBoardZoom();
    const shouldRefreshLinks = Math.abs(linkRenderZoom - zoom) > 0.0001;
    linkRenderZoom = zoom;
    if (viewport) {
      viewport.style.transform = `translate(${viewPan.x}px, ${viewPan.y}px) scale(${zoom})`;
      viewport.style.setProperty(
        "--board-ui-scale",
        `${Number.isFinite(zoom) && zoom > 0 ? 1 / zoom : 1}`
      );
    }
    if (linksSvg) {
      linksSvg.style.transform = `translate(${viewPan.x}px, ${viewPan.y}px)`;
    }
    if (itemSelectionLayer) {
      const dash = `${6 / zoom}px`;
      const gap = `${4 / zoom}px`;
      const linkDash = `${4 / zoom}px`;
      const linkGap = `${4 / zoom}px`;
      const linkHoverDash = `${6 / zoom}px`;
      const linkHoverGap = `${6 / zoom}px`;
      itemSelectionLayer.style.setProperty("--board-selection-dash", dash);
      itemSelectionLayer.style.setProperty("--board-selection-gap", gap);
      itemSelectionLayer.style.setProperty("--board-link-dash", linkDash);
      itemSelectionLayer.style.setProperty("--board-link-gap", linkGap);
      itemSelectionLayer.style.setProperty("--board-link-hover-dash", linkHoverDash);
      itemSelectionLayer.style.setProperty("--board-link-hover-gap", linkHoverGap);
    }
    updateZoomControls();
    updateBoardGrid();
    if (shouldRefreshLinks) {
      cancelScheduledLinkUpdate?.();
      updateLinks();
    }
    scheduleShapeToolbarUpdate();
    scheduleItemToolbarUpdate();
    updateLinkPreviewFromState();
    updateLinkControlsPosition();
  }

  function setBoardZoom(nextZoom, anchorPoint = null, options = {}) {
    const stage = getStage();
    const target = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
    if (!stage) return;
    const current = getBoardZoom();
    if (Math.abs(target - current) < 0.0001) return;
    const rect = stage.getBoundingClientRect();
    const anchor = anchorPoint || {
      x: rect.width / 2,
      y: rect.height / 2,
    };
    const worldX = (anchor.x - viewPan.x) / current;
    const worldY = (anchor.y - viewPan.y) / current;
    const targetPan = {
      x: anchor.x - worldX * target,
      y: anchor.y - worldY * target,
    };
    const animate = Boolean(options.animate);
    if (!animate) {
      cancelZoomAnimation();
      viewZoom = target;
      viewPan = targetPan;
      updateViewportTransform();
      redrawCanvas();
      queueViewportSave();
      return;
    }
    const duration = Math.max(
      80,
      Number.isFinite(options.duration)
        ? Number(options.duration)
        : ZOOM_ANIMATION_DURATION
    );
    const startZoom = current;
    const startPan = { ...viewPan };
    const zoomDiff = target - startZoom;
    const panDiffX = targetPan.x - startPan.x;
    const panDiffY = targetPan.y - startPan.y;
    const startedAt = performance.now();
    cancelZoomAnimation();
    const tick = (timestamp) => {
      const progress = clamp((timestamp - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      viewZoom = startZoom + zoomDiff * eased;
      viewPan = {
        x: startPan.x + panDiffX * eased,
        y: startPan.y + panDiffY * eased,
      };
      updateViewportTransform();
      redrawCanvas();
      queueViewportSave();
      if (progress < 1) {
        zoomAnimationFrame = requestAnimationFrame(tick);
        return;
      }
      zoomAnimationFrame = 0;
      viewZoom = target;
      viewPan = targetPan;
      updateViewportTransform();
      redrawCanvas();
      queueViewportSave();
    };
    zoomAnimationFrame = requestAnimationFrame(tick);
  }

  function normalizeWheelDelta(event, rect) {
    let deltaX = event.deltaX;
    let deltaY = event.deltaY;
    if (event.deltaMode === 1) {
      deltaX *= WHEEL_LINE_HEIGHT;
      deltaY *= WHEEL_LINE_HEIGHT;
    } else if (event.deltaMode === 2 && rect) {
      deltaX *= rect.width * WHEEL_PAGE_MULTIPLIER;
      deltaY *= rect.height * WHEEL_PAGE_MULTIPLIER;
    }
    return { deltaX, deltaY };
  }

  function onStageWheel(event) {
    const stage = getStage();
    if (!stage) return;
    if (event.defaultPrevented) return;
    if (isViewportInteractionBlocked() || isPanning) {
      return;
    }
    if (isTextEditingActive()) return;
    const rect = stage.getBoundingClientRect();
    const { deltaX, deltaY } = normalizeWheelDelta(event, rect);
    if ((event.ctrlKey || event.metaKey) && Math.abs(deltaY) > 0.01) {
      event.preventDefault();
      cancelZoomAnimation();
      const anchor = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const zoomFactor = Math.exp(-deltaY * WHEEL_ZOOM_INTENSITY);
      setBoardZoom(getBoardZoom() * zoomFactor, anchor);
      return;
    }
    if (!deltaX && !deltaY) return;
    event.preventDefault();
    cancelZoomAnimation();
    let panX = deltaX;
    let panY = deltaY;
    if (event.shiftKey && Math.abs(panX) < Math.abs(panY)) {
      panX = panY;
      panY = 0;
    }
    viewPan = {
      x: viewPan.x - panX,
      y: viewPan.y - panY,
    };
    updateViewportTransform();
    redrawCanvas();
    queueViewportSave();
  }

  function onStageGestureStart(event) {
    if (!getStage()) return;
    if (isTextEditingActive()) return;
    event.preventDefault();
    cancelZoomAnimation();
    gestureZoomStart = getBoardZoom();
  }

  function onStageGestureChange(event) {
    const stage = getStage();
    if (!stage || gestureZoomStart === null) return;
    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    const anchor = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setBoardZoom(gestureZoomStart * event.scale, anchor);
  }

  function onStageGestureEnd() {
    gestureZoomStart = null;
  }

  function startBoardPan(event) {
    const stage = getStage();
    cancelZoomAnimation();
    if (!stage) return;
    isPanning = true;
    if (event && event.button === 2) {
      panUsedRightButton = true;
    }
    panStart = { x: event.clientX, y: event.clientY };
    panOrigin = { x: viewPan.x, y: viewPan.y };
    stage.classList.add("is-panning");
  }

  function updateBoardPan(event) {
    if (!isPanning || !panStart || !panOrigin) return;
    viewPan = {
      x: panOrigin.x + (event.clientX - panStart.x),
      y: panOrigin.y + (event.clientY - panStart.y),
    };
    updateViewportTransform();
    redrawCanvas();
    queueViewportSave();
  }

  function finishBoardPan() {
    const stage = getStage();
    if (!isPanning) return;
    isPanning = false;
    panStart = null;
    panOrigin = null;
    if (stage) {
      stage.classList.remove("is-panning");
    }
    if (panUsedRightButton) {
      setTimeout(() => {
        panUsedRightButton = false;
      }, 60);
    }
    queueViewportSave();
  }

  function resizeCanvas() {
    const canvas = getCanvas();
    const stage = getStage();
    const ctx = getCtx();
    if (!canvas || !stage || !ctx) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    redrawCanvas();
    updateLinks();
    updateViewportTransform();
  }

  function getWorldPointFromClient(clientX, clientY, rectOverride = null) {
    const stage = getStage();
    const rect =
      rectOverride || stage?.getBoundingClientRect() || { left: 0, top: 0 };
    const zoom = getBoardZoom();
    return {
      x: (clientX - rect.left - viewPan.x) / zoom,
      y: (clientY - rect.top - viewPan.y) / zoom,
    };
  }

  function setZoomPanelState(isOpen) {
    const next = Boolean(isOpen);
    const zoomControls = getZoomControls();
    const zoomPanel = getZoomPanel();
    const zoomLabel = getZoomLabel();
    if (zoomControls) {
      if (next) {
        const shouldAnimateOpen =
          !zoomControls.classList.contains("is-expanded") &&
          !zoomControls.classList.contains("is-opening");
        clearZoomControlsTransitionState();
        if (shouldAnimateOpen) {
          zoomControls.classList.add("is-opening");
          void zoomControls.offsetWidth;
        }
        zoomControls.classList.add("is-expanded");
        if (shouldAnimateOpen) {
          zoomControlsStateTimeout = window.setTimeout(() => {
            zoomControlsStateTimeout = 0;
            zoomControls.classList.remove("is-opening");
          }, 240);
        }
      } else {
        const shouldAnimateCollapse =
          zoomControls.classList.contains("is-expanded") ||
          zoomControls.classList.contains("is-collapsing");
        clearZoomControlsTransitionState();
        zoomControls.classList.remove("is-expanded");
        if (shouldAnimateCollapse) {
          zoomControls.classList.add("is-collapsing");
          zoomControlsStateTimeout = window.setTimeout(() => {
            zoomControlsStateTimeout = 0;
            zoomControls.classList.remove("is-collapsing");
          }, 240);
        }
      }
    }
    if (zoomPanel) {
      zoomPanel.classList.toggle("is-open", next);
      zoomPanel.setAttribute("aria-hidden", next ? "false" : "true");
    }
    if (zoomLabel) {
      zoomLabel.setAttribute("aria-expanded", next ? "true" : "false");
      zoomLabel.classList.toggle("is-open", next);
    }
    if (next) {
      cancelZoomAnimation();
      requestAnimationFrame(() => {
        syncZoomPresetButtons({ alignWheel: true, smooth: false });
      });
    }
  }

  function closeZoomPanel() {
    if (zoomWheelScrollFrame) {
      cancelAnimationFrame(zoomWheelScrollFrame);
      zoomWheelScrollFrame = 0;
    }
    setZoomPanelState(false);
  }

  function toggleZoomPanel() {
    const zoomPanel = getZoomPanel();
    if (!zoomPanel) return;
    const isOpen = zoomPanel.classList.contains("is-open");
    setZoomPanelState(!isOpen);
  }

  function stepZoomPresetByDirection(direction, options = {}) {
    const delta = direction > 0 ? 1 : direction < 0 ? -1 : 0;
    if (!delta) return false;
    const lastIndex = ZOOM_PRESETS.length - 1;
    if (lastIndex < 0) return false;
    const currentIndex = getClosestZoomPresetIndex();
    const nextIndex = clamp(currentIndex + delta, 0, lastIndex);
    if (nextIndex === currentIndex) return false;
    const nextZoom = ZOOM_PRESETS[nextIndex];
    if (!Number.isFinite(nextZoom)) return false;
    if (options.syncWheel !== false && zoomWheel) {
      const maxTop = Math.max(0, zoomWheel.scrollHeight - zoomWheel.clientHeight);
      const nextTop = clamp(nextIndex * ZOOM_WHEEL_ITEM_HEIGHT, 0, maxTop);
      zoomWheelIgnoreScroll = true;
      zoomWheel.scrollTop = nextTop;
      window.setTimeout(() => {
        zoomWheelIgnoreScroll = false;
      }, 32);
    }
    const duration = Number.isFinite(options.duration) ? Number(options.duration) : 140;
    setBoardZoom(nextZoom, null, { animate: true, duration });
    return true;
  }

  function applyZoomFromWheelScroll() {
    if (!zoomWheel) return;
    const maxTop = Math.max(0, zoomWheel.scrollHeight - zoomWheel.clientHeight);
    const top = clamp(zoomWheel.scrollTop, 0, maxTop);
    const lastIndex = ZOOM_PRESETS.length - 1;
    if (lastIndex < 0) return;
    const rawIndex = Math.round(top / ZOOM_WHEEL_ITEM_HEIGHT);
    const index = clamp(rawIndex, 0, lastIndex);
    const nextZoom = ZOOM_PRESETS[index];
    if (!Number.isFinite(nextZoom)) return;
    if (Math.abs(nextZoom - getBoardZoom()) < 0.01) return;
    setBoardZoom(nextZoom, null, { animate: true, duration: 140 });
  }

  function setupZoomPanel() {
    const zoomLabel = getZoomLabel();
    const zoomPanel = getZoomPanel();
    zoomPresetButtons = [];
    zoomWheel = null;
    if (!zoomLabel || !zoomPanel) return;
    zoomLabel.setAttribute("aria-label", getText("boardZoomMenu"));
    zoomPanel.innerHTML = "";

    const wheelWrap = document.createElement("div");
    wheelWrap.className = "board-zoom-wheel-wrap";

    const wheel = document.createElement("div");
    wheel.className = "board-zoom-wheel";
    wheel.setAttribute("role", "listbox");
    wheel.setAttribute("aria-label", getText("boardZoomMenu"));
    zoomWheel = wheel;

    const wheelIndicator = document.createElement("div");
    wheelIndicator.className = "board-zoom-wheel-indicator";
    wheelIndicator.setAttribute("aria-hidden", "true");

    ZOOM_PRESETS.forEach((zoomValue) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "board-zoom-wheel-item";
      button.dataset.zoom = String(zoomValue);
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      button.textContent = `${Math.round(zoomValue * 100)}%`;
      button.addEventListener("click", () => {
        setBoardZoom(zoomValue, null, { animate: true });
        closeZoomPanel();
      });
      wheel.appendChild(button);
      zoomPresetButtons.push(button);
    });
    wheel.addEventListener("scroll", () => {
      if (zoomWheelIgnoreScroll) return;
      if (zoomWheelScrollFrame) return;
      zoomWheelScrollFrame = requestAnimationFrame(() => {
        zoomWheelScrollFrame = 0;
        applyZoomFromWheelScroll();
      });
    });
    wheel.addEventListener(
      "wheel",
      (event) => {
        if (!zoomPanel.classList.contains("is-open")) return;
        event.preventDefault();
        event.stopPropagation();
        const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
        if (!direction) return;
        stepZoomPresetByDirection(direction, { syncWheel: true, duration: 140 });
      },
      { passive: false }
    );
    wheelWrap.appendChild(wheel);
    wheelWrap.appendChild(wheelIndicator);
    zoomPanel.appendChild(wheelWrap);

    zoomLabel.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleZoomPanel();
    });
    zoomLabel.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
        if (!direction) return;
        const syncWheel = Boolean(zoomPanel.classList.contains("is-open"));
        stepZoomPresetByDirection(direction, { syncWheel, duration: 140 });
      },
      { passive: false }
    );
    zoomPanel.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    zoomPanel.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    zoomPanel.addEventListener("wheel", (event) => {
      event.stopPropagation();
    });
    document.addEventListener("pointerdown", (event) => {
      if (zoomPanel.contains(event.target) || zoomLabel.contains(event.target)) {
        return;
      }
      closeZoomPanel();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeZoomPanel();
      }
    });
  }

  function handleCanvasContextMenu(event) {
    if (panUsedRightButton) {
      event.preventDefault();
      panUsedRightButton = false;
    }
  }

  function handleStageContextMenu(event, forcePrevent = false) {
    if (isPanning || forcePrevent) {
      event.preventDefault();
    }
  }

  return {
    applyViewportState,
    closeZoomPanel,
    finishBoardPan,
    getBoardZoom,
    getViewportState,
    getViewPan,
    getWorldPointFromClient,
    handleCanvasContextMenu,
    handleStageContextMenu,
    isPanning: isPanningActive,
    onStageGestureChange,
    onStageGestureEnd,
    onStageGestureStart,
    onStageWheel,
    resizeCanvas,
    setBoardZoom,
    setupZoomPanel,
    startBoardPan,
    updateBoardPan,
    updateViewportTransform,
  };
}
