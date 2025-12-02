/** Pads array to target length with fill value */
export const padArray = <T>(arr: T[], length: number, fill: T): T[] => {
  const result = arr.slice(0, length);
  while (result.length < length) result.push(fill);
  return result;
};

/** Clamps value between min and max */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
