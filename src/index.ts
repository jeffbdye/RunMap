import mapboxgl, { Map, Marker, MapMouseEvent, NavigationControl, GeolocateControl, LngLat } from 'mapbox-gl';
import { LineString } from 'geojson';
import { CurrentRun, RunStart, RunSegment } from './current-run';
import { getFormattedDistance } from './distance-formatter';
import { getStyleById } from './map-style';
import { ps } from './appsettings.secrets';
import { AnimationService } from './animation-service';
import { NextSegmentService } from './next-segment-service';
import { PreferenceService } from './preference-service';

let preferenceService = new PreferenceService();

let useMetric = preferenceService.getUseMetric();
let followRoads = preferenceService.getShouldFollowRoads();
let isWaiting = false;

const initialFocus = preferenceService.getLastOrDefaultFocus();
const mapStyle = getStyleById(preferenceService.getMapStyle());
const mbk = atob(ps);
(mapboxgl as any)[atob('YWNjZXNzVG9rZW4=')] = mbk;
let map = new Map({
  pitchWithRotate: false,
  center: [initialFocus.lng, initialFocus.lat],
  zoom: initialFocus.zoom,
  container: 'mapbox-container',
  style: mapStyle
});

let nextSegmentService = new NextSegmentService(mbk);

let currentRun: CurrentRun = undefined;

let animationService = new AnimationService(map);

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

let helpElement = document.getElementById('help-notice');
let dismissHelpElement = document.getElementById('dismiss-notice');
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
    }).on('geolocate', (p: Position) => {
      preferenceService.saveCurrentFocus(p, map.getZoom());
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
  preferenceService.saveCurrentFocus(pos, map.getZoom());
});

// triggered upon map style changed
map.on('style.load', () => {
  animationService.readdRunToMap(currentRun);
});

function addNewPoint(e: MapMouseEvent): void {
  if (currentRun === undefined) {
    let start = new RunStart(
      e.lngLat
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
      addSegmentFromDirectionsResponse(prev, e);
    } else {
      addSegmentFromStraightLine(prev, e);
    }
  }
  setWaiting(false);
}

function addSegmentFromDirectionsResponse(previousLngLat: LngLat, e: MapMouseEvent) {
  nextSegmentService.getSegmentFromDirectionsService(previousLngLat, e.lngLat)
    .then((newSegment: RunSegment) => {

      const line = newSegment.geometry as LineString;
      const coordinates = line.coordinates;
      animationService.animateSegment(newSegment);

      // use ending coordinate from route for the marker
      const segmentEnd = coordinates[coordinates.length - 1];
      const marker = addMarker(new LngLat(segmentEnd[0], segmentEnd[1]), false);
      currentRun.addSegment(newSegment, marker);
      updateLengthElement();
    }, err => {
      alert(`An error occurred getting directions: ${err}`);
    });
}

function addSegmentFromStraightLine(previousLngLat: LngLat, e: MapMouseEvent): void {
  const newSegment = nextSegmentService.segmentFromStraightLine(previousLngLat, e.lngLat);

  animationService.animateSegment(newSegment);
  const marker = addMarker(e.lngLat, false);
  currentRun.addSegment(newSegment, marker);
  updateLengthElement();
}

function setupUserControls(): void {
  showHelpElementIfNecessary();
  dismissHelpElement.onclick = hideStorageElement;

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

  const id = preferenceService.getMapStyle();
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
  if (!preferenceService.getHasAcknowledgedHelp()) {
    helpElement.style.display = 'block';
  }
}

function hideStorageElement(): void {
  helpElement.style.display = 'none';
  preferenceService.saveHasAcknowledgedHelp(true);
}

function toggleDistanceUnits(): void {
  useMetric = !useMetric;
  updateLengthElement();
  preferenceService.saveUseMetric(useMetric);
}

function toggleFollowRoads(): void {
  followRoads = !followRoads;
  setFollowRoads(followRoads);
}

function setSelectedMapToggleStyles(selected: HTMLElement): void {
  const elementId = selected.id;
  const style = getStyleById(elementId);
  map.setStyle(style); // layers readded on style.load
  preferenceService.saveMapStyle(elementId);
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
  preferenceService.saveShouldFollowRoads(value);
}
