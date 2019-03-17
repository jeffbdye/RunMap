export class DistanceResult {
  public distance: number;
  public units: string;
  public formatted: string;
  public roundedDistance: string;
}

export function getFormattedDistance(lengthInMeters: number, useMetric: boolean) {
  let rounded = '';
  let units = '';
  let distance = useMetric ? lengthInMeters : lengthInMeters * .000621371;
  if (useMetric) {
    if (distance < 1000) {
      rounded = '' + Math.round(distance);
      units = 'm';
    } else {
      let km = distance / 1000;
      rounded = km.toFixed(2);
      units = 'km';
    }
  } else {
    rounded = distance.toFixed(2);
    units = 'mi';
  }

  return {
    distance: distance,
    roundedDistance: rounded,
    units: units,
    formatted: `${rounded}${units}`
  } as DistanceResult;
}
