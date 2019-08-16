export function getStyleById(id: string): string {
  switch (id) {
    case 'satellite-style':
      return 'mapbox://styles/mapbox/satellite-streets-v11';
    case 'dark-style':
      return 'mapbox://styles/mapbox/dark-v10';
    default: // case 'street-style':
      return 'mapbox://styles/mapbox/streets-v11';
  }
}
