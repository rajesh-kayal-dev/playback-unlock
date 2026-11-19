export const PLAYBACK_LIMITS = {
  minSpeed: 0.25,
  maxSpeed: 10,
  minSpeedStep: 0.05,
  maxSpeedStep: 1,
  minSeekIntervalSeconds: 1,
  maxSeekIntervalSeconds: 120,
} as const;

export const SPEED_RANGE_MESSAGE = `Enter a speed from ${PLAYBACK_LIMITS.minSpeed}× to ${PLAYBACK_LIMITS.maxSpeed}×.`;

export function inRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export function isSpeed(value: unknown): value is number {
  return inRange(value, PLAYBACK_LIMITS.minSpeed, PLAYBACK_LIMITS.maxSpeed);
}
