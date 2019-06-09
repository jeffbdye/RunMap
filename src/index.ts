import * as mapboxgl from 'mapbox-gl';
import { Map, Marker, MapMouseEvent, NavigationControl, GeolocateControl, LngLat, Layer } from 'mapbox-gl';
import { v4 as uuid } from 'uuid';
import { LineString } from 'geojson';
import { CurrentRun, RunStart, RunSegment } from './current-run';
import { getFormattedDistance } from './distance-formatter';
import { MapFocus } from './map-focus';
import { ps } from './appsettings.secrets';
import { MapiResponse, Directions, DirectionsService, DirectionsResponse, Route } from '../custom-typings/mapbox__mapbox-sdk';
import { length, lineString } from '@turf/turf';
const directionsFactory: Directions = require('@mapbox/mapbox-sdk/services/directions'); // TODO: determine proper typings to allow `import` to work

const LAST_FOCUS_KEY = 'runmap-last_focus';
const STORAGE_NOTICE_KEY = 'runmap-storage_notice';
const USE_METRIC_KEY = 'runmap-use_metric';
const FOLLOW_ROADS_KEY = 'runmap-follow_roads';
const mbk = atob(ps);

const initialFocus = loadLastOrDefaultFocus();
(mapboxgl as any)['a' + 'cce' + 'ssTo' + 'ken'] = mbk;
let map = new Map({
  pitchWithRotate: false,
  center: [initialFocus.lng, initialFocus.lat],
  zoom: initialFocus.zoom,
  container: 'mapbox-container',
  style: 'mapbox://styles/mapbox/streets-v11'
});

let directionsService: DirectionsService = directionsFactory({ accessToken: mbk });
let currentRun: CurrentRun = undefined;

let lengthElement = document.getElementById('run-length');
let unitsElement = document.getElementById('run-units');
let menuElement = document.getElementById('menu-toggle');

let settingsElement = document.getElementById('settings-pane');
let closeElement = document.getElementById('close-settings');
let toggleUnitsElement = document.getElementById('toggle-units');
let followRoadsElement = document.getElementById('follow-roads');
let clearRunElement = document.getElementById('clear-run');

let removeLastElement = document.getElementById('remove-last');

let storageElement = document.getElementById('storage-notice');
let acceptStorageElement = document.getElementById('accept-storage');

let isWaiting = false;
let useMetric = loadBooleanPreference(USE_METRIC_KEY);
let followRoads = loadBooleanPreference(FOLLOW_ROADS_KEY);
let menuOpen = false;
setupUserControls();

map.on('load', () => {
  // only show on desktop useragents
  if (!/iPhone|iPad|iPod|Android/.test(window.navigator.userAgent)) {
    map.addControl(new NavigationControl(), 'bottom-right');
  }

  map.addControl(
    new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: false
    }).on('geolocate', (e: Position) => {
      stashCurrentFocus(e);
    }),
    'bottom-right');
});

// click or tap
map.on('click', (e: MapMouseEvent) => {
  if (menuOpen) {
    closeMenu();
  } else {
    if (!isWaiting) {
      setWaiting(true);
      addNewPoint(e);
    }
    const center = map.getCenter();
    const pos = {
      coords: {
        latitude: center.lat,
        longitude: center.lng
      }
    } as Position;
    stashCurrentFocus(pos);
  }
});

function addNewPoint(e: MapMouseEvent): void {
  if (currentRun === undefined) {
    let start = new RunStart(
      e.lngLat,
      e.point
    );
    start.setMarker(addMarker(e.lngLat, true));
    currentRun = new CurrentRun(start);
    removeLastElement.classList.remove('slide-out');
    removeLastElement.classList.add('slide-in');
    updateLengthElement();
  } else {
    let prev = currentRun.getLastPosition();
    if (followRoads) {
      segmentFromDirectionsResponse(prev, e);
    } else {
      // get route by straight line
      segmentFromStraightLine(prev, e);
    }
  }
  setWaiting(false);
}

function segmentFromDirectionsResponse(previousPoint: LngLat, e: MapMouseEvent) {
  directionsService.getDirections({
    profile: 'walking',
    waypoints: [
      {
        coordinates: [previousPoint.lng, previousPoint.lat]
      },
      {
        coordinates: [e.lngLat.lng, e.lngLat.lat]
      }
    ],
    geometries: 'geojson'
  }).send().then((res: MapiResponse) => {
    if (res.statusCode === 200) {
      const directionsResponse = res.body as DirectionsResponse;
      if (directionsResponse.routes.length <= 0) {
        alert('No routes found between the two points.');
        return;
      }

      const route = directionsResponse.routes[0];
      let newSegment = new RunSegment(
        uuid(),
        e.lngLat,
        e.point,
        route
      );

      const line = directionsResponse.routes[0].geometry as LineString;
      const coordinates = line.coordinates;
      map.addLayer(lineFromRoute(newSegment.id, coordinates));

      // use ending coordinate from route for the marker
      const segmentEnd = coordinates[coordinates.length - 1];
      const marker = addMarker(new LngLat(segmentEnd[0], segmentEnd[1]), false);
      currentRun.addSegment(newSegment, marker);
      updateLengthElement();
    } else {
      alert(`Non-successful status code when getting directions: ${JSON.stringify(res)}`);
    }
  }, err => {
    alert(`An error occurred: ${JSON.stringify(err)}`);
  });
}

