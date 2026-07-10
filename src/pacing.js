export const MOBILE_MOTION_SCALE = 0.75;

export function motionScaleForWindow(targetWindow) {
  if (!targetWindow || typeof targetWindow.matchMedia !== "function") return 1;
  const touchFirst = targetWindow.matchMedia("(hover: none) and (pointer: coarse)").matches;
  return touchFirst ? MOBILE_MOTION_SCALE : 1;
}
