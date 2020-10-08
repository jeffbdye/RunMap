import mapboxgl, { Map, Marker, MapMouseEvent, NavigationControl, GeolocateControl, LngLat } from 'mapbox-gl';
import { v4 as uuid } from 'uuid';
import { LineString } from 'geojson';
import { length, lineString } from '@turf/turf';
import { SdkConfig } from '@mapbox/mapbox-sdk/lib/classes/mapi-client';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
import DirectionsFactory, { DirectionsService, DirectionsResponse } from '@mapbox/mapbox-sdk/services/directions';
import { CurrentRun, RunStart, RunSegment } from './current-run';
import { getFormattedDistance } from './distance-formatter';
import { MapFocus } from './map-focus';
import { getStyleById } from './map-style';
import { ps } from './appsettings.secrets';
import { AnimationController } from './animation-controller';

const LAST_FOCUS_KEY = 'runmap-last_focus';
const STORAGE_NOTICE_KEY = 'runmap-help_notice';
const USE_METRIC_KEY = 'runmap-use_metric';
const FOLLOW_ROADS_KEY = 'runmap-follow_roads';
const MAP_STYLE_KEY = 'runmap-map_style';

let useMetric = loadBooleanPreference(USE_METRIC_KEY);
let followRoads = loadBooleanPreference(FOLLOW_ROADS_KEY);
let isWaiting = false;

const initialFocus = loadLastOrDefaultFocus();
const mapStyle = getStyleById(loadStringPreference(MAP_STYLE_KEY, 'street-style'));
const mbk = atob(ps);
(mapboxgl as any)[atob('YWNjZXNzVG9rZW4=')] = mbk;
let map = new Map({
  pitchWithRotate: false,
  center: [initialFocus.lng, initialFocus.lat],
  zoom: initialFocus.zoom,
  container: 'mapbox-container',
  style: mapStyle
});

let cfg = {} as SdkConfig;
((cfg as any)[atob('YWNjZXNzVG9rZW4=')] = mbk);
let directionsService: DirectionsService = DirectionsFactory(cfg);
let currentRun: CurrentRun = undefined;

let animationController = new AnimationController(map);

let lengthElement = document.getElementById('run-length');
let unitsElement = document.getElementById('run-units');
let menuElement = document.getElementById('menu-toggle');

let settingsElement = document.getElementById('settings-pane');
let closeElement = document.getElementById('close-settings');
let scrimElement = document.getElementById('settings-scrim');
let toggleUnitsElement = document.getElementById('toggle-units');
let followRoadsElement = document.getElementById('follow-roads');
let clearRunElement = document.getElementById('clear-run');
let streetStyleElement = document.getElementById('street-style');
let satelliteStyleElement = document.getElementById('satellite-style');
let darkStyleElement = document.getElementById('dark-style');
const mapStyleElements = [streetStyleElement, satelliteStyleElement, darkStyleElement];

let removeLastElement = document.getElementById('remove-last');

let storageElement = document.getElementById('help-notice');
let acceptStorageElement = document.getElementById('dismiss-notice');
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
});

