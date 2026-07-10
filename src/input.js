export function directionFromSwipe(start, end, threshold = 24) {
  if (!start || !end || !Number.isFinite(threshold) || threshold < 0) return null;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const horizontalDistance = Math.abs(dx);
  const verticalDistance = Math.abs(dy);

  if (Math.max(horizontalDistance, verticalDistance) < threshold) return null;
  if (horizontalDistance > verticalDistance) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}
