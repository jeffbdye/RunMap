"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var current_run_1 = require("./current-run");
describe('CurrentRun class', function () {
    it('should initialize with a run start', function () {
        var start = new current_run_1.RunStart({}, {});
        var currentRun = new current_run_1.CurrentRun(start);
        expect(currentRun.length).toBe(0, 'No segments should be added with just a run start.');
        expect(currentRun.getFormattedDistance()).toBe('0m', 'Distance should be zero with just a run start.');
    });
    it('should allow setting and updating a marker', function () {
        var start = new current_run_1.RunStart({}, {});
        var marker = getMockMarker();
        spyOn(marker, 'remove').and.stub();
        start.setMarker(marker);
        expect(start.marker).toBe(marker, 'Run start marker was not set correctly.');
        start.setMarker({});
        expect(marker.remove).toHaveBeenCalled();
    });
    it('updates with a new RunSegment', function () {
        var currentRun = new current_run_1.CurrentRun(new current_run_1.RunStart({}, {}));
        var firstSegment = new current_run_1.RunSegment('some-uuid', {}, {});
        var marker = getMockMarker();
        var initialExpectedDistance = 500;
        var intialApiResponse = getMockMapiDirectionsResponse(initialExpectedDistance);
        currentRun.segmentDistanceUpdated(firstSegment, intialApiResponse, marker);
        expect(currentRun.length).toBe(initialExpectedDistance, 'Distance was not set correctly from the distance response.');
        expect(firstSegment.marker).toBe(marker);
        var secondSegment = new current_run_1.RunSegment('different-uuid', {}, {});
        var secondDistance = 1337;
        var secondResponse = getMockMapiDirectionsResponse(secondDistance);
        currentRun.segmentDistanceUpdated(secondSegment, secondResponse, getMockMarker());
        expect(currentRun.length).toBe(initialExpectedDistance + secondDistance, 'Distance did not correctly add the incoming distance response value.');
        var updateDistance = 9001;
        var updateResponse = getMockMapiDirectionsResponse(updateDistance);
        currentRun.segmentDistanceUpdated(secondSegment, updateResponse, {});
        expect(currentRun.length).toBe(initialExpectedDistance + updateDistance, 'Distance was not correctly adjusted for the updated distance.');
    });
    it('gets the start\'s LngLat', function () {
        var expectedLngLat = { lng: 101, lat: 202 };
        var runStart = new current_run_1.RunStart(expectedLngLat, {});
        var currentRun = new current_run_1.CurrentRun(runStart);
        var lastPosition = currentRun.getLastPosition();
        expect(lastPosition).toEqual(expectedLngLat, 'Run start LngLat was not correctly retrieved.');
    });
    it('removes the last run segment', function () {
        var runStart = new current_run_1.RunStart({}, {});
        var currentRun = new current_run_1.CurrentRun(runStart);
        var expectedLngLat = { lng: 101, lat: 202 };
        var segment = new current_run_1.RunSegment('some-uuid', expectedLngLat, {});
        var marker = getMockMarker();
        spyOn(marker, 'remove').and.stub();
        currentRun.addSegment(segment);
        currentRun.segmentDistanceUpdated(segment, getMockMapiDirectionsResponse(100), marker);
        var retrieved = currentRun.getLastPosition();
        expect(retrieved).toEqual(expectedLngLat, 'Segment LngLat was not correctly removed.');
        var removed = currentRun.removeLastPoint();
        expect(removed).toEqual(segment, 'The correct segment was not removed.');
        expect(currentRun.length).toBe(0, 'Run distance was not correctly updated.');
        expect(marker.remove).toHaveBeenCalled();
    });
    it('does not remove the run start', function () {
        var currentRun = new current_run_1.CurrentRun(new current_run_1.RunStart({}, {}));
        var removed = currentRun.removeLastPoint();
        expect(removed).toBeUndefined('Removing the last point should return undefined (no segments to remove).');
    });
    function getMockMapiDirectionsResponse(distance) {
        var directionsResponse = {
            routes: [
                {
                    distance: distance
                }
            ]
        };
        return {
            body: directionsResponse
        };
    }
    function getMockMarker() {
        return {
            remove: function () { }
        };
    }
});