function segmentFromStraightLine(previousPoint: LngLat, e: MapMouseEvent): void {
  const coordinates = [
    [previousPoint.lng, previousPoint.lat],
    [e.lngLat.lng, e.lngLat.lat]
  ];

  const distance = length(lineString(coordinates), { units: 'meters' });
  const route = { distance: distance, geometry: { type: 'LineString', coordinates: coordinates } } as Route;
  let newSegment = new RunSegment(
    uuid(),
    e.lngLat,
    e.point,
    route
  );
  map.addLayer(lineFromRoute(newSegment.id, coordinates));
  const marker = addMarker(e.lngLat, false);
  currentRun.addSegment(newSegment, marker);
  updateLengthElement();
}

function loadLastOrDefaultFocus(): MapFocus {
  let initialPosition = JSON.parse(localStorage.getItem(LAST_FOCUS_KEY)) as MapFocus;
  if (initialPosition === null) {
    initialPosition = {
      lng: -79.93775232392454,
      lat: 32.78183341484467,
      zoom: 14
    };
  }
  return initialPosition;
}

function stashCurrentFocus(pos: Position): void {
  const zoom = map.getZoom();
  const currentFocus = {
    lng: pos.coords.longitude,
    lat: pos.coords.latitude,
    zoom: zoom
  } as MapFocus;
  localStorage.setItem(LAST_FOCUS_KEY, JSON.stringify(currentFocus));
}

function loadBooleanPreference(settingKey: string): boolean {
  const setting = localStorage.getItem(settingKey);
  if (setting === null) {
    return true;
  } else {
    return setting === 'true';
  }
}

function saveBooleanPreference(settingKey: string, value: boolean): void {
  localStorage.setItem(settingKey, '' + value); // ugh
}

function setupUserControls(): void {
  if (!JSON.parse(localStorage.getItem(STORAGE_NOTICE_KEY))) {
    storageElement.style.display = 'block';
  }
  acceptStorageElement.onclick = hideStorageElement;

  menuElement.onclick = openMenu;
  closeElement.onclick = closeMenu;
  toggleUnitsElement.onclick = () => {
    toggleDistanceUnits();
    closeMenu();
  };

  setFollowRoads(followRoads);
  followRoadsElement.onclick = () => {
    followRoads = !followRoads;
    setFollowRoads(followRoads);
    closeMenu();
  };

  clearRunElement.onclick = () => {
    clearRun();
    closeMenu();
  };

  removeLastElement.onclick = removeLastSegment;

  lengthElement.onclick = toggleDistanceUnits;
  updateLengthElement();
}

function hideStorageElement(): void {
  storageElement.style.display = 'none';
  localStorage.setItem(STORAGE_NOTICE_KEY, JSON.stringify(true));
}

function toggleDistanceUnits(): void {
  useMetric = !useMetric;
  updateLengthElement();
  saveBooleanPreference(USE_METRIC_KEY, useMetric);
}

function removeLastSegment(): void {
  if (!currentRun) {
    return;
  }

  let lastPoint = currentRun.removeLastSegment();
  if (lastPoint) {
    map.setLayoutProperty(lastPoint.id, 'visibility', 'none');
    updateLengthElement();
  } else if (currentRun.start) {
    currentRun.start.marker.remove();
    updateLengthElement();
    currentRun = undefined;
    removeLastElement.classList.remove('slide-in');
    removeLastElement.classList.add('slide-out');
  }
}

function clearRun(): void {
  while (currentRun) {
    removeLastSegment();
  }
}

function lineFromRoute(id: string, route: number[][]): Layer {
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
          coordinates: route
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
  };
}

function updateLengthElement(): void {
  const distance = currentRun ? currentRun.distance : 0;
  const fd = getFormattedDistance(distance, useMetric);
  lengthElement.innerText = fd.roundedDistance;
  unitsElement.innerText = fd.units;
}

function addMarker(pos: LngLat, isStart: boolean): Marker {
  return new Marker({
    draggable: false,
    color: isStart ? '#00BD00' : undefined
  }).setLngLat(pos)
    .addTo(map);
}

function setWaiting(toWait: boolean): void {
  isWaiting = toWait;
  // TODO - loading spinner shown upon a delay?
}

function openMenu() {
  settingsElement.classList.add('settings-open');
  menuOpen = true;
}

function closeMenu() {
  settingsElement.classList.remove('settings-open');
  menuOpen = false;
}

function setFollowRoads(value: boolean) {
  if (value) {
    followRoadsElement.style.textDecoration = 'inherit';
  } else {
    followRoadsElement.style.textDecoration = 'line-through';
  }
  followRoads = value;
  saveBooleanPreference(FOLLOW_ROADS_KEY, value);
}
