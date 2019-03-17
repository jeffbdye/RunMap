import { CurrentRun, RunStart, RunSegment } from './current-run';
import { LngLat, Point, Marker } from 'mapbox-gl';
import { MapiResponse, DirectionsResponse } from '../custom-typings/@mapbox_mapbox-sdk';

describe('CurrentRun class', () => {
  it('should initialize with a run start', () => {
    let start = new RunStart({} as LngLat, {} as Point);
    let currentRun = new CurrentRun(start);
    expect(currentRun.length).toBe(0, 'No segments should be added with just a run start.');
  });

  it('should allow setting and updating a marker', () => {
    let start = new RunStart({} as LngLat, {} as Point);
    let marker = getMockMarker();
    spyOn(marker, 'remove').and.stub();
    start.setMarker(marker);
    expect(start.marker).toBe(marker, 'Run start marker was not set correctly.');

    start.setMarker({} as Marker);
    expect(marker.remove).toHaveBeenCalled();
  });

  it('updates with a new RunSegment', () => {
    let currentRun = new CurrentRun(new RunStart({} as LngLat, {} as Point));
    let firstSegment = new RunSegment('some-uuid', {} as LngLat, {} as Point);
    let marker = getMockMarker();
    let initialExpectedDistance = 500;
    let intialApiResponse = getMockMapiDirectionsResponse(initialExpectedDistance);

    currentRun.segmentDistanceUpdated(firstSegment, intialApiResponse as MapiResponse, marker);
    expect(currentRun.length).toBe(initialExpectedDistance, 'Distance was not set correctly from the distance response.');
    expect(firstSegment.marker).toBe(marker);

    let secondSegment = new RunSegment('different-uuid', {} as LngLat, {} as Point);
    let secondDistance = 1337;
    let secondResponse = getMockMapiDirectionsResponse(secondDistance);
    currentRun.segmentDistanceUpdated(secondSegment, secondResponse as MapiResponse, getMockMarker());
    expect(currentRun.length).toBe(initialExpectedDistance + secondDistance, 'Distance did not correctly add the incoming distance response value.');

    let updateDistance = 9001;
    let updateResponse = getMockMapiDirectionsResponse(updateDistance);
    currentRun.segmentDistanceUpdated(secondSegment, updateResponse as MapiResponse, {} as Marker);
    expect(currentRun.length).toBe(initialExpectedDistance + updateDistance, 'Distance was not correctly adjusted for the updated distance.');
  });

  it('gets the start\'s LngLat', () => {
    let expectedLngLat = { lng: 101, lat: 202 } as LngLat;
    let runStart = new RunStart(expectedLngLat, {} as Point);
    let currentRun = new CurrentRun(runStart);

    let lastPosition = currentRun.getLastPosition();
    expect(lastPosition).toEqual(expectedLngLat, 'Run start LngLat was not correctly retrieved.');
  });

  it('removes the last run segment', () => {
    let runStart = new RunStart({} as LngLat, {} as Point);
    let currentRun = new CurrentRun(runStart);

    let expectedLngLat = { lng: 101, lat: 202 } as LngLat;
    let segment = new RunSegment('some-uuid', expectedLngLat, {} as Point);
    let marker = getMockMarker();
    spyOn(marker, 'remove').and.stub();
    currentRun.addSegment(segment);
    currentRun.segmentDistanceUpdated(segment, getMockMapiDirectionsResponse(100) as MapiResponse, marker);

    let retrieved = currentRun.getLastPosition();
    expect(retrieved).toEqual(expectedLngLat, 'Segment LngLat was not correctly removed.');

    let removed = currentRun.removeLastPoint();
    expect(removed).toEqual(segment, 'The correct segment was not removed.');
    expect(currentRun.length).toBe(0, 'Run distance was not correctly updated.');
    expect(marker.remove).toHaveBeenCalled();
  });

  it('does not remove the run start', () => {
    let currentRun = new CurrentRun(new RunStart({} as LngLat, {} as Point));
    let removed = currentRun.removeLastPoint();
    expect(removed).toBeUndefined('Removing the last point should return undefined (no segments to remove).');
  });

  function getMockMapiDirectionsResponse(distance: number): Partial<MapiResponse> {
    const directionsResponse = {
      routes: [
        {
          distance: distance
        }
      ]
    } as DirectionsResponse;
    return {
      body: directionsResponse
    } as Partial<MapiResponse>;
  }

  function getMockMarker(): Marker {
    return {
      remove: () => { }
    } as Marker;
  }
});
