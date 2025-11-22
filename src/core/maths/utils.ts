const TO_DEGREES: number = 180 / Math.PI;
function toDegrees(radians: number): number {
  return radians * TO_DEGREES;
}

const TO_RADIANS: number = Math.PI / 180;
function toRadians(degrees: number): number {
  return degrees * TO_RADIANS;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(Math.min(value, max), min);
}

function roundUp(value: number, toMultipleOf: number): number {
  return value + toMultipleOf - (value % toMultipleOf);
}

export { toDegrees, toRadians, clamp, roundUp };
