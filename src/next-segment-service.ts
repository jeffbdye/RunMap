import { SdkConfig } from '@mapbox/mapbox-sdk/lib/classes/mapi-client';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
import DirectionsFactory, { DirectionsService, DirectionsResponse } from '@mapbox/mapbox-sdk/services/directions';
import { LngLat } from 'mapbox-gl';
import { length, lineString, LineString } from '@turf/turf';
import uuid from 'uuid';
import { RunSegment } from './current-run';

/**
 * Abstracts out the two means of adding a new segment to a run:
 * - from the mapbox directions service
 * - as a straight line between the previous and next points
 */
export class NextSegmentService {
  private directionsService: DirectionsService;

  constructor(mbk: string) {
    let cfg = {} as SdkConfig;
    ((cfg as any)[atob('YWNjZXNzVG9rZW4=')] = mbk);
    this.directionsService = DirectionsFactory(cfg);
  }

  /**
   * Get the next segment for the run using a mapbox directions service request
   * @param previousLngLat The last LngLat in the run, the starting point for the next segment
   * @param nextLngLat The next LngLat in the run, the ending point for the next segment
   */
  public getSegmentFromDirectionsService(previousLngLat: LngLat, nextLngLat: LngLat): Promise<RunSegment> {
    return this.directionsService.getDirections({
      profile: 'walking',
      waypoints: [
        {
          coordinates: [previousLngLat.lng, previousLngLat.lat]
        },
        {
          coordinates: [nextLngLat.lng, nextLngLat.lat]
        }
      ],
      geometries: 'geojson'
    }).send().then((res: MapiResponse) => {
      if (res.statusCode === 200) {
        const directionsResponse = res.body as DirectionsResponse;
        if (directionsResponse.routes.length <= 0) {
          throw new Error('No routes found between the two points.');
        }

        const route = directionsResponse.routes[0];
        return new RunSegment(
          uuid(),
          nextLngLat,
          route.distance,
          route.geometry as LineString,
          true
        );
      } else {
        throw new Error(`Non-successful status code when getting directions: ${JSON.stringify(res)}`);
      }
    }, err => {
      throw new Error(`An error occurred: ${JSON.stringify(err)}`);
    });
  }

  /**
   * Get the next segment as a straight line between the previous and next points
   * @param previousLngLat The previous point in the run
   * @param nextLngLat The next point in the run
   */
  public segmentFromStraightLine(previousLngLat: LngLat, nextLngLat: LngLat): RunSegment {
    const lineCoordinates = [
      [previousLngLat.lng, previousLngLat.lat],
      [nextLngLat.lng, nextLngLat.lat]
    ];

    const distance = length(lineString(lineCoordinates), { units: 'meters' });
    const line = { type: 'LineString', coordinates: lineCoordinates } as LineString;
    return new RunSegment(
      uuid(),
      nextLngLat,
      distance,
      line,
      false
    );
  }
}
