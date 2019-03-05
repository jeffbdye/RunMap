import { LngLat, Point, Marker } from 'mapbox-gl';
import { MapiResponse, DirectionsResponse } from '../custom-typings/@mapbox_mapbox-sdk';

export class RunStart {
  public lngLat: LngLat;
  public point: Point;
  public marker: Marker;

  constructor(lngLat: LngLat, point: Point) {
    this.lngLat = lngLat;
    this.point = point;
  }

  public setMarker(newMarker: Marker) {
    if (this.marker) {
      this.marker.remove();
    }

    this.marker = newMarker;
  }
}

export class RunSegment extends RunStart {
  public id: string;
  public apiResponse: MapiResponse;
  public directionsResponse: DirectionsResponse;
  public length: number; // length in meters

  constructor(id: string, lngLat: LngLat, point: Point) {
    super(lngLat, point);
    this.id = id;
    this.length = 0;
  }

  public setResponse(apiResponse: MapiResponse): void {
    this.apiResponse = apiResponse;
    this.directionsResponse = apiResponse.body as DirectionsResponse;
    this.length = this.directionsResponse.routes[0].distance;
  }
}

export class CurrentRun {
  public start: RunStart;
  public segments: RunSegment[];
  public length: number; // sum of distances in meters

  constructor(start: RunStart) {
    this.start = start;
    this.segments = [];
    this.length = 0;
  }

  public getLastPosition(): LngLat {
    if (this.segments.length > 0) {
      return this.segments[this.segments.length - 1].lngLat;
    } else {
      return this.start.lngLat;
    }
  }

  public addSegment(newSegment: RunSegment): void {
    this.segments.push(newSegment);
  }

  public segmentDistanceUpdated(segment: RunSegment, apiResponse: MapiResponse, newMarker: Marker): void {
    if (segment.length > 0) {
      this.length -= segment.length;
    }
    segment.setResponse(apiResponse);
    segment.setMarker(newMarker);
    this.length += segment.length;
  }

  // last segment of the run or undefined if no segments
  public removeLastPoint(): RunSegment {
    let toRemove: RunSegment = undefined;
    if (this.segments.length > 0) {
      toRemove = this.segments.pop();
      this.length -= toRemove.directionsResponse.routes[0].distance;
      toRemove.marker.remove();
    }
    return toRemove;
  }

  public getFormattedDistance(): string {
    let formatted = '';
    if (this.length < 1000) {
      formatted = `${Math.round(this.length)}m`;
    } else {
      let km = this.length / 1000;
      formatted = `${km.toFixed(2)}km`;
    }
    return formatted;
  }
}
