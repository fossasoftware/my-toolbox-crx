export function bindModalCloseButton(button, modal, errorMessage) {
  if (button && modal) {
    button.addEventListener("click", () => modal.classList.remove("active"));
    return;
  }

  console.error(errorMessage);
}

export function bindBackdropClose(modals) {
  modals.forEach((modal) => {
    if (!modal) return;
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.remove("active");
      }
    });
  });
}
