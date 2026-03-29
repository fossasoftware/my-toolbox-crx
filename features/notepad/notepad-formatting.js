import {
  insertCodeTransform,
  insertLinkTransform,
  toggleCheckboxListTransform,
  toggleHeadingTransform,
  toggleLinePrefixTransform,
  wrapSelectionTransform,
} from "./notepad-markdown-transforms.js";

export function createNotepadFormattingController({
  commitNotepadValue,
  getNotepadArea,
}) {
  function applyTransform(transform) {
    const notepadArea = getNotepadArea();
    if (!notepadArea) return;
    const result = transform(notepadArea);
    if (!result) return;
    commitNotepadValue(
      result.nextValue,
      result.nextSelectionStart,
      result.nextSelectionEnd
    );
  }

  function applyMarkdownFormat(format) {
    switch (format) {
      case "bold":
        applyTransform((area) => wrapSelectionTransform(area, "**"));
        return;
      case "italic":
        applyTransform((area) => wrapSelectionTransform(area, "*"));
        return;
      case "link":
        applyTransform(insertLinkTransform);
        return;
      case "code":
        applyTransform(insertCodeTransform);
        return;
      case "list":
        applyTransform((area) => toggleLinePrefixTransform(area, "- "));
        return;
      case "quote":
        applyTransform((area) => toggleLinePrefixTransform(area, "> "));
        return;
      case "heading1":
        applyTransform((area) => toggleHeadingTransform(area, 1));
        return;
      case "heading2":
        applyTransform((area) => toggleHeadingTransform(area, 2));
        return;
      case "heading3":
        applyTransform((area) => toggleHeadingTransform(area, 3));
        return;
      case "checkbox":
        applyTransform(toggleCheckboxListTransform);
        return;
      default:
        return;
    }
  }

  return {
    applyMarkdownFormat,
  };
}
