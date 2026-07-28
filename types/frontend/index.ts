// Localstorage key names
export const USER_ID_LOCALSTORAGE_NAME = "userIdMapCollab";
export const USERNAME_LOCALSTORAGE_NAME = "username";


export type MapActionState = "ERASE" | "MOVE" | "SELECT" | "DRAW" | "TEXT" | "IMAGE PLACEMENT" | "BLIP PLACEMENT"
type UsersConnection = "USERS CONNECTED" | "USER DISCONNECTED" | "USER CONNECT"
type ActionType = "MAP ACTION" | "USER CONNECTION"
export type MapAction = UsersConnection | Exclude<MapActionState, "SELECT" | "MOVE">;

export interface WebSocketMapAction {
  type: ActionType;
  userId: string;
  username: string;
  action: MapAction;
  actionId: string;
  feature?: string;
}

export interface WebSocketUsersConnected {
  type: ActionType;
  users: string[];
  action: UsersConnection
}

// Map UI interfaces and types
export interface Coordinate {
  x: number;
  y: number;
}
export interface TextBoxInfo {
  id: string;
  position: Coordinate;
  text: string;
}

export interface BaseExtraProperties {
  userId: string;
  username: string;
  position: Coordinate;
}

export interface DrawFeatureExtraProperties extends BaseExtraProperties {
  type: "DRAW";
  color: string;
  width: number;
}

export interface TextBoxFeatureExtraProperties extends BaseExtraProperties {
  type: "TEXT";
  text: string;
  font: string;
  textAlign: "center" | "end" | "right" | "start" | "left";
  textBaseline: "bottom" | "top" | "middle";
  color: string;
  padding: number[];
}

export interface ImageAssetFeatureExtraProperties extends BaseExtraProperties {
  type: "IMAGE";
  src: string;
  tooltip: string;
  scale: number;
  anchor: number[];
}

export interface BlipFeatureExtraProperties extends BaseExtraProperties {
  type: "BLIP";
  src: string;
  anchor: number[];
  scale: number;
  images: string[];
  audio: string[];
  video: string[];
  title: string;
  description: string;
}

export type FeatureExtraProperties = DrawFeatureExtraProperties | TextBoxFeatureExtraProperties | ImageAssetFeatureExtraProperties | BlipFeatureExtraProperties;

export type CreateFeatureParams = 
  | ["IMAGE", ImageAssetFeatureExtraProperties]
  | ["TEXT", TextBoxFeatureExtraProperties]
  | ["DRAW", DrawFeatureExtraProperties];

export type MapFeatureType = "IMAGE" | "TEXT" | "BLIP" | "DRAW";

export interface MapItem {
  imageUrl: string;
  mapName: string;
  id: string;
  createdAt: string;
  description: string | null;
  authorName: string;
  authorId: string;
}

export interface MapInstanceItem {
  instanceName: string;
  id: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
}