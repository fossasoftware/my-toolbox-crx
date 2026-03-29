function getNow() {
  return typeof performance !== "undefined" &&
    typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export function scheduleOverlayFrame({
  getRafId,
  setRafId,
  shouldSchedule,
  onFrame,
}) {
  if (!shouldSchedule() || getRafId()) return;

  setRafId(
    requestAnimationFrame(() => {
      setRafId(null);
      if (!shouldSchedule()) return;
      onFrame();
    })
  );
}

export function syncOverlayDuringTransition({
  duration = 260,
  getRafId,
  setRafId,
  getTransitionUntil,
  setTransitionUntil,
  shouldContinue,
  onFrame,
}) {
  if (!shouldContinue()) return;

  setTransitionUntil(Math.max(getTransitionUntil(), getNow() + duration));
  if (getRafId()) return;

  const tick = () => {
    setRafId(null);
    if (!shouldContinue()) {
      setTransitionUntil(0);
      return;
    }

    onFrame();

    if (!shouldContinue()) {
      setTransitionUntil(0);
      return;
    }

    if (getNow() < getTransitionUntil()) {
      setRafId(requestAnimationFrame(tick));
    } else {
      setTransitionUntil(0);
    }
  };

  setRafId(requestAnimationFrame(tick));
}
