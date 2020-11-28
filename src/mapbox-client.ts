import { SdkConfig } from '@mapbox/mapbox-sdk/lib/classes/mapi-client';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
import DirectionsFactory, { DirectionsService, DirectionsResponse } from '@mapbox/mapbox-sdk/services/directions';
import { LngLat, Point } from 'mapbox-gl';
import { LineString } from '@turf/turf';
import uuid from 'uuid';
import { RunSegment } from './current-run';

export class MapboxClient {
  private directionsService: DirectionsService;

  constructor(mbk: string) {
    let cfg = {} as SdkConfig;
    ((cfg as any)[atob('YWNjZXNzVG9rZW4=')] = mbk);
    this.directionsService = DirectionsFactory(cfg);
  }

  public getSegmentFromDirectionsService(previousLngLat: LngLat, nextLngLat: LngLat, nextPoint: Point): Promise<RunSegment> {
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
          nextPoint,
          route.distance,
          route.geometry as LineString
        );
      } else {
        throw new Error(`Non-successful status code when getting directions: ${JSON.stringify(res)}`);
      }
    }, err => {
      throw new Error(`An error occurred: ${JSON.stringify(err)}`);
    });
  }
}
