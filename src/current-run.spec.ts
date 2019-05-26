import { CurrentRun, RunStart, RunSegment } from './current-run';
import { LngLat, Point, Marker } from 'mapbox-gl';
import { Route } from '../custom-typings/@mapbox_mapbox-sdk';
// import { MapiResponse, DirectionsResponse } from '../custom-typings/@mapbox_mapbox-sdk';

describe('CurrentRun class', () => {
  it('should initialize with a run start', () => {
    let start = new RunStart({} as LngLat, {} as Point);
    let currentRun = new CurrentRun(start);
    expect(currentRun.distance).toBe(0, 'No segments should be added with just a run start.');
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

    let initialExpectedDistance = 500;
    let firstSegment = new RunSegment('some-uuid', {} as LngLat, {} as Point, getMockRoute(initialExpectedDistance));
    let marker = getMockMarker();
    currentRun.addSegment(firstSegment, marker);

    expect(currentRun.distance).toBe(initialExpectedDistance, 'Distance was not set correctly from the distance response.');
    expect(firstSegment.marker).toBe(marker);

    let secondDistance = 1337;
    let secondSegment = new RunSegment('different-uuid', {} as LngLat, {} as Point, getMockRoute(secondDistance));
    currentRun.addSegment(secondSegment, getMockMarker());
    expect(currentRun.distance).toBe(initialExpectedDistance + secondDistance, 'Distance did not correctly add the incoming distance response value.');
  });

  it('gets the start\'s LngLat', () => {
    let expectedLngLat = { lng: 101, lat: 202 } as LngLat;
    let runStart = new RunStart(expectedLngLat, {} as Point);
    let currentRun = new CurrentRun(runStart);

    let lastPosition = currentRun.getLastPosition();
    expect(lastPosition).toEqual(expectedLngLat, 'Run start LngLat was not correctly retrieved.');
  });

  it('removes the last run segment and decrements distance correctly', () => {
    let runStart = new RunStart({} as LngLat, {} as Point);
    let currentRun = new CurrentRun(runStart);

    let expectedLngLat = { lng: 101, lat: 202 } as LngLat;
    let expectedDistance = 100;
    let segment = new RunSegment('some-uuid', expectedLngLat, {} as Point, getMockRoute(expectedDistance));
    let marker = getMockMarker();
    spyOn(marker, 'remove').and.stub();
    currentRun.addSegment(segment, marker);
    expect(currentRun.distance).toBe(expectedDistance, 'The run distance was not incremented by the segment length');

    let retrieved = currentRun.getLastPosition();
    expect(retrieved).toEqual(expectedLngLat, 'Segment LngLat was not correctly removed.');

    let removed = currentRun.removeLastSegment();
    expect(removed).toEqual(segment, 'The correct segment was not removed.');
    expect(currentRun.distance).toBe(0, 'Run distance was not correctly updated.');
    expect(marker.remove).toHaveBeenCalled();

    let notRemoved = currentRun.removeLastSegment();
    expect(notRemoved).toBeFalsy('Attempting to remove when there are no other segments present should return undefined.');
  });

  it('does not remove the run start', () => {
    let currentRun = new CurrentRun(new RunStart({} as LngLat, {} as Point));
    let removed = currentRun.removeLastSegment();
    expect(removed).toBeUndefined('Removing the last point should return undefined (no segments to remove).');
  });

  function getMockMarker(): Marker {
    return {
      remove: () => { }
    } as Marker;
  }

  function getMockRoute(distance: number = 5): Route {
    return {
      distance: distance
    } as Route;
  }
});
