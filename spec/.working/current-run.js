"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var RunStart = /** @class */ (function () {
    function RunStart(lngLat, point) {
        this.lngLat = lngLat;
        this.point = point;
    }
    RunStart.prototype.setMarker = function (newMarker) {
        if (this.marker) {
            this.marker.remove();
        }
        this.marker = newMarker;
    };
    return RunStart;
}());
exports.RunStart = RunStart;
var RunSegment = /** @class */ (function (_super) {
    __extends(RunSegment, _super);
    function RunSegment(id, lngLat, point) {
        var _this = _super.call(this, lngLat, point) || this;
        _this.id = id;
        _this.length = 0;
        return _this;
    }
    RunSegment.prototype.setResponse = function (apiResponse) {
        this.apiResponse = apiResponse;
        this.directionsResponse = apiResponse.body;
        this.length = this.directionsResponse.routes[0].distance;
    };
    return RunSegment;
}(RunStart));
exports.RunSegment = RunSegment;
var CurrentRun = /** @class */ (function () {
    function CurrentRun(start) {
        this.start = start;
        this.segments = [];
        this.length = 0;
    }
    CurrentRun.prototype.getLastPosition = function () {
        if (this.segments.length > 0) {
            return this.segments[this.segments.length - 1].lngLat;
        }
        else {
            return this.start.lngLat;
        }
    };
    CurrentRun.prototype.addSegment = function (newSegment) {
        this.segments.push(newSegment);
    };
    CurrentRun.prototype.segmentDistanceUpdated = function (segment, apiResponse, newMarker) {
        if (segment.length > 0) {
            this.length -= segment.length;
        }
        segment.setResponse(apiResponse);
        segment.setMarker(newMarker);
        this.length += segment.length;
    };
    // last segment of the run or undefined if no segments
    CurrentRun.prototype.removeLastPoint = function () {
        var toRemove = undefined;
        if (this.segments.length > 0) {
            toRemove = this.segments.pop();
            this.length -= toRemove.directionsResponse.routes[0].distance;
            toRemove.marker.remove();
        }
        return toRemove;
    };
    CurrentRun.prototype.getFormattedDistance = function () {
        var formatted = '';
        if (this.length < 1000) {
            formatted = Math.round(this.length) + "m";
        }
        else {
            var km = this.length / 1000;
            formatted = km.toFixed(2) + "km";
        }
        return formatted;
    };
    return CurrentRun;
}());
exports.CurrentRun = CurrentRun;
