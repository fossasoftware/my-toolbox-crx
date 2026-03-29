const DEFAULT_LANGUAGE = "en";
const supportedLanguages = new Set(["en", "uk"]);

let currentLanguage = DEFAULT_LANGUAGE;
let currentMessages = {};

function normalizeLanguage(language) {
  return supportedLanguages.has(language) ? language : DEFAULT_LANGUAGE;
}

function toSubstitutionsArray(substitutions) {
  if (substitutions == null) {
    return [];
  }
  return Array.isArray(substitutions) ? substitutions : [substitutions];
}

function replaceNamedPlaceholders(message, placeholders, substitutions) {
  Object.entries(placeholders).forEach(([name, value]) => {
    if (!value || typeof value.content !== "string") {
      return;
    }

    const rawIndex = Number.parseInt(value.content.slice(1), 10);
    const substitutionIndex = rawIndex - 1;
    if (
      !Number.isInteger(substitutionIndex) ||
      substitutionIndex < 0 ||
      substitutionIndex >= substitutions.length
    ) {
      return;
    }

    try {
      message = message.replace(
        new RegExp(`\\$${name.toUpperCase()}\\$`, "g"),
        String(substitutions[substitutionIndex])
      );
    } catch (error) {
      console.error(`Could not replace i18n placeholder "${name}"`, error);
    }
  });

  return message;
}

function replaceIndexedPlaceholders(message, substitutions) {
  substitutions.forEach((value, index) => {
    message = message.replace(
      new RegExp(`\\$${index + 1}`, "g"),
      String(value)
    );
  });
  return message;
}

async function fetchMessages(language) {
  const response = await fetch(
    chrome.runtime.getURL(`_locales/${language}/messages.json`)
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function loadMessages(language) {
  const nextLanguage = normalizeLanguage(language);

  try {
    const messages = await fetchMessages(nextLanguage);
    currentLanguage = nextLanguage;
    currentMessages = messages;
    return messages;
  } catch (error) {
    console.error(`Could not load messages for language "${nextLanguage}"`, error);
    if (nextLanguage !== DEFAULT_LANGUAGE) {
      return loadMessages(DEFAULT_LANGUAGE);
    }
    currentLanguage = DEFAULT_LANGUAGE;
    currentMessages = {};
    return {};
  }
}

export function getText(key, substitutions = null) {
  const messageEntry = currentMessages[key];
  if (!messageEntry || typeof messageEntry.message !== "string") {
    return key;
  }

  const values = toSubstitutionsArray(substitutions);
  let message = messageEntry.message;

  if (messageEntry.placeholders && values.length > 0) {
    message = replaceNamedPlaceholders(
      message,
      messageEntry.placeholders,
      values
    );
  }

  if (values.length > 0) {
    message = replaceIndexedPlaceholders(message, values);
  }

  return message;
}

export function applyTextTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (!key) {
      return;
    }

    const translation = getText(key);
    if (element.hasAttribute("data-i18n-html")) {
      element.innerHTML = translation;
      return;
    }

    element.textContent = translation;
  });
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function hasLoadedMessages() {
  return Object.keys(currentMessages).length > 0;
}

export function isSupportedLanguage(language) {
  return supportedLanguages.has(language);
}

export function getDefaultLanguage() {
  return DEFAULT_LANGUAGE;
}
