import { MapFocus } from './map-focus';

/**
 * Load user preferences for a variety of settings, currently
 * an abstraction over localStorage
 */
export class PreferenceService {
  private LAST_FOCUS_KEY = 'runmap-last_focus';
  private STORAGE_NOTICE_KEY = 'runmap-help_notice';
  private USE_METRIC_KEY = 'runmap-use_metric';
  private FOLLOW_ROADS_KEY = 'runmap-follow_roads';
  private MAP_STYLE_KEY = 'runmap-map_style';
  private LAST_RUN_KEY = 'runmap-last_run';

  public getLastOrDefaultFocus(): MapFocus {
    let initialPosition = JSON.parse(localStorage.getItem(this.LAST_FOCUS_KEY)) as MapFocus;
    if (initialPosition === null) {
      initialPosition = {
        lng: -79.93775232392454,
        lat: 32.78183341484467,
        zoom: 14
      };
    }
    return initialPosition;
  }

  public saveCurrentFocus(position: GeolocationPosition, zoom: number): void {
    const currentFocus = {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
      zoom: zoom
    } as MapFocus;
    this.saveJsonPreference(this.LAST_FOCUS_KEY, currentFocus);
  }

  public getUseMetric(): boolean {
    return this.loadBooleanPreference(this.USE_METRIC_KEY);
  }

  public saveUseMetric(value: boolean): void {
    this.saveBooleanPreference(this.USE_METRIC_KEY, value);
  }

  public getShouldFollowRoads(): boolean {
    return this.loadBooleanPreference(this.FOLLOW_ROADS_KEY);
  }

  public saveShouldFollowRoads(value: boolean): void {
    this.saveBooleanPreference(this.FOLLOW_ROADS_KEY, value);
  }

  public getMapStyle(): string {
    return this.loadStringPreference(this.MAP_STYLE_KEY, 'street-style');
  }

  public saveMapStyle(value: string) {
    this.saveStringPreference(this.MAP_STYLE_KEY, value);
  }
  
  public getLastRun(): string {
    return this.loadStringPreference(this.LAST_RUN_KEY, "{}");
  }
  
  public saveLastRun(value: string) {
    this.saveStringPreference(this.LAST_RUN_KEY, value);
  }

  public getHasAcknowledgedHelp(): boolean {
    return this.loadBooleanPreference(this.STORAGE_NOTICE_KEY);
  }

  public saveHasAcknowledgedHelp(value: boolean): void {
    this.saveBooleanPreference(this.STORAGE_NOTICE_KEY, value);
  }

  private loadBooleanPreference(settingKey: string): boolean {
    const setting = localStorage.getItem(settingKey);
    if (setting === null) {
      return true;
    } else {
      return setting === 'true';
    }
  }

  private loadStringPreference(settingKey: string, defaultValue: string): string {
    const setting = localStorage.getItem(settingKey);
    if (setting === null) {
      return defaultValue;
    } else {
      return setting;
    }
  }

  private saveBooleanPreference(settingKey: string, value: boolean): void {
    localStorage.setItem(settingKey, '' + value); // ugh
  }

  private saveStringPreference(settingKey: string, value: string): void {
    localStorage.setItem(settingKey, value);
  }

  private saveJsonPreference(settingKey: string, value: any): void {
    localStorage.setItem(settingKey, JSON.stringify(value));
  }
}
