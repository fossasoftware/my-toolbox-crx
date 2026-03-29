export function createNotepadHistorySnapshot(area) {
  return {
    value: area.value,
    selectionStart: area.selectionStart ?? area.value.length,
    selectionEnd: area.selectionEnd ?? area.value.length,
  };
}

export function createNotepadHistoryManager({ historyLimit = 120 } = {}) {
  let history = [];
  let future = [];
  let muted = false;

  function setMuted(value) {
    muted = Boolean(value);
  }

  function isMuted() {
    return muted;
  }

  function reset(area) {
    if (!area) return false;
    history = [createNotepadHistorySnapshot(area)];
    future = [];
    return true;
  }

  function push(area) {
    if (muted || !area) return false;
    const snapshot = createNotepadHistorySnapshot(area);
    const lastSnapshot = history[history.length - 1];
    if (
      lastSnapshot &&
      lastSnapshot.value === snapshot.value &&
      lastSnapshot.selectionStart === snapshot.selectionStart &&
      lastSnapshot.selectionEnd === snapshot.selectionEnd
    ) {
      return false;
    }
    history.push(snapshot);
    if (history.length > historyLimit) {
      history.shift();
    }
    future = [];
    return true;
  }

  function undo(area) {
    if (!area || history.length <= 1) return null;
    future.push(createNotepadHistorySnapshot(area));
    history.pop();
    return history[history.length - 1] || null;
  }

  function redo(area) {
    if (!area || future.length === 0) return null;
    const snapshot = future.pop();
    history.push(snapshot);
    return snapshot;
  }

  function canUndo() {
    return history.length > 1;
  }

  function canRedo() {
    return future.length > 0;
  }

  return {
    canRedo,
    canUndo,
    isMuted,
    push,
    redo,
    reset,
    setMuted,
    undo,
  };
}
