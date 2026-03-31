export const BOOKMARKS_KEY = "bookmarks";
export const BOOKMARK_ICONS_KEY = "bookmarkIcons";
export const BOOKMARK_SETTINGS_KEY = "bookmarkSettings";
export const BOOKMARKS_BACKUP_KIND = "my-toolbox-bookmarks-backup";
export const BOOKMARKS_BACKUP_VERSION = 1;

export const BOOKMARK_SETTINGS_DEFAULTS = {
  iconSize: 48,
  pinnedIconSize: 32,
  pinnedTitleDisplay: "hidden",
};

export const BOOKMARK_ICON_SIZE_LIMITS = { min: 36, max: 50 };
export const BOOKMARK_PINNED_ICON_SIZE_LIMITS = { min: 16, max: 40 };
export const BOOKMARK_PINNED_TITLE_DISPLAY_OPTIONS = new Set(["hidden", "hover"]);
