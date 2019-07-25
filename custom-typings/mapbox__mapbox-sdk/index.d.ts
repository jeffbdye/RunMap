// Type definitions for @mapbox/mapbox-sdk 0.6.0
// Project: https://github.com/mapbox/mapbox-sdk-js
// Definitions by: Mike O'Meara <https://github.com/mikeomeara1>
//                 Jeff Dye <https://github.com/jeffbdye> 
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module '@mapbox/mapbox-sdk/lib/classes/mapi-client' {
  export interface MapiClient {
    accessToken: string;
  }
  
  export interface SdkConfig {
    accessToken: string;
  }  
}

declare module '@mapbox/mapbox-sdk/lib/classes/mapi-request' {
  import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
  import { MapiClient } from '@mapbox/mapbox-sdk/lib/classes/mapi-client';
  import { MapiError } from '@mapbox/mapbox-sdk/lib/classes/mapi-error';

export interface EventEmitter {
  response: MapiResponse;
  error: MapiError;
  downloadProgress: ProgressEvents;
  uploadProgress: ProgressEvents;
}

export interface ProgressEvents {

}

export interface MapiRequest {
  /** An event emitter */
  emitter:EventEmitter;
  /** This request's MapiClient. */
  client: MapiClient;
  /** If this request has been sent and received a response, the response is available on this property. */
  response: MapiResponse;
  /**  If this request has been sent and received an error in response, the error is available on this property. */
  error: MapiError;
  /** If the request has been aborted (via abort), this property will be true. */
  aborted: boolean;
  /**  If the request has been sent, this property will be true.
   * You cannot send the same request twice, so if you need to create a new request
   * that is the equivalent of an existing one, use clone.
   */
  sent: boolean;
  /** The request's path, including colon-prefixed route parameters. */
  path: string;
  /** The request's origin. */
  origin: string;
  /**  The request's HTTP method. */
  method: string;
  /** A query object, which will be transformed into a URL query string. */
  // query: GeocodeRequest;
  /**A route parameters object, whose values will be interpolated the path.  */
  params: Object;
  /** The request's headers, */
  headers: Object;
  /** Data to send with the request. If the request has a body, it will also be sent with the header 'Content-Type: application/json'. */
  body: Object | string | null;
  /** A file to send with the request. The browser client accepts Blobs and ArrayBuffers. */
  file: Blob | ArrayBuffer | string;
  url(): string;
  send(): Promise<MapiResponse>;
  abort(): void;
  eachPage(): void;
  clone(): MapiRequest;

}

export type MapboxProfile = "driving" |
                          "walking" |
                          "cycling";

export type DirectionsApproach = "unrestricted" | "curb";

}

declare module '@mapbox/mapbox-sdk/lib/classes/mapi-error' {
  import { MapiRequest } from '@mapbox/mapbox-sdk/lib/classes/mapi-request';

  export interface MapiError {
    /**The errored request. */
    request: MapiRequest;
    /** The type of error. Usually this is 'HttpError'.
     * If the request was aborted, so the error was not sent from the server, the type will be 'RequestAbortedError'.
     */
    type: string;
    /** The numeric status code of the HTTP response */
    statusCode?: number;
    /**  If the server sent a response body, this property exposes that response, parsed as JSON if possible. */
    body: Object |string;
    /** Whatever message could be derived from the call site and HTTP response. */
    message?: string;
  }
}

declare module '@mapbox/mapbox-sdk/lib/classes/mapi-response' {
  import { MapiRequest } from '@mapbox/mapbox-sdk/lib/classes/mapi-request';

  export interface MapiResponse {
    /**The response body, parsed as JSON. */
    body: Object;
    /**The raw response body. */
    rawBody: string;
    /**The response's status code. */
    statusCode: number;
    /**The parsed response headers. */
    headers: Object;
    /**The parsed response links */
    links: Object;
    /**The response's originating MapiRequest. */
    request: MapiRequest;
    hasNextPage(): boolean;
    nextPage(): MapiRequest;
  }
  
}

declare module '@mapbox/mapbox-sdk/services/directions' {
  import { SdkConfig } from '@mapbox/mapbox-sdk/lib/classes/mapi-client';
  import { MapiRequest } from '@mapbox/mapbox-sdk/lib/classes/mapi-request';

