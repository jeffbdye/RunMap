import { LngLat, Marker } from 'mapbox-gl';
import { LineString } from 'geojson';

export class RunStart {
  public lngLat: LngLat;
  public marker: Marker;

  constructor(lngLat: LngLat) {
    this.lngLat = lngLat;
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
  public distance: number; // in meters
  public geometry: LineString;

  constructor(id: string, lngLat: LngLat, distance: number, geometry: LineString) {
    super(lngLat);
    this.id = id;
    this.distance = distance;
    this.geometry = geometry;
  }
}

export class CurrentRun {
  public start: RunStart;
  public segments: RunSegment[];
  public distance: number; // sum of distances in meters

  constructor(start: RunStart) {
    this.start = start;
    this.segments = [];
    this.distance = 0;
  }

  public getLastPosition(): LngLat {
    if (this.segments.length > 0) {
      return this.segments[this.segments.length - 1].lngLat;
    } else {
      return this.start.lngLat;
    }
  }

  public addSegment(segment: RunSegment, marker: Marker): void {
    this.segments.push(segment);
    segment.setMarker(marker);
    this.distance += segment.distance;
  }

  // last segment of the run or undefined if no segments
  public removeLastSegment(): RunSegment {
    let toRemove: RunSegment = undefined;
    if (this.segments.length > 0) {
      toRemove = this.segments.pop();
      this.distance -= toRemove.distance;
      if (this.distance < 0) { // thanks javascript
        this.distance = 0;
      }
      toRemove.marker.remove();
    }
    return toRemove;
  }
}
