function getStateSignature(state) {
  try {
    return JSON.stringify(state);
  } catch (error) {
    return String(Date.now());
  }
}

export function createBoardHistoryManager({ historyLimit }) {
  let history = [];
  let future = [];
  let paused = false;
  let lastSignature = null;
  let commitTimeout = null;

  function clearCommitTimeout() {
    clearTimeout(commitTimeout);
    commitTimeout = null;
  }

  return {
    pause() {
      paused = true;
      clearCommitTimeout();
    },

    resume() {
      paused = false;
    },

    reset() {
      clearCommitTimeout();
      history = [];
      future = [];
      lastSignature = null;
    },

    captureSnapshot(state, cloneState) {
      if (paused) {
        return false;
      }

      const snapshot = cloneState(state);
      const signature = getStateSignature(snapshot);
      if (signature === lastSignature) {
        return false;
      }

      history.push({ snapshot, signature });
      lastSignature = signature;
      if (history.length > historyLimit) {
        history.shift();
      }
      future = [];
      return true;
    },

    scheduleCommit(commit, delay) {
      if (paused) {
        return;
      }

      clearCommitTimeout();
      commitTimeout = setTimeout(() => {
        commitTimeout = null;
        commit();
      }, delay);
    },

    syncCurrentSignature(state) {
      lastSignature = getStateSignature(state);
    },

    canUndo() {
      return history.length > 1;
    },

    canRedo() {
      return future.length > 0;
    },

    undo() {
      if (history.length <= 1) {
        return null;
      }

      const current = history.pop();
      future.push(current);
      const previous = history[history.length - 1];
      lastSignature = previous.signature;
      return previous.snapshot;
    },

    redo() {
      if (future.length === 0) {
        return null;
      }

      const next = future.pop();
      history.push(next);
      lastSignature = next.signature;
      return next.snapshot;
    },
  };
}