  export default function DirectionsFactory(config: SdkConfig): DirectionsService;

  export interface DirectionsService {
    getDirections(request: DirectionsRequest): MapiRequest;
  }
  
  export interface DirectionsRequest {
    /**Routing profile; either  mapbox/driving-traffic ,  mapbox/driving ,  mapbox/walking , or  mapbox/cycling */
    profile: DirectionsProfile;
    waypoints: DirectionsRequestWaypoint[];
    /**Whether to try to return alternative routes. An alternative is classified as a route that is significantly
     * different than the fastest route, but also still reasonably fast. Such a route does not exist in all circumstances.
     * Currently up to two alternatives can be returned. Can be  true or  false (default).
     */
    alternatives?: boolean;
    /**Whether or not to return additional metadata along the route. Possible values are:  duration ,  distance ,  speed , and congestion .
     * Several annotations can be used by including them as a comma-separated list. See the RouteLeg object for more details on
     * what is included with annotations.
     */
    annotations?: DirectionsAnnotation[];
  
    /**Whether or not to return banner objects associated with the  routeSteps .
     * Should be used in conjunction with  steps . Can be  true or  false . The default is  false .
     */
    bannerInstructions?: boolean;
  
    /** Sets the allowed direction of travel when departing intermediate waypoints. If  true , the route will continue in the same
     * direction of travel. If  false , the route may continue in the opposite direction of travel. Defaults to  true for mapbox/driving and
     * false for  mapbox/walking and  mapbox/cycling .
     */
    continueStraight?: boolean;
    /**Exclude certain road types from routing. Valid values depend on the profile in use.
     * The default is to not exclude anything from the profile selected.
     */
    exclude?: DirectionsProfile[];
    /**Format of the returned geometry. Allowed values are:  geojson (as LineString ),
     * polyline with precision 5,  polyline6 (a polyline with precision 6). The default value is  polyline .
     */
    geometries?: DirectionsGeometry;
    /**Language of returned turn-by-turn text instructions. See supported languages . The default is  en for English. */
    language?: string;
    /**Type of returned overview geometry. Can be  full (the most detailed geometry available),
     * simplified (a simplified version of the full geometry), or  false (no overview geometry). The default is  simplified .
     */
    overview?: DirectionsOverview;
  
    /**Emit instructions at roundabout exits. Can be  true or  false . The default is  false . */
    roundaboutExits?: boolean;
    /**Whether to return steps and turn-by-turn instructions. Can be  true or  false . The default is  false . */
    steps?: boolean;
    /**Whether or not to return SSML marked-up text for voice guidance along the route. Should be used in conjunction with steps .
     * Can be  true or  false . The default is  false .
     */
    voiceInstructions?: boolean;
    /**Which type of units to return in the text for voice instructions. Can be  imperial or  metric . Default is  imperial . */
    voiceUnits?: DirectionsUnits;
  
  }

  export interface DirectionsResponse {
    /**Array of Route objects ordered by descending recommendation rank. May contain at most two routes. */
    routes: Route[];
    /** Array of Waypoint objects. Each waypoints is an input coordinate snapped to the road and path network.
     * The waypoints appear in the array in the order of the input coordinates.
     */
    waypoints: Waypoint[];
    /**String indicating the state of the response. This is a separate code than the HTTP status code.
     * On normal valid responses, the value will be Ok.
     */
    code: string;
    uuid: string;
  }

  export interface Waypoint {
    /**String with the name of the way the coordinate snapped to */
    name: string;
    /**Array of [ longitude, latitude ] for the snapped coordinate */
    location: number[];
    /**Used to filter the road segment the waypoint will be placed on by direction and dictates the angle of approach.
     * This option should always be used in conjunction with the  radiuses parameter. The parameter takes two values per waypoint.
     * The first value is an angle clockwise from true north between 0 and 360, and the second is the range of degrees the angle can deviate by.
     * The recommended value for the range is 45° or 90°, as bearing measurements tend to be inaccurate.
     * This is useful for making sure the new routes of rerouted vehicles continue traveling in their current direction.
     * A request that does this would provide bearing and radius values for the first waypoint and leave the remaining values empty.
     * If provided, the list of bearings must be the same length as the list of waypoints.
     * However, you can skip a coordinate and show its position in the list with the  ; separator.
     */
    bearing?: number[];
    /**Custom names for waypoints used for the arrival instruction in banners and voice instructions, each separated by  ; .
    * Values can be any string and total number of all characters cannot exceed 500. If provided, the list of waypoint_names must be the same
    * length as the list of waypoints, but you can skip a coordinate and show its position with the  ; separator.
    */
    waypointName?: string;
  }
  