// triggered upon map style changed
map.on('style.load', () => {
    animationController.readdRunToMap(currentRun);
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
    removeLastElement.setAttribute('aria-hidden', 'false');
    updateLengthElement();
  } else {
    let prev = currentRun.getLastPosition();
    if (followRoads) {
      segmentFromDirectionsResponse(prev, e);
    } else {
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
        route.distance,
        route.geometry as LineString
      );

      const line = route.geometry as LineString;
      const coordinates = line.coordinates;
      animationController.animateSegment(newSegment);

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
  const lineCoordinates = [
    [previousPoint.lng, previousPoint.lat],
    [e.lngLat.lng, e.lngLat.lat]
  ];

  const distance = length(lineString(lineCoordinates), { units: 'meters' });
  const line = { type: 'LineString', coordinates: lineCoordinates } as LineString;
  let newSegment = new RunSegment(
    uuid(),
    e.lngLat,
    e.point,
    distance,
    line
  );
  animationController.animateSegment(newSegment);
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

function loadStringPreference(settingKey: string, defaultValue: string): string {
  const setting = localStorage.getItem(settingKey);
  if (setting === null) {
    return defaultValue;
  } else {
    return setting;
  }
}

function saveBooleanPreference(settingKey: string, value: boolean): void {
  localStorage.setItem(settingKey, '' + value); // ugh
}

function setupUserControls(): void {
  showHelpElementIfNecessary();
  acceptStorageElement.onclick = hideStorageElement;

  removeLastElement.onclick = removeLastSegment;

  updateLengthElement();
  lengthElement.onclick = toggleDistanceUnits;

  menuElement.onclick = openMenu;
  closeElement.onclick = closeMenu;
  scrimElement.onclick = closeMenu;
  toggleUnitsElement.onclick = () => closeMenuAction(toggleDistanceUnits);

  setFollowRoads(followRoads);
  followRoadsElement.onclick = () => closeMenuAction(toggleFollowRoads);
  clearRunElement.onclick = () => closeMenuAction(clearRun);

  const id = loadStringPreference(MAP_STYLE_KEY, 'street-style');
  setSelectedMapToggleStyles(document.getElementById(id));
  streetStyleElement.onclick = () => closeMenuAction(() => setSelectedMapToggleStyles(streetStyleElement));
  satelliteStyleElement.onclick = () => closeMenuAction(() => setSelectedMapToggleStyles(satelliteStyleElement));
  darkStyleElement.onclick = () => closeMenuAction(() => setSelectedMapToggleStyles(darkStyleElement));
}

function closeMenuAction(fn: () => void) {
  fn();
  closeMenu();
}

function showHelpElementIfNecessary(): void {
  if (!JSON.parse(localStorage.getItem(STORAGE_NOTICE_KEY))) {
    storageElement.style.display = 'block';
  }
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

function toggleFollowRoads(): void {
  followRoads = !followRoads;
  setFollowRoads(followRoads);
}

function setSelectedMapToggleStyles(selected: HTMLElement): void {
  const elementId = selected.id;
  const style = getStyleById(elementId);
  map.setStyle(style); // layers readded on style.load
  localStorage.setItem(MAP_STYLE_KEY, elementId);
  for (let element of mapStyleElements) {
    element.style.color = 'inherit';
  }
  selected.style.color = '#4285F4';
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
    removeLastElement.setAttribute('aria-hidden', 'true');
  }
}

function clearRun(): void {
  while (currentRun) {
    removeLastSegment();
  }
}

function updateLengthElement(): void {
  const distance = currentRun ? currentRun.distance : 0;
  const fd = getFormattedDistance(distance, useMetric);
  lengthElement.innerText = fd.roundedDistance;
  unitsElement.innerText = fd.units;
  toggleUnitsElement.setAttribute('aria-value', useMetric ? 'kilometers' : 'miles');
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
  settingsElement.setAttribute('aria-hidden', 'false');
  scrimElement.classList.remove('scrim-hidden');
  scrimElement.classList.add('scrim-shown');
}

function closeMenu() {
  settingsElement.classList.remove('settings-open');
  settingsElement.setAttribute('aria-hidden', 'true');
  scrimElement.classList.remove('scrim-shown');
  scrimElement.classList.add('scrim-hidden');
}

function setFollowRoads(value: boolean) {
  if (value) {
    followRoadsElement.style.textDecoration = 'inherit';
    followRoadsElement.setAttribute('aria-value', 'enabled');
  } else {
    followRoadsElement.style.textDecoration = 'line-through';
    followRoadsElement.setAttribute('aria-value', 'disabled');
  }
  followRoads = value;
  saveBooleanPreference(FOLLOW_ROADS_KEY, value);
}
