export function bindShareExtensionButton({ button, getText, showToast }) {
  if (!button) return;

  const shareUrl =
    "https://chromewebstore.google.com/detail/my-toolbox/nppomdgnebmeeilmhbkdnidaohhblcbi";

  button.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: getText("appName"),
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("toastShareCopied");
    } catch (error) {
      console.error("Share copy failed:", error);
      showToast("toastErrorGeneric");
    }
  });
}