  type MapboxProfile = "driving" |
    "walking" |
    "cycling";
  
  type DirectionsProfile = MapboxProfile | "driving-traffic";
  
  type DirectionsAnnotation = "duration" | "distance" | "speed" | "congestion";
  type DirectionsApproach = "unrestricted" | "curb";
  type DirectionsGeometry = "geojson" | "polyline" | "polyline6";
  type DirectionsOverview = "full" | "simplified";
  type DirectionsUnits = "imperial" | "metric";
  type DirectionsSide = "left" | "right";
  type DirectionsMode = "driving" | "ferry" | "unaccessible" | "walking" | "cycling" | "train";
  type DirectionsClass = "toll" | "ferry" | "restricted" | "motorway" | "tunnel";
  type ManeuverModifier =
    "uturn" |
    "sharp right" |
    "right" |
    "slight right" |
    "straight" |
    "slight left" |
    "left" |
    "sharp left" |
    "depart" |
    "arrive";
  type ManeuverType = "turn" |
    "new name" |
    "depart" |
    "arrive" |
    "merge" |
    "on ramp" |
    "off ramp" |
    "fork" |
    "end of road" |
    "continue" |
    "roundabout" |
    "rotary" |
    "roundabout turn" |
    "notification" |
    "exit roundabout" |
    "exit rotary";
  
  export interface DirectionsRequestWaypoint {
    /**Semicolon-separated list of  {longitude},{latitude} coordinate pairs to visit in order. There can be between 2 and 25 coordinates. */
    coordinates: number[] | mapboxgl.LngLatLike;
    /**Used to indicate how requested routes consider from which side of the road to approach a waypoint.
   * Accepts unrestricted (default) or  curb . If set to  unrestricted , the routes can approach waypoints from either side of the road.
   * If set to  curb , the route will be returned so that on arrival, the waypoint will be found on the side that corresponds with the
   * driving_side of the region in which the returned route is located. Note that the  approaches parameter influences how you arrive at a waypoint,
   * while  bearings influences how you start from a waypoint. If provided, the list of approaches must be the same length as the list of waypoints.
   * However, you can skip a coordinate and show its position in the list with the  ; separator.
   */
    approach?: DirectionsApproach;
    /**Maximum distance in meters that each coordinate is allowed to move when snapped to a nearby road segment. There must be as many radiuses as there are coordinates in the request, each separated by  ; . Values can be any number greater than 0 or the string  unlimited . A  NoSegment error is returned if no routable road is found within the radius. */
    radius?: string | "unlimited";
  }

  
  export interface Route {
    /**Depending on the geometries parameter this is a GeoJSON LineString or a Polyline string.
     * Depending on the overview parameter this is the complete route geometry (full), a simplified geometry
     * to the zoom level at which the route can be displayed in full (simplified), or is not included (false)
     */
    geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
    /**Array of RouteLeg objects. */
    legs: Leg[];
    /** String indicating which weight was used. The default is routability which is duration-based,
     * with additional penalties for less desirable maneuvers.
     */
    weight_name: string;
    /**Float indicating the weight in units described by weight_name */
    weight: number;
    /**Float indicating the estimated travel time in seconds. */
    duration: number;
    /**Float indicating the distance traveled in meters. */
    distance: number;
    /**String of the locale used for voice instructions. Defaults to en, and can be any accepted instruction language. */
    voiceLocale?: string;
  }
  
  interface Leg {
    /**Depending on the summary parameter, either a String summarizing the route (true, default) or an empty String (false) */
    summary: string;
    weight: number;
    /**Number indicating the estimated travel time in seconds */
    duration: number;
    /** Depending on the steps parameter, either an Array of RouteStep objects (true, default) or an empty array (false) */
    steps: Step[];
    /** Number indicating the distance traveled in meters */
    distance: number;
    /**An annotations object that contains additional details about each line segment along the route geometry.
     * Each entry in an annotations field corresponds to a coordinate along the route geometry.
     */
    annotation: DirectionsAnnotation[];
  }
  
