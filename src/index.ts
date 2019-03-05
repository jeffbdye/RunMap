import * as mapboxgl from 'mapbox-gl';
import { Map, Marker, MapMouseEvent, NavigationControl, GeolocateControl, LngLat, Layer } from 'mapbox-gl';
import { v4 as uuid } from 'uuid';
import { LineString } from 'geojson';
import { CurrentRun, RunStart, RunSegment } from './current-run';
import { MapFocus } from './map-focus';
import { ps } from './appsettings.secrets';
import { MapiResponse, Directions, DirectionsService, DirectionsResponse } from '../custom-typings/@mapbox_mapbox-sdk';
const directionsFactory: Directions = require('@mapbox/mapbox-sdk/services/directions'); // TODO: determine proper typings to allow `import` to work

const LAST_FOCUS_KEY = 'runmap-last_focus';
const STORAGE_NOTICE_KEY = 'runmap-storage_notice';
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

let lengthEl = document.getElementById('run-length');
let storageEl = document.getElementById('storage-notice');
let acceptStorageEl = document.getElementById('accept-storage');
let removeLastEl = document.getElementById('remove-last');
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
  if (currentRun === undefined) {
    let start = new RunStart(
        e.lngLat,
        e.point
      );
    start.marker = addMarker(e.lngLat, true);
    currentRun = new CurrentRun(start);
    removeLastEl.classList.remove('slide-out');
    removeLastEl.classList.add('slide-in');
  } else {
    let newSegment = new RunSegment(
        uuid(),
        e.lngLat,
        e.point
       );
    let prev = currentRun.getLastPosition();
    applyRoute(newSegment, prev, e);
    currentRun.addSegment(newSegment);
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

function applyRoute(newSegment: RunSegment, previousPoint: LngLat, e: MapMouseEvent) {
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
    // continueStraight: true,
    geometries: 'geojson'
  }).send().then((res: MapiResponse) => {
    if (res.statusCode === 200) {
      const directionsResponse = res.body as DirectionsResponse;
      if (directionsResponse.routes.length <= 0) {
        alert('No routes found between the two points.');
        currentRun.removeLastPoint();
        return;
      }

      const geo = directionsResponse.routes[0].geometry as LineString;
      const route = geo.coordinates;
      map.addLayer(layerFromDirectionsResponse(newSegment.id, route));

      // use ending coordinate from route for the marker
      const segmentEnd = route[route.length - 1];
      const marker = addMarker(new LngLat(segmentEnd[0], segmentEnd[1]), false);

      currentRun.segmentDistanceUpdated(newSegment, res, marker);
      updateLengthElement();
    } else {
      alert(`Non-successful status code when getting directions: ${JSON.stringify(res)}`);
    }
  }, err => {
    alert(`An error occurred: ${JSON.stringify(err)}`);
  });
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

function setupUserControls(): void {
  if (!JSON.parse(localStorage.getItem(STORAGE_NOTICE_KEY))) {
    storageEl.style.display = 'block';
  }
  acceptStorageEl.onclick = hideStorageElement;

  removeLastEl.onclick = removeLastSegment;
}

function hideStorageElement(): void {
  storageEl.style.display = 'none';
  localStorage.setItem(STORAGE_NOTICE_KEY, JSON.stringify(true));
}

function removeLastSegment(): void {
  if (!currentRun) {
    return;
  }

  let lastPoint = currentRun.removeLastPoint();
  if (lastPoint) {
    map.setLayoutProperty(lastPoint.id, 'visibility', 'none');
    updateLengthElement();
  } else {
    if (currentRun.start) {
      currentRun.start.marker.remove();
      updateLengthElement();
      currentRun = undefined;
      removeLastEl.classList.remove('slide-in');
      removeLastEl.classList.add('slide-out');
    }
  }
}

function layerFromDirectionsResponse(id: string, route: number[][]): Layer {
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
  lengthEl.innerText = currentRun.getFormattedDistance();
}

function addMarker(pos: LngLat, isStart: boolean): Marker {
  return new Marker({
    draggable: false,
    color: isStart ? '#00BD00' : undefined
  }).setLngLat(pos)
    .addTo(map);
}
