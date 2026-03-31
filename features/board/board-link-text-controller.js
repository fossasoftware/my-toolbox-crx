import {
  createLinkLabelElement as createRenderedLinkLabelElement,
  getLinkEditorBounds as getLinkTextEditorBounds,
  getLinkLabelBounds as getLinkTextLabelBounds,
  getLinkTextColor as resolveLinkTextColor,
  getLinkTextSize as resolveLinkTextSize,
} from "./board-link-text.js";
import { getLinkSvgZoom as getSafeLinkSvgZoom } from "./board-link-svg.js";

export function createBoardLinkTextController({
  getCtx,
  getDefaultTextSize,
  getLinkDefaultColor,
  getLinkEditingId,
  getLinkEditor,
  getShapeFontFamily,
  getWrapTextLines,
  getZoom,
  linkGap,
}) {
  function getLinkTextColor(link) {
    return resolveLinkTextColor(link, getLinkDefaultColor());
  }

  function getLinkTextSize(link) {
    return resolveLinkTextSize(link, getDefaultTextSize());
  }

  function createLinkLabelElement(link, from, to) {
    return createRenderedLinkLabelElement({
      link,
      from,
      to,
      ctx: getCtx(),
      fontFamily: getShapeFontFamily(),
      wrapTextLines: getWrapTextLines(),
      zoom: getSafeLinkSvgZoom(getZoom()),
      defaultColor: getLinkDefaultColor(),
      defaultTextSize: getDefaultTextSize(),
      linkGap,
    });
  }

  function getLinkLabelBounds(link, from, to) {
    return getLinkTextLabelBounds({
      link,
      from,
      to,
      ctx: getCtx(),
      fontFamily: getShapeFontFamily(),
      wrapTextLines: getWrapTextLines(),
      defaultTextSize: getDefaultTextSize(),
      linkGap,
    });
  }

  function getLinkEditorBounds(link, from, to) {
    return getLinkTextEditorBounds({
      link,
      from,
      to,
      ctx: getCtx(),
      fontFamily: getShapeFontFamily(),
      wrapTextLines: getWrapTextLines(),
      editorText:
        (getLinkEditingId() === link?.id && getLinkEditor()?.textContent) ||
        link?.text ||
        "",
      defaultTextSize: getDefaultTextSize(),
      linkGap,
    });
  }

  return {
    createLinkLabelElement,
    getLinkEditorBounds,
    getLinkLabelBounds,
    getLinkTextColor,
    getLinkTextSize,
  };
}
