import test from "node:test";
import assert from "node:assert/strict";

import {
  insertCodeTransform,
  insertLinkTransform,
  toggleCheckboxListTransform,
  toggleHeadingTransform,
} from "../features/notepad/notepad-markdown-transforms.js";

function makeArea(value, selectionStart = 0, selectionEnd = selectionStart) {
  return {
    value,
    selectionStart,
    selectionEnd,
  };
}

test("insertLinkTransform wraps the selected text and places the caret in the url slot", () => {
  const result = insertLinkTransform(makeArea("hello world", 0, 5));

  assert.equal(result.nextValue, "[hello]() world");
  assert.equal(result.nextSelectionStart, 8);
  assert.equal(result.nextSelectionEnd, 8);
});

test("insertCodeTransform wraps multiline selections in fenced code blocks", () => {
  const result = insertCodeTransform(makeArea("alpha\nbeta", 0, 10));

  assert.equal(result.nextValue, "```\nalpha\nbeta\n```");
  assert.equal(result.nextSelectionStart, 4);
  assert.equal(result.nextSelectionEnd, 14);
});

test("toggleHeadingTransform adds and removes the same heading level", () => {
  const added = toggleHeadingTransform(makeArea("Task", 0, 4), 2);
  assert.equal(added.nextValue, "## Task");

  const removed = toggleHeadingTransform(
    makeArea(added.nextValue, 0, added.nextValue.length),
    2
  );
  assert.equal(removed.nextValue, "Task");
});

test("toggleCheckboxListTransform converts bullets into checkboxes and toggles them off", () => {
  const added = toggleCheckboxListTransform(makeArea("- one\n- two", 0, 11));
  assert.equal(added.nextValue, "- [ ] one\n- [ ] two");

  const removed = toggleCheckboxListTransform(
    makeArea(added.nextValue, 0, added.nextValue.length),
    0,
    added.nextValue.length
  );
  assert.equal(removed.nextValue, "one\ntwo");
});
