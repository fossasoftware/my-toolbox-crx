import test from "node:test";
import assert from "node:assert/strict";

import {
  boardLinkEndpointExists,
  getPersistedBoardLinks,
  shouldPersistUnresolvedBoardLink,
} from "../features/board/board-link-render-controller.js";

test("board link endpoint existence checks logical item and shape state", () => {
  const link = {
    id: "link-note-shape",
    fromId: "item-1",
    fromType: "item",
    toId: "shape-1",
    toType: "shape",
  };
  const items = [{ id: "item-1" }];
  const strokes = [{ id: "shape-1", shapeType: "rect" }];

  assert.equal(boardLinkEndpointExists(link, "from", { items, strokes }), true);
  assert.equal(boardLinkEndpointExists(link, "to", { items, strokes }), true);
  assert.equal(
    boardLinkEndpointExists(link, "to", {
      items,
      strokes: [{ id: "shape-1", shapeType: "" }],
    }),
    false
  );
});

test("unresolved board link is preserved while both logical endpoints still exist", () => {
  const link = {
    id: "link-note-shape",
    fromId: "item-1",
    fromType: "item",
    toId: "shape-1",
    toType: "shape",
  };
  const items = [{ id: "item-1" }];
  const strokes = [{ id: "shape-1", shapeType: "rect" }];

  assert.equal(shouldPersistUnresolvedBoardLink(link, { items, strokes }), true);
  assert.deepEqual(getPersistedBoardLinks([link], [], { items, strokes }), [link]);
});

test("unresolved board link is pruned when an endpoint no longer exists in board state", () => {
  const link = {
    id: "link-note-shape",
    fromId: "item-1",
    fromType: "item",
    toId: "shape-1",
    toType: "shape",
  };
  const items = [];
  const strokes = [{ id: "shape-1", shapeType: "rect" }];

  assert.equal(shouldPersistUnresolvedBoardLink(link, { items, strokes }), false);
  assert.deepEqual(getPersistedBoardLinks([link], [], { items, strokes }), []);
});

test("persisted board links keep valid rendered links and only prune logically deleted ones", () => {
  const links = [
    {
      id: "link-shape-shape",
      fromId: "shape-1",
      fromType: "shape",
      toId: "shape-2",
      toType: "shape",
    },
    {
      id: "link-note-shape",
      fromId: "item-1",
      fromType: "item",
      toId: "shape-1",
      toType: "shape",
    },
    {
      id: "link-deleted",
      fromId: "item-9",
      fromType: "item",
      toId: "shape-1",
      toType: "shape",
    },
  ];
  const validLinks = [links[0]];
  const items = [{ id: "item-1" }];
  const strokes = [
    { id: "shape-1", shapeType: "rect" },
    { id: "shape-2", shapeType: "ellipse" },
  ];

  assert.deepEqual(getPersistedBoardLinks(links, validLinks, { items, strokes }), [
    links[0],
    links[1],
  ]);
});
