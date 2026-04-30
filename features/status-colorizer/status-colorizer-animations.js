export const STATUS_ANIMATION_NONE = "";
export const STATUS_ANIMATION_RIBBON = "ribbon";

export const STATUS_ANIMATION_OPTIONS = [
  { value: STATUS_ANIMATION_NONE, labelKey: "statusAnimationNone" },
  { value: "ping", labelKey: "statusAnimationPing" },
  { value: "breathe", labelKey: "statusAnimationBreathe" },
  { value: "nudge", labelKey: "statusAnimationNudge" },
  { value: "shimmer", labelKey: "statusAnimationShimmer" },
  { value: "glow", labelKey: "statusAnimationGlow" },
  { value: "urgent", labelKey: "statusAnimationUrgent" },
  { value: "sweep", labelKey: "statusAnimationSweep" },
  { value: STATUS_ANIMATION_RIBBON, labelKey: "statusAnimationRibbon" },
];

const STATUS_ANIMATION_VALUES = new Set(
  STATUS_ANIMATION_OPTIONS.map((option) => option.value)
);

export function isRibbonAnimation(animationClass) {
  return animationClass === STATUS_ANIMATION_RIBBON;
}

export function isValidStatusAnimationClass(animationClass) {
  return (
    typeof animationClass === "string" &&
    STATUS_ANIMATION_VALUES.has(animationClass)
  );
}

export function normalizeStatusAnimationClass(animationClass) {
  return isValidStatusAnimationClass(animationClass) ? animationClass : "";
}
