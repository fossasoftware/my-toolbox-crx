import test from "node:test";
import assert from "node:assert/strict";

import {
  LINK_TYPE_ITEM,
  LINK_TYPE_SHAPE,
} from "../features/board/board-config.js";
import {
  getLinkType,
  isLinkBetweenEndpoints,
  isSameLinkEndpoint,
  linkHasEndpoint,
  makeLinkEndpoint,
} from "../features/board/board-link-endpoints.js";

test("makeLinkEndpoint and isSameLinkEndpoint compare endpoint identity", () => {
  const first = makeLinkEndpoint(LINK_TYPE_ITEM, "item-1");
  const second = makeLinkEndpoint(LINK_TYPE_ITEM, "item-1");
  const third = makeLinkEndpoint(LINK_TYPE_SHAPE, "shape-1");

  assert.deepEqual(first, { type: LINK_TYPE_ITEM, id: "item-1" });
  assert.equal(isSameLinkEndpoint(first, second), true);
  assert.equal(isSameLinkEndpoint(first, third), false);
});

test("getLinkType falls back to item links when type is omitted", () => {
  assert.equal(getLinkType(undefined), LINK_TYPE_ITEM);
  assert.equal(getLinkType(LINK_TYPE_SHAPE), LINK_TYPE_SHAPE);
});

test("isLinkBetweenEndpoints matches both link directions", () => {
  const first = makeLinkEndpoint(LINK_TYPE_ITEM, "item-1");
  const second = makeLinkEndpoint(LINK_TYPE_SHAPE, "shape-1");
  const link = {
    fromId: "item-1",
    fromType: LINK_TYPE_ITEM,
    toId: "shape-1",
    toType: LINK_TYPE_SHAPE,
  };

  assert.equal(isLinkBetweenEndpoints(link, first, second), true);
  assert.equal(isLinkBetweenEndpoints(link, second, first), true);
  assert.equal(
    isLinkBetweenEndpoints(link, first, makeLinkEndpoint(LINK_TYPE_ITEM, "item-2")),
    false
  );
});

test("linkHasEndpoint detects link membership on either side", () => {
  const link = {
    fromId: "item-1",
    toId: "shape-1",
    toType: LINK_TYPE_SHAPE,
  };

  assert.equal(linkHasEndpoint(link, LINK_TYPE_ITEM, "item-1"), true);
  assert.equal(linkHasEndpoint(link, LINK_TYPE_SHAPE, "shape-1"), true);
  assert.equal(linkHasEndpoint(link, LINK_TYPE_ITEM, "item-2"), false);
});
