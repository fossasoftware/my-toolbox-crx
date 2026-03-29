import { getText } from "./i18n.js";

let toastTimeout;
let toastHideTimeout;
let toastClickHandler;
let toastActionHandler;
let toastHoverEnterHandler;
let toastHoverLeaveHandler;
let toastOnHide;
let toastStartTime = 0;
let toastRemaining = 0;

const TOAST_HIDE_DURATION = 240;
const TOAST_VISIBLE_DURATION = 2600;

export function showToast(
  messageKey = "toastSaved",
  substitutions = null,
  options = null
) {
  const toast = document.getElementById("toast");
  if (!toast) {
    return;
  }

  if (toastOnHide) {
    toastOnHide();
    toastOnHide = null;
  }

  if (toastClickHandler) {
    toast.removeEventListener("click", toastClickHandler);
    toastClickHandler = null;
  }

  if (toastActionHandler) {
    const actionButton = toast.querySelector(".toast-action");
    if (actionButton) {
      actionButton.removeEventListener("click", toastActionHandler);
    }
    toastActionHandler = null;
  }

  if (toastHoverEnterHandler) {
    toast.removeEventListener("mouseenter", toastHoverEnterHandler);
    toast.removeEventListener("mouseleave", toastHoverLeaveHandler);
    toastHoverEnterHandler = null;
    toastHoverLeaveHandler = null;
  }

  const messageText = getText(messageKey, substitutions);
  const actionLabelKey = options?.actionLabelKey;
  const actionLabel = options?.actionLabel;
  const onAction = options?.onAction;
  toastOnHide = typeof options?.onHide === "function" ? options.onHide : null;

  if (onAction && (actionLabelKey || actionLabel)) {
    toast.textContent = "";
    const body = document.createElement("div");
    body.className = "toast-body";
    const message = document.createElement("span");
    message.className = "toast-message";
    message.textContent = messageText;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toast-action";
    const label = actionLabelKey ? getText(actionLabelKey) : actionLabel;
    button.textContent = label;
    button.setAttribute("aria-label", label);
    toastActionHandler = (event) => {
      event.preventDefault();
      const handler = onAction;
      if (toastActionHandler) {
        button.removeEventListener("click", toastActionHandler);
        toastActionHandler = null;
      }
      handler();
    };
    button.addEventListener("click", toastActionHandler);
    body.appendChild(message);
    body.appendChild(button);
    toast.appendChild(body);
  } else {
    toast.textContent = messageText;
  }

  if (options && typeof options.onClick === "function" && !onAction) {
    toastClickHandler = (event) => {
      event.preventDefault();
      const handler = options.onClick;
      toast.removeEventListener("click", toastClickHandler);
      toastClickHandler = null;
      handler();
    };
    toast.addEventListener("click", toastClickHandler);
  }

  clearTimeout(toastTimeout);
  clearTimeout(toastHideTimeout);
  toast.classList.remove("hide");
  toast.classList.add("show");
  const duration =
    options && Number.isFinite(options.duration)
      ? options.duration
      : TOAST_VISIBLE_DURATION;

  const startHideTimer = (delay) => {
    toastRemaining = delay;
    toastStartTime = Date.now();
    toastTimeout = setTimeout(() => {
      toast.classList.add("hide");
      toastHideTimeout = setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.remove("hide");

        if (toastClickHandler) {
          toast.removeEventListener("click", toastClickHandler);
          toastClickHandler = null;
        }

        if (toastActionHandler) {
          const actionButton = toast.querySelector(".toast-action");
          if (actionButton) {
            actionButton.removeEventListener("click", toastActionHandler);
          }
          toastActionHandler = null;
        }

        if (toastHoverEnterHandler) {
          toast.removeEventListener("mouseenter", toastHoverEnterHandler);
          toast.removeEventListener("mouseleave", toastHoverLeaveHandler);
          toastHoverEnterHandler = null;
          toastHoverLeaveHandler = null;
        }

        if (toastOnHide) {
          toastOnHide();
          toastOnHide = null;
        }
      }, TOAST_HIDE_DURATION);
    }, delay);
  };

  startHideTimer(duration);

  if (options?.pauseOnHover) {
    toastHoverEnterHandler = () => {
      if (!toastTimeout || toast.classList.contains("hide")) {
        return;
      }

      const elapsed = Date.now() - toastStartTime;
      toastRemaining = Math.max(0, toastRemaining - elapsed);
      clearTimeout(toastTimeout);
      toastTimeout = null;
    };

    toastHoverLeaveHandler = () => {
      if (toast.classList.contains("hide")) {
        return;
      }
      if (toastRemaining > 0) {
        startHideTimer(toastRemaining);
      }
    };

    toast.addEventListener("mouseenter", toastHoverEnterHandler);
    toast.addEventListener("mouseleave", toastHoverLeaveHandler);
  }
}