  export interface Step {
    /**Array of objects representing all intersections along the step. */
    intersections: Intersection[];
    /**The legal driving side at the location for this step. Either left or right. */
    driving_side: DirectionsSide;
    /** Depending on the geometries parameter this is a GeoJSON LineString or a
     * Polyline string representing the full route geometry from this RouteStep to the next RouteStep
     */
    geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
    /**String indicating the mode of transportation. Possible values: */
    mode: DirectionsMode;
    /**One StepManeuver object */
    maneuver: Maneuver;
    /**Any road designations associated with the road or path leading from this step’s maneuver to the next step’s maneuver.
     * Optionally included, if data is available. If multiple road designations are associated with the road, they are separated by semicolons.
     * A road designation typically consists of an alphabetic network code (identifying the road type or numbering system), a space or hyphen,
     * and a route number. You should not assume that the network code is globally unique: for example, a network code of “NH” may appear on a
     * “National Highway” or “New Hampshire”. Moreover, a route number may not even uniquely identify a road within a given network.
     */
    ref?: string;
    weight: number;
    /**Number indicating the estimated time traveled time in seconds from the maneuver to the next RouteStep. */
    duration: number;
    /**String with the name of the way along which the travel proceeds */
    name: string;
    /** Number indicating the distance traveled in meters from the maneuver to the next RouteStep. */
    distance: number;
    voiceInstructions: VoiceInstruction[];
    bannerInstructions: BannerInstruction[];
    /**String with the destinations of the way along which the travel proceeds. Optionally included, if data is available. */
    destinations?: string;
    /**String with the exit numbers or names of the way. Optionally included, if data is available. */
    exits?: string;
    /** A string containing an IPA phonetic transcription indicating how to pronounce the name in the name property.
     * This property is omitted if pronunciation data is unavailable for the step.
     */
    pronunciation?: string;
  
  
  }
  
  export interface Instruction {
    /**String that contains all the text that should be displayed */
    text: string;
    /**Objects that, together, make up what should be displayed in the banner.
     * Includes additional information intended to be used to aid in visual layout
     */
    components: Component[];
    /**The type of maneuver. May be used in combination with the modifier (and, if it is a roundabout, the degrees) to for an icon to
     * display. Possible values: 'turn', 'merge', 'depart', 'arrive', 'fork', 'off ramp', 'roundabout'
     */
    type?: string;
    /** The modifier for the maneuver. Can be used in combination with the type (and, if it is a roundabout, the degrees)
     * to for an icon to display. Possible values: 'left', 'right', 'slight left', 'slight right', 'sharp left', 'sharp right', 'straight', 'uturn'
     */
    modifier?: ManeuverModifier;
    /**The degrees at which you will be exiting a roundabout, assuming 180 indicates going straight through the roundabout. */
    degrees?: number;
    /** A string representing which side the of the street people drive on in that location. Can be 'left' or 'right'. */
    driving_side: DirectionsSide;
  }
  
  export interface BannerInstruction {
    /**float indicating in meters, how far from the upcoming maneuver
     * the banner instruction should begin being displayed. Only 1 banner should be displayed at a time.
     */
    distanceAlongGeometry: number;
    /**Most important content to display to the user. Our SDK displays this text larger and at the top. */
    primary: Instruction;
    /**Additional content useful for visual guidance. Our SDK displays this text slightly smaller and below the primary. Can be null. */
    secondary?: Instruction[];
    then?: any;
    /**Additional information that is included if we feel the driver needs a heads up about something.
     * Can include information about the next maneuver (the one after the upcoming one) if the step is short -
     * can be null, or can be lane information. If we have lane information, that trumps information about the next maneuver.
     */
    sub?: Sub;
  }
  
  interface Sub {
    /** String that contains all the text that should be displayed */
    text: string;
    /**Objects that, together, make up what should be displayed in the banner.
     * Includes additional information intended to be used to aid in visual layout
     */
    components: Component[];
  }
  
