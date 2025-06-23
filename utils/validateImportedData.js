export function validateImportedData(data) {
  if (!Array.isArray(data)) {
    return false;
  }
  const colorRegex = /^#[0-9a-f]{6}$/i;
  const requiredKeys = ["statusName", "backgroundColor"];
  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      return false;
    }
    for (const key of requiredKeys) {
      if (!(key in item)) {
        return false;
      }
    }
    if (typeof item.statusName !== "string" || item.statusName.trim() === "") {
      return false;
    }
    if (typeof item.backgroundColor !== "string" || !colorRegex.test(item.backgroundColor)) {
      return false;
    }
    if (
      "textColor" in item &&
      (typeof item.textColor !== "string" || !colorRegex.test(item.textColor)) &&
      item.textColor !== ""
    ) {
      return false;
    }
    if ("animationClass" in item && item.animationClass === "ribbon") {
      if (
        !("primaryColor" in item) ||
        typeof item.primaryColor !== "string" ||
        !colorRegex.test(item.primaryColor)
      ) {
        return false;
      }
      if (
        !("secondaryColor" in item) ||
        typeof item.secondaryColor !== "string" ||
        !colorRegex.test(item.secondaryColor)
      ) {
        return false;
      }
    }
  }
  return true;
}
