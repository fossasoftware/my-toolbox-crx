(function attachStatusColorizerLogic(global) {
  if (global.MyToolboxStatusColorizerLogic) {
    return;
  }

  function normalizeStatusName(statusName) {
    return typeof statusName === "string" ? statusName.trim().toLowerCase() : "";
  }

  function getStatusAliases(setting) {
    return Array.isArray(setting?.aliases)
      ? setting.aliases
      : Array.isArray(setting?.statusAliases)
        ? setting.statusAliases
        : [];
  }

  function normalizeStatusSetting(setting) {
    const backgroundColor =
      typeof setting?.backgroundColor === "string" ? setting.backgroundColor : "";
    const primaryColor =
      typeof setting?.primaryColor === "string" && setting.primaryColor
        ? setting.primaryColor
        : backgroundColor;
    const secondaryColor =
      typeof setting?.secondaryColor === "string" && setting.secondaryColor
        ? setting.secondaryColor
        : primaryColor || backgroundColor;

    return {
      statusName: normalizeStatusName(setting?.statusName),
      backgroundColor,
      textColor: typeof setting?.textColor === "string" ? setting.textColor : "",
      animationClass: setting?.animationClass === "ribbon" ? "ribbon" : "",
      primaryColor,
      secondaryColor,
    };
  }

  function buildStatusLookup(settings) {
    const lookup = new Map();

    settings.forEach((setting) => {
      if (!setting) {
        return;
      }

      const normalizedSetting = normalizeStatusSetting(setting);
      const variants = [
        normalizedSetting.statusName,
        ...getStatusAliases(setting).map(normalizeStatusName),
      ].filter(Boolean);

      variants.forEach((variant) => {
        if (!lookup.has(variant)) {
          lookup.set(variant, normalizedSetting);
        }
      });
    });

    return lookup;
  }

  function findStatusSettingFromLookup(lookup, statusText) {
    const normalizedStatus = normalizeStatusName(statusText);
    if (!normalizedStatus || !(lookup instanceof Map)) {
      return null;
    }

    return lookup.get(normalizedStatus) || null;
  }

  function getStatusRibbonBackground(statusSetting) {
    return `repeating-linear-gradient(45deg, ${statusSetting.primaryColor}, ${statusSetting.primaryColor} 10px, ${statusSetting.secondaryColor} 10px, ${statusSetting.secondaryColor} 20px)`;
  }

  global.MyToolboxStatusColorizerLogic = {
    buildStatusLookup,
    findStatusSettingFromLookup,
    getStatusAliases,
    getStatusRibbonBackground,
    normalizeStatusName,
    normalizeStatusSetting,
  };
})(globalThis);
