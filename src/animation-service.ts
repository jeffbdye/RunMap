import { Map, GeoJSONSource, LineLayer } from 'mapbox-gl';
import { RunSegment, CurrentRun } from './current-run';
import { FeatureCollection, LineString } from 'geojson';

/**
 * Responsible for display of the layers for the lines for the run's route.
 * Handles requests to add a new segment to the map and animating along
 * the length of the line. Requests while drawing will complete the
 * current animation, then kick off the next segment.
 */
export class AnimationService {
  private map: Map;

  private animationFrame: number;
  private currentSegment: RunSegment;
  private counter = 0;

  private activeGeo: FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: [],
      geometry: {
        type: 'LineString',
        coordinates: [
        ]
      }
    }]
  };

  constructor(map: Map) {
    this.map = map;
  }

  /**
   * Called upon map style load in order to add all of the
   * current run's segments back as visible layers.
   * @param run The page's CurrentRun with segments to add to the map
   */
  public readdRunToMap(run: CurrentRun) {
    if (run) {
      for (let segment of run.segments) {
        const layer = this.getLineLayer(segment.id, segment.geometry.coordinates);
        this.map.addLayer(layer);
      }
    }
  }

  /**
   * Queue up animating the addition of a new segment to the map.
   * @param segment The RunSegment to add to the map
   */
  public animateSegment(segment: RunSegment) {
    // finish current animation if necessary
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      for (; this.counter < this.currentSegment.geometry.coordinates.length; this.counter++) {
        const currentCoordinates = this.currentSegment.geometry.coordinates[this.counter];
        this.setLayerGeojson(this.currentSegment.id, currentCoordinates);
      }
    }
    // initialize
    this.currentSegment = segment;
    this.activeGeo.features[0].geometry.coordinates = [this.currentSegment.geometry.coordinates[0]];
    // add new layer
    let layer = this.getLineLayer(segment.id);
    this.map.addLayer(layer);
    // kick off animation loop
    this.counter = 0;
    this.animationFrame = requestAnimationFrame(() => this.animationCallback());
  }

  /**
   * Unbelievably naive way to animate:
   * Add each coordinate from the segment to the layer at the mercy of `requestAnimationFrame`
   */
  private animationCallback() {
    if (this.counter === this.currentSegment.geometry.coordinates.length) {
      this.animationFrame = undefined;
    } else {
      const nextCoordinate = this.currentSegment.geometry.coordinates[this.counter];
      this.setLayerGeojson(this.currentSegment.id, nextCoordinate);
      this.counter++;
      this.animationFrame = requestAnimationFrame(() => this.animationCallback());
    }
  }

  private setLayerGeojson(id: string, coordinates: number[]) {
    this.activeGeo.features[0].geometry.coordinates.push(coordinates);
    const source = this.map.getSource(id) as GeoJSONSource;
    source.setData(this.activeGeo);
  }

  private getLineLayer(id: string, coordinates: number[][] = []): LineLayer {
    return {
      id: id,
      type: 'line',
      source: { // mapboxgl.GeoJSONSourceOptions
        type: 'geojson',
        data: { // GeoJSON.Feature<GeoJSON.Geometry>
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
        visibility: 'visible'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': .75
      }
    } as LineLayer;
  }
}