  export interface Component {
    /**String giving you more context about the component which may help in visual markup/display choices.
     * If the type of the components is unknown it should be treated as text. Note: Introduction of new types
     * is not considered a breaking change. See the Types of Banner Components table below for more info on each type.
     */
    type: string;
    /** The sub-string of the parent object's text that may have additional context associated with it */
    text: string;
    /**The abbreviated form of text. If this is present, there will also be an abbr_priority value.
     * See the Examples of Abbreviations table below for an example of using abbr and abbr_priority.
     */
    abbr?: string;
    /**An integer indicating the order in which the abbreviation abbr should be used in place of text.
     * The highest priority is 0 and a higher integer value means it should have a lower priority. There are no gaps in
     * integer values. Multiple components can have the same abbr_priority and when this happens all components with the
     * same abbr_priority should be abbreviated at the same time. Finding no larger values of abbr_priority means that the
     * string is fully abbreviated.
     */
    abbr_priority?: number;
    /** String pointing to a shield image to use instead of the text. */
    imageBaseURL?: string;
    /** (present if component is lane): An array indicating which directions you can go from a lane (left, right, or straight).
     * If the value is ['left', 'straight'], the driver can go straight or left from that lane
     */
    directions?: string[];
    /**  (present if component is lane): A boolean telling you if that lane can be used to complete the upcoming maneuver.
     * If multiple lanes are active, then they can all be used to complete the upcoming maneuver.
     */
    active: boolean;
  }
  
  export interface VoiceInstruction {
    /** float indicating in meters, how far from the upcoming maneuver the voice instruction should begin. */
    distanceAlongGeometry: number;
    /**String containing the text of the verbal instruction. */
    announcement: string;
    /**String with SSML markup for proper text and pronunciation. Note: this property is designed for use with Amazon Polly.
     * The SSML tags contained here may not work with other text-to-speech engines.
     */
    ssmlAnnouncement: string;
  }
  
  export interface Maneuver {
    /**Number between 0 and 360 indicating the clockwise angle from true north to the direction of travel right after the maneuver */
    bearing_after: number;
    /**Number between 0 and 360 indicating the clockwise angle from true north to the direction of travel right before the maneuver */
    bearing_before: number;
    /**Array of [ longitude, latitude ] coordinates for the point of the maneuver */
    location: number[];
    /** Optional String indicating the direction change of the maneuver */
    modifier?: ManeuverModifier;
    /**String indicating the type of maneuver */
    type: ManeuverType;
    /**A human-readable instruction of how to execute the returned maneuver */
    instruction: string;
  }
  
  export interface Intersection {
    /**Index into the bearings/entry array. Used to extract the bearing after the turn. Namely, The clockwise angle from true north to
     * the direction of travel after the maneuver/passing the intersection.
     * The value is not supplied for arrive maneuvers.
     */
    out?: number;
    /** A list of entry flags, corresponding in a 1:1 relationship to the bearings.
     * A value of true indicates that the respective road could be entered on a valid route.
     * false indicates that the turn onto the respective road would violate a restriction.
     */
    entry: boolean[];
    /**A list of bearing values (for example [0,90,180,270]) that are available at the intersection.
     * The bearings describe all available roads at the intersection.
     */
    bearings: number[];
    /**A [longitude, latitude] pair describing the location of the turn. */
    location: number[];
    /** Index into bearings/entry array. Used to calculate the bearing before the turn. Namely, the clockwise angle from true
     * north to the direction of travel before the maneuver/passing the intersection. To get the bearing in the direction of driving,
     * the bearing has to be rotated by a value of 180. The value is not supplied for departure maneuvers.
     */
    in?: number;
    /**  An array of strings signifying the classes of the road exiting the intersection.  */
    classes?: DirectionsClass[];
    /**Array of Lane objects that represent the available turn lanes at the intersection.
     * If no lane information is available for an intersection, the lanes property will not be present.
     */
    lanes: Lane[];
  }
  
  export interface Lane {
    /**Boolean value for whether this lane can be taken to complete the maneuver. For instance, if the lane array has four objects and the
     * first two are marked as valid, then the driver can take either of the left lanes and stay on the route.
     */
    valid: boolean;
    /**Array of signs for each turn lane. There can be multiple signs. For example, a turning lane can have a sign with an arrow pointing left and another sign with an arrow pointing straight.
        Example Lane object
        {
            "valid": true,
            "indications": [
                "left"
            ]
          */
    indications: string[];
  }
}
