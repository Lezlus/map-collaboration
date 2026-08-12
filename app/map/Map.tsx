"use client";
import { ChangeEvent, MouseEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { default as OlMap } from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import Projection from "ol/proj/Projection";
import "ol/ol.css";
import "../globals.css";
import { Feature } from "ol";
import { Point } from "ol/geom";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { addUniqueItem, AnimatePresence, motion, useDragControls } from "framer-motion";
import MousePosition from "ol/control/MousePosition";
import Image from "next/image";
import { useDraggable, DragOverlay, DragDropProvider } from "@dnd-kit/react";
import Select from "ol/interaction/Select";
import PointerInteraction from "ol/interaction/Pointer";
import { click } from "ol/events/condition";
import Stroke from "ol/style/Stroke";
import MapToolBar, { tools } from "@/app/components/toolbar/MapToolBar";
import { 
  MapActionState, 
  Coordinate, 
  TextBoxInfo,
  WebSocketMapAction, 
  WebSocketUsersConnected,
  DrawFeatureExtraProperties,
  TextBoxFeatureExtraProperties,
  USERNAME_LOCALSTORAGE_NAME,
  USER_ID_LOCALSTORAGE_NAME,
  ImageAssetFeatureExtraProperties,
  MapFeatureType,
  CreateFeatureParams,
  FeatureExtraProperties,
  ManifestFileUpload,
  ManifestFile,
  MapAction,
  FeatureCreate,
  SessionUserType,
  BlipFeatureData,
} from "@/types";
import DragPan from 'ol/interaction/DragPan';
import { nanoid } from "nanoid";
import TextBox from "@/app/components/toolbar/TextBox";
import Text from "ol/style/Text";
import Fill from "ol/style/Fill";
import Draw from "ol/interaction/Draw";
import GeoJSON from "ol/format/GeoJSON";
import { uniqueNamesGenerator, names, Config } from "unique-names-generator";
import DrawPenPopover from "@/app/components/toolbar/DrawPenPopover";
import { ColorResult } from "@uiw/react-color";
import BlipSidebar from "@/app/components/BlipSidebar";
import WebSocketManager from "@/services/WebSocketManager";
import { use } from "react";
import { authClient } from "@/app/lib/auth-client";
import { getMapInstance, MapInstancePopulated } from "@/app/actions/map-instance-actions";
import { notFound } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { insertFeature } from "../actions";
import { cdnStringifier } from "@/utils/cdnUrlStringifier";
import { TileGrid } from "ol/tilegrid";
import { useUser } from "../hooks/useUser";
import { deleteFeature } from "../actions/feature-actions";
import { BlipFeatureExtraProperties } from "@/types/frontend";
import BlipViewer from "../components/BlipViewer";

const customConfig: Config = {
  dictionaries: [names],
}

const MAX_HEIGHT = 912;
const MAX_WIDTH = 1920;
interface Item {
  id: string;
  src: string;
  name: string;
}

interface DraggableGridSlotProps {
  item: Item;
  id: string; 
}

interface User {
  id: string;
  username: string;
}

interface MapProps {
  mapData: MapInstancePopulated;
  manifestFile: ManifestFile;
  user: SessionUserType | null; 
}

interface InteractivePopoverProps {
  addImageToMap: (item: Item, coordinate: Coordinate) => void;
  map: RefObject<OlMap | null>;
}
const items: Item[] = [
  {id: "1", src: "/copper.webp", name: "copper asset"},
  {id: "2", src: "/Sulfur.webp", name: "sulfur asset"},
];

/**
 * Checks if a position is in between 0 and boundary coordinates
 * @param position - The Current Position
 * @param boundary - Any Coordinate You Want Position To be Constrained In
 * @returns boolean
 */
const isPositionWithinBounds = (position: Coordinate, boundary: Coordinate): boolean => {
  return position.x >= 0 && position.x <= boundary.x && position.y >= 0 && position.y <= boundary.y
}

const getCoordinatesRelativeToMap = (position: Coordinate, map: OlMap): Coordinate => {
  const canvasElement = map.getTargetElement();
  const canvasRectangle = canvasElement.getBoundingClientRect();
  
  const x = position.x - canvasRectangle.left;
  const y = position.y - canvasRectangle.top;

  const positionRelativeToMap = map.getCoordinateFromPixel([x, y]);
  return {
    x: Math.round(positionRelativeToMap[0]),
    y: Math.round(positionRelativeToMap[1]),
  }
}

const getVectorLayer = (map: OlMap): VectorLayer | null => {
  let vectorLayer : VectorLayer | null = null;
  map.getLayers().forEach((layer) => {
    if (layer instanceof VectorLayer) {
      vectorLayer = layer;
    }
  })
  return vectorLayer;
}

const getCursorStyle = (state: MapActionState): string => {
  switch (state) {
    case "BLIP PLACEMENT":
    case "DRAW":
      return "crosshair";
    case "MOVE":
      return "grabbing";
    case "TEXT":
      return "text";
    default:
      return "default";
  }
}

const createFeature = (createFeatureParams: CreateFeatureParams, coordinate: Coordinate, id: string): Feature | null => {
  const feature = new Feature({
    geometry: new Point([coordinate.x, coordinate.y])
  })
  feature.setId(id);
  let properties;
  switch (createFeatureParams[0]) {
    case "IMAGE":
      properties = createFeatureParams[1];
      feature.setStyle(new Style({
        image: new Icon({
          src: properties.src,
          scale: properties.scale,
          anchor: properties.anchor
        })
      }));
      feature.setProperties(properties);
      return feature;
    case "TEXT":
      properties = createFeatureParams[1];
      feature.setStyle(new Style({
        text: new Text({
          text: properties.text,
          font: properties.font,
          textAlign: properties.textAlign,
          textBaseline: properties.textBaseline,
          fill: new Fill({
            color: properties.color,
          }),
          padding: properties.padding,
        }),
      }));
      feature.setProperties(properties);
      return feature;
    case "BLIP":
      properties = createFeatureParams[1];
      feature.setStyle(new Style({
        image: new Icon({
          anchor: properties.anchor,
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          height: 50,
          width: 50,
          src: "/position-marker-svgrepo-com.svg",
        })
      }));
      feature.setProperties(properties);
      return feature;
    default:
      return null;
  }
}

function DraggableGridSlot(props: DraggableGridSlotProps) {
  const { item, id, } = props;
  const { ref } = useDraggable({id});

  return (
    <>
      <div 
        ref={ref}
      >
        <div className="relative h-12 w-12 pointer-events-none select-none">
          <Image fill src={item.src} alt={item.name} className="object-contain" />
        </div>
      </div>
    </>
  )
}

function InteractivePopover(props: InteractivePopoverProps) {
  const { addImageToMap, map } = props;
  const [activeDragItem, setActiveDragItem] = useState<Item | null>(null);

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20">
      <motion.div
        initial={{ opacity: 0, scale: 0, y: "100%" }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0, y: "100%" }}
        transition={{
          duration: 0.4,
          scale: { duration: 0.4, ease: "easeInOut"},
        
        }}
      >
        <div className="rounded-3xl w-64 bg-white shadow-lg p-4 overflow-hidden">
          <div className="max-h-[120px] scrollbar overflow-y-auto overflow-x-hidden p-2">
            <DragDropProvider 
              onDragStart={({ operation }) => {
                const item = items.find((item) => operation.source?.id === item.id);
                if (item) {
                  setActiveDragItem(item);
                }
              }}
              onDragEnd={({operation}) => {
                if (!map.current) return;
                const mapInstance = map.current;
                const itemScreenY = operation.position.current.y;
                const itemScreenX = operation.position.current.x;
                const position = getCoordinatesRelativeToMap({
                  x: itemScreenX,
                  y: itemScreenY
                }, mapInstance);
                if (activeDragItem && isPositionWithinBounds(position, { x: MAX_WIDTH, y: MAX_HEIGHT })) {
                  addImageToMap(activeDragItem, position)
                }
                setActiveDragItem(null);
              }}
              onDragMove={({operation}) => {
                if (!map.current) return;
                const itemScreenY = operation.position.current.y;
                const itemScreenX = operation.position.current.x;
                const position = getCoordinatesRelativeToMap({ x: itemScreenX, y: itemScreenY }, map.current);
                console.log("Current Position While Dragging Item", position.x, position.y);
              }}
            >
              <div className="grid grid-cols-3 gap-1">
                {items.map(item => (
                  <DraggableGridSlot key={item.id} id={item.id} item={item} />
                ))}
              </div>
              <DragOverlay>
                {activeDragItem ? (
                  <div className="relative h-12 w-12 pointer-events-none select-none">
                    <Image src={activeDragItem.src} alt={activeDragItem.name} fill className="object-contain" />
                  </div>
                ) : null}
              </DragOverlay>
            </DragDropProvider>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addFeature = (vectorLayer: VectorLayer<VectorSource<any>, any>, action: MapAction, feature: Feature<Point, {[x: string]: any;}>) => {
  let properties;
  switch (action) {
    case "IMAGE PLACEMENT":
      properties = feature.getProperties() as ImageAssetFeatureExtraProperties;
      feature.setStyle(new Style({
        image: new Icon({
          src: properties.src,
          scale: properties.scale,
          anchor: properties.anchor,
        }),
      }));
      vectorLayer.getSource()?.addFeature(feature);
      break;
    case "TEXT":
      properties = feature.getProperties() as TextBoxFeatureExtraProperties;
      feature.setStyle(new Style({
        text: new Text({
          text: properties.text,
          font: properties.font,
          textAlign: properties.textAlign,
          textBaseline: properties.textBaseline,
          fill: new Fill({
            color: properties.color,
          })
        })
      }));
      vectorLayer.getSource()?.addFeature(feature);
      break;
    case "BLIP PLACEMENT":
      properties = feature.getProperties() as BlipFeatureExtraProperties;
      feature.setStyle(new Style({
        image: new Icon({
          anchor: properties.anchor,
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          height: 50,
          width: 50,
          src: "/position-marker-svgrepo-com.svg",
        }),
      }));
      vectorLayer.getSource()?.addFeature(feature);
      break;
    case "DRAW":
      properties = feature.getProperties() as DrawFeatureExtraProperties;
      feature.setStyle(new Style({
        stroke: new Stroke({
          color: properties.color,
          width: properties.width,
        }),
      }));
      vectorLayer.getSource()?.addFeature(feature);
      break;
    case "ERASE":
      const featureId = feature.getId() ?? "";
      const featureInMemory = vectorLayer?.getSource()?.getFeatureById(featureId);
      vectorLayer.getSource()?.removeFeature(featureInMemory);
      break;
  }
}

const WEBSOCKET_NAME = "map";

export default function Map(props: MapProps) {
  const { mapData, manifestFile, user } = props;
  const currentUser = useUser(user);


  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<OlMap | null>(null);
  const geoJsonFormatter = useRef<GeoJSON>(new GeoJSON());
  const [cursorPosition, setCursorPosition] = useState<number[]>([]);
  const [mapActionState, setMapActionState] = useState<MapActionState>("MOVE");
  const [textBoxes, setTextBoxes] = useState<TextBoxInfo[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [userMapActions, setUserMapActions] = useState<WebSocketMapAction[]>([]);
  const [hoveredFeatureToolTip, setHoveredFeatureToolTip] = useState<string>("");

  const [toggleBlipSidebar, setToggleBlipSidebar] = useState(false);
  const [blipPosition, setBlipPosition] = useState<number[]>([]);
  const [blipViewer, setBlipViewer] = useState<BlipFeatureExtraProperties | null>(null);
  // DrawPenPopover States
  const [penColor, setPenColor] = useState("#fff");
  const [penSize, setPenSize] = useState(2);
  const penColorRef = useRef(penColor);
  const penSizeRef = useRef(penSize);

  const featureToolTipRef = useRef<HTMLDivElement>(null);

  const mapActionStateRef = useRef(mapActionState);
  const userMapActionsRef = useRef(userMapActions);

  const websocketFeatureSend = useCallback((data: WebSocketMapAction) => {
    if (!map.current) return;
    if (!WebSocketManager.connectionExists(WEBSOCKET_NAME)) return;
    if (WebSocketManager.getReadyState(WEBSOCKET_NAME) !== WebSocket.OPEN) return;
    WebSocketManager.send(WEBSOCKET_NAME, JSON.stringify(data));
  }, []);

  useEffect(() => {
    penColorRef.current = penColor;
  }, [penColor]);

  useEffect(() => {
    penSizeRef.current = penSize;
  }, [penSize]);

  useEffect(() => {
    userMapActionsRef.current = userMapActions;
  }, [userMapActions]);


  useEffect(() => {
    // const userId = localStorage.getItem(USER_ID_LOCALSTORAGE_NAME);
    // const username = localStorage.getItem(USERNAME_LOCALSTORAGE_NAME);
    // if (!username || !userId) return;
    if (!currentUser) return;
    console.log(currentUser);
    const SERVER_URL = new URL(`ws://localhost:8080/ws/${mapData.id}`);
    const userId = currentUser.id
    const username = currentUser.username ?? currentUser.name;

    SERVER_URL.searchParams.set("userId", userId);
    SERVER_URL.searchParams.set("username", username);

    WebSocketManager.connect(WEBSOCKET_NAME, SERVER_URL);
    const onOpenCallback = (ev: Event) => {
      const data: WebSocketMapAction = {
        type: "MAP ACTION",
        userId: currentUser.id,
        username,
        action: "USER CONNECT",
        actionId: nanoid(),
      }
      WebSocketManager.send(WEBSOCKET_NAME, JSON.stringify(data));
    }
    const onMessageCallback = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (data["type"] === "USER CONNECTION") {
        const connectionData = data as WebSocketUsersConnected;
        if (connectionData.action === "USERS CONNECTED" || connectionData.action === "USER DISCONNECTED") {
          const users: User[] = [];
          connectionData.users.forEach(user => {
            // Redis server places a "@" between the user id and username. 
            // Redis sets can only contain strings so only viable solution for now
            const userSplit = user.split('@');
            const id = userSplit[0];
            const username = userSplit[1];
            console.log(id, username);
            users.push({
              id,
              username
            });
          });
          setConnectedUsers(users);
        }
      }
      if (data["type"] === "MAP ACTION") {
        const mapData = data as WebSocketMapAction;
        console.log("New Action", mapData.feature);
        const isUserAction = userMapActionsRef.current.some((action) => action.actionId === mapData.actionId);
        if (!isUserAction && map.current && mapData.feature) {
          const feature = geoJsonFormatter.current.readFeature(mapData.feature) as Feature<Point>;
          const vectorLayer = getVectorLayer(map.current);
          if (!vectorLayer) return;
          addFeature(vectorLayer, mapData.action, feature);
        }
      }
    }
    WebSocketManager.addEvent(WEBSOCKET_NAME, ["ONOPEN", onOpenCallback])
    WebSocketManager.addEvent(WEBSOCKET_NAME, ["ONMESSAGE", onMessageCallback]);
    return () => {
      WebSocketManager.closeConnection(WEBSOCKET_NAME);
    }
  }, [mapData.id, currentUser]);

  // Initializes the map
  useEffect(() => {
    if (!mapElement.current) return;
    if (!currentUser) return;
    const userId = currentUser.id
    const username = currentUser.username ?? currentUser.name;

    map.current = new OlMap();
    console.log(manifestFile);
    // 1. Your raw image dimensions
    const width = parseInt(manifestFile.mapDimensionsX);
    const height = parseInt(manifestFile.mapDimensionsY);
    const extent = [0, 0, width, height];

    const projection = new Projection({
      code: "custom-image",
      units: "pixels",
      extent: extent,
    });
    const mousePositionControl = new MousePosition({
      coordinateFormat: (coord) => {
        if (coord && coord.length >= 2) {
          const x = Math.round(coord[0]);
          const y = Math.round(coord[1]);
          setCursorPosition([x, y]);
        }
        return "";
      },
    })
    // 2. Calculate explicit resolutions for zoom levels 0, 1, and 2.
    // At max zoom (2), 1 pixel on the map = 1 pixel in your image (resolution = 1).
    // At zoom 1, resolution is 2 (scaled down). At zoom 0, resolution is 4.
    const resolutions = [4, 2, 1];

    // 3. Define the exact origin. 
    // gdal2tiles by default templates maps from the top-left [0, height] 
    // or bottom-left [0, 0] depending on your exact gdal configuration.
    // If your map looks upside down or shifted, toggle this between [0, height] and [0, 0].
    const origin = [0, height]; 
    map.current.setTarget(mapElement.current);
    const vectorSource = new VectorSource({ features: [] })
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    console.log(cdnStringifier(manifestFile.mapDirectoryKey));
    const tileGrid = new TileGrid({
      extent,
      origin,
      resolutions,
    });
    const source = new XYZ({
      url: `${cdnStringifier(manifestFile.mapDirectoryKey)}/{z}/{x}/{y}.png`,
      projection,
      tileGrid,
    })
    map.current.setLayers([
      new TileLayer({
        source,
        // maxZoom: 10
        }),
      vectorLayer,
    ],);
    const view = new View({
      projection,
      resolutions,
      center: [width / 2, height / 2],
      zoom: 2,
      minZoom: 0,
      maxZoom: 2,
    })
    map.current.setView(view);
    map.current.addControl(mousePositionControl);    
    console.log("ZOOM", map.current.getView().getZoom());
    // Adding select interaction
    const selectedStyle = new Style({
      stroke: new Stroke({
        color: 'rgba(255, 255, 255, 0.7)',
        width: 1,
      })
    });
    const selectClick = new Select({
      condition: click,
      style: null,
      hitTolerance: 5,
    });
    const pointerInteraction = new PointerInteraction({
      handleMoveEvent: (e) => {
          if (e.type === "pointermove") {
            const feature = map.current?.forEachFeatureAtPixel(e.pixel, (feature) => {
              return feature;
            });
            console.log(feature);
            if (feature) {
            
            }
          }
      },
    });
    map.current.addInteraction(selectClick);
    map.current.addInteraction(pointerInteraction);
    // map.current.on('click', (e) => {
    //   const [x, y] = e.coordinate;
    //   const roundX = Math.round(x);
    //   const roundY = Math.round(y);
      
    //   if (roundX >= 0 && roundX <= 1920 && roundY >= 0 && roundY <= 912) {
    //     console.log("Clicked on Map", `${roundX}-${roundY}`)
    //   }
    // });

    // map.current.on("pointermove", (e) => {
    //   const [x, y] = e.coordinate;
    //   console.log(x, y);
    //   const roundX = Math.round(x);
    //   const roundY = Math.round(y);
    //   setCursorPosition([roundX, roundY]);
    // });
    selectClick.on("select", (e) => {
      if (!map.current || e.selected.length === 0) return;
      const vectorLayer = getVectorLayer(map.current);
      const featureId = e.selected[0].getId();  // featureId reflecsts feature row in DB
      if (!vectorLayer || !featureId) return;
      const feature = vectorLayer.getSource()?.getFeatureById(featureId) as Feature<Point>;
      if (mapActionStateRef.current === "ERASE") {
        const serializedFeatureString = geoJsonFormatter.current.writeFeature(feature);
        const data: WebSocketMapAction = {
          type: "MAP ACTION",
          userId,
          username, 
          action: "ERASE",
          actionId: nanoid(),
          feature: serializedFeatureString,
        };

        deleteFeature(featureId)
          .then(res => {
            if (res.success) {
              vectorLayer.getSource()?.removeFeature(feature);
              setUserMapActions((prev) => [...prev, data]);
              websocketFeatureSend(data);
            }
          })

      } else if (mapActionStateRef.current === "SELECT") {
        // If we select text, we can change the text or drag it anywhere else
        // If we select a blip we can simply re-drag it
        const properties = feature.getProperties() as FeatureExtraProperties;        
        if (properties.type === "TEXT") {
          vectorLayer.getSource()?.removeFeature(feature);
          const ogEvent = e.mapBrowserEvent.originalEvent as PointerEvent;
          const [x, y] = [Math.round(ogEvent.clientX), Math.round(ogEvent.clientY)];
          const textBoxData: TextBoxInfo = {
            id: nanoid(),
            text: properties.text,
            position: {
              x,
              y
            }
          };
          setTextBoxes((prev) => [...prev, textBoxData]);
        } else if (properties.type === "BLIP") {
          console.log("Setting Blip Viewer")
          setBlipViewer(properties);
        }
      }
    });

    // Add Features from DB
    mapData.feature.map((dataFeature) => {
      const feature = geoJsonFormatter.current.readFeature(dataFeature.value) as Feature<Point>;
      console.log(feature);
      addFeature(vectorLayer, dataFeature.action, feature);
    });

    return () => {
      if (map.current) {
        map.current.setTarget(undefined);
        map.current = null;
      }
    }
  }, [websocketFeatureSend, manifestFile, mapData, currentUser]);

  // We'll have a useEffect that tracks any changes to mapActionState
  // When we are in any state other than MOVE we disable map.control.dragpan
  // When we are in any state other than DRAW we disable the draw interaction
  useEffect(() => {
    if (!map.current) return;
    if (!currentUser) return;
    const userId = currentUser.id
    const username = currentUser.username ?? currentUser.name;

    mapActionStateRef.current = mapActionState;
    if (mapActionStateRef.current === "DRAW") {
      const vectorLayer = getVectorLayer(map.current);
      const vectorSource = vectorLayer?.getSource();
      if (!vectorSource) return;
      const drawInteraction = new Draw({
          source: vectorSource,
          type: "LineString",
          freehand: true,
          style: () => {
            return new Style({
              stroke: new Stroke({
                color: penColorRef.current,
                width: penSizeRef.current,
              })
            })
          }
        });
      drawInteraction.on("drawend", (e) => {
        const featureIdDb = uuidv4();
        e.feature.setId(featureIdDb);
        e.feature.setStyle(new Style({
          stroke: new Stroke({
            color: penColorRef.current,
            width: penSizeRef.current,
          })
        }));
        const drawProperties: DrawFeatureExtraProperties = {
          type: "DRAW",
          userId,
          username,
          color: penColorRef.current,
          width: penSizeRef.current,
          featureIdDb
        }
        e.feature.setProperties(drawProperties);

        const serializedFeatureString = geoJsonFormatter.current.writeFeature(e.feature);
        const data: WebSocketMapAction = {
          type: "MAP ACTION",
          userId,
          username, 
          action: "DRAW",
          actionId: nanoid(),
          feature: serializedFeatureString,
        };
        const featureAddData: FeatureCreate = {
          id: featureIdDb,
          user_id: userId,
          map_instance_id: mapData.id,
          action: "DRAW",
          value: serializedFeatureString,
        }
        insertFeature(featureAddData)
          .then(res => {
            if (res.success) {
              setUserMapActions((prev) => [...prev, data]);
              websocketFeatureSend(data);
            }
          })
      });
      map.current.addInteraction(drawInteraction);
    } else {
      // Unmount Draw Interaction
      map.current.getInteractions().forEach((interaction) => {
        if (interaction instanceof Draw) {
          map.current?.removeInteraction(interaction);
        }
      });
      map.current.getInteractions().forEach((interaction) => {
        if (interaction instanceof DragPan) {
          const isActive = interaction.getActive();
          if (isActive && mapActionStateRef.current !== "MOVE") {
            interaction.setActive(false);
          }
          if (!isActive && mapActionStateRef.current === "MOVE") {
            interaction.setActive(true);
          }
        }
      })
    }
  }, [mapActionState, websocketFeatureSend, currentUser, mapData]);
  if (!currentUser) {
    return <div>Loading...</div>
  }
  // Removed Feature For Now
  // Opens up a can of worms on whether I let users upload assets or create pre-defined ones
  // Not sure yet
  const addImageToMap = (item: Item, coordinate: Coordinate) => {
    // const userId = localStorage.getItem(USER_ID_LOCALSTORAGE_NAME);
    // const username = localStorage.getItem(USERNAME_LOCALSTORAGE_NAME);
    // if (!username || !userId) return;
    // if (!map.current) return;
    // const parsedImageUrl = item.src.replace("/", "");
    // const filename = parsedImageUrl.replace(/\.[^/.]+$/, "");
    // const featureData: CreateFeatureParams = ["IMAGE", {
    //   type: "IMAGE",
    //   userId,
    //   username,
    //   src: parsedImageUrl,
    //   scale: 0.1, 
    //   anchor: [0.5, 0.5],
    //   position: coordinate,
    //   tooltip: filename,
    // }]; 
    // const imageFeature = createFeature(featureData, coordinate);
    // if (!imageFeature) return;

    // const serializedString = geoJsonFormatter.current.writeFeature(imageFeature, {
    //   featureProjection: "custom-image",
    //   dataProjection: "custom-image",
    // });
    // const data: WebSocketMapAction = {
    //   type: "MAP ACTION",
    //   userId: localStorage.getItem("userIdMapCollab") ?? "",
    //   username: localStorage.getItem("username") ?? "",
    //   action: "IMAGE PLACEMENT",
    //   actionId: nanoid(),
    //   feature: serializedString,
    // }
  

    // const vectorLayer = getVectorLayer(map.current);
    // if (vectorLayer) {
    //   vectorLayer.getSource()?.addFeature(imageFeature);
    //   setUserMapActions((prev) => [...prev, data]);
    //   websocketFeatureSend(data);
    // }
  }

  const handleTextBoxOutSideClick = (text: string, id: string, position: Coordinate | null) => {
    if (!map.current) return;
    if (!currentUser) return;
    const userId = currentUser.id
    const username = currentUser.username ?? currentUser.name;

    if (text) {
      // Save text onto map
      const textBox = textBoxes.find((textBox) => textBox.id === id);
      if (!textBox) return;
      const featureIdDb = uuidv4();
      const x = position ? position.x : textBox.position.x;
      const y = position ? position.y : textBox.position.y;
      const textBoxCoordinates = getCoordinatesRelativeToMap({ x, y }, map.current);
      const featrueData: CreateFeatureParams =  ["TEXT", {
        type: "TEXT",
        text,
        userId,
        username,
        font: '16px "Arial", sans-serif',
        textAlign: "center",
        textBaseline: "middle",
        color: "#FFFFFF",
        padding: [4, 8, 4, 8],
        position: textBoxCoordinates,
        featureIdDb,
      }];
      const textFeature = createFeature(featrueData, textBoxCoordinates, featureIdDb);
      if (!textFeature) return;
      const serializedFeatureString = geoJsonFormatter.current.writeFeature(textFeature, {
        featureProjection: 'custom-image',
        dataProjection: 'custom-image',
      });
      const data: WebSocketMapAction = {
        type: "MAP ACTION",
        userId: currentUser.id ?? "",
        username: currentUser.username ?? currentUser.name,
        action: "TEXT",
        actionId: nanoid(),
        feature: serializedFeatureString,
      };
      const feaatureAddData: FeatureCreate = {
        map_instance_id: mapData.id,
        user_id: userId,
        value: serializedFeatureString,
        action: "TEXT",
        id: featureIdDb,
      };
      
      insertFeature(feaatureAddData)
        .then(res => {
          if (res.success && map.current) {
            const vectorLayer = getVectorLayer(map.current);
            if (vectorLayer) {
              vectorLayer.getSource()?.addFeature(textFeature);
              setUserMapActions((prev) => [...prev, data]);
              websocketFeatureSend(data);
            }
          }
        })
    }
    setTextBoxes((prev) => prev.filter((textbox) => textbox.id !== id));
  }

  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (mapActionState === "TEXT") {
      const textBoxData: TextBoxInfo = {
        id: nanoid(),
        position: {
          x: e.clientX,
          y: e.clientY
        },
        text: "",
      }
      setTextBoxes((prev) => [...prev, textBoxData]);
      setMapActionState("SELECT");
    } else if (mapActionState === "BLIP PLACEMENT") {
      setToggleBlipSidebar(prev => !prev);
      setBlipPosition([e.clientX, e.clientY]);
    }
    
  }

  const handleAddBlipFeature = (data: BlipFeatureData) => {
    if (!currentUser) return;
    if (!blipPosition.length) return;
    if (!map.current) return;
    const featureId = uuidv4();
    const [x, y] = blipPosition;
    const coordiantes = getCoordinatesRelativeToMap({ x, y }, map.current)
    const blipCreateData: CreateFeatureParams = [ "BLIP", {
        userId: currentUser.id,
        username: currentUser.username ?? currentUser.name,
        position: coordiantes,
        featureIdDb: featureId,
        type: "BLIP",
        images: data.images,
        title: data.title,
        description: data.description,
        anchor: [0.5, 0.5],
        scale: 1,
      }
    ]
    const blipFeature = createFeature(blipCreateData, coordiantes, featureId);
    if (!blipFeature) return;
    const serializedFeatureString = geoJsonFormatter.current.writeFeature(blipFeature, {
      featureProjection: "custom-image",
      dataProjection: "custom-image",
    });
    const blipPlacementAction: WebSocketMapAction = {
      type: "MAP ACTION",
      userId: currentUser.id ?? "",
      username: currentUser.username ?? currentUser.name,
      action: "BLIP PLACEMENT",
      actionId: nanoid(),
      feature: serializedFeatureString
    };
    const featureAddData: FeatureCreate = {
      map_instance_id: mapData.id,
      user_id: currentUser.id,
      value: serializedFeatureString,
      action: "BLIP PLACEMENT",
      id: featureId,
    };
    console.log("Adding Blip Feature");
    insertFeature(featureAddData)
      .then(res => {
        if (res.success && map.current) {
          const vectorLayer = getVectorLayer(map.current);
          if (vectorLayer) {
            vectorLayer.getSource()?.addFeature(blipFeature);
            setUserMapActions((prev) => [...prev, blipPlacementAction ]);
            websocketFeatureSend(blipPlacementAction);
          }
        }
      })
  }

  const handlePenColorChange = (color: ColorResult) => {
    setPenColor(color.hex);
  }

  const handlePenSizeChange = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    setPenSize(parseInt(e.target.value));
  }

  const handleCloseBlipView = () => {
    if (!map.current) return;
    const interactions = map.current.getInteractions().getArray();
    for (const interaction of interactions) {
      if (interaction instanceof Select) {
        interaction.clearSelection();
      }
    }
    setBlipViewer(null);
  }


  return (
    <div className="relative h-screen overflow-hidden bg-[#1a1a1a] select-none">
      
      {/* Main Map Element */}
      <main
        ref={mapElement} 
        onClick={handleMapClick}
        className="w-full h-full" 
        style={{ cursor: getCursorStyle(mapActionState) }}
      />

      {/* Connected Users */}
      <div className="absolute top-4 right-4 z-20 select-none rounded-xl border border-slate-700/40 bg-slate-900/80 p-3 shadow-2xl backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between border-b border-slate-800/60 pb-1.5 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Connected ({connectedUsers.length || 0})
          </span>
        </div>

        <div className="flex max-w-xs gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[...connectedUsers].map((user) => (
            <div 
              key={user.id} 
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-slate-800/60 pl-2.5 pr-3 py-1 border border-slate-700/30 hover:bg-slate-800 transition-colors"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
              </span>
              <p className="text-xs font-medium text-slate-200">
                {user.username}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Tooltip */}
      <div 
        ref={featureToolTipRef} 
        className="tool-tip-feature absolute inline-block h-auto w-auto z-30 bg-gray-300 text-white invisible pointer-events-none" 
      />

      {/* Text Boxes */}
      {textBoxes.map((textbox) => (
        <div
          key={textbox.id}
          style={{
            position: "absolute",
            top: textbox.position.y,
            left: textbox.position.x,
            transform: "translate(-50%, -50%)"
          }}
        > 
          <TextBox handleOutSideClick={handleTextBoxOutSideClick} {...textbox} />
        </div>
      ))}

      {/* Blip Sidebar */}
      <AnimatePresence>
        {toggleBlipSidebar && (
          <BlipSidebar 
            handleAddBlipFeature={handleAddBlipFeature} 
            handleClose={() => setToggleBlipSidebar(false)} 
          />
        )}
      </AnimatePresence>

      {/* Blip Viewer Modal */}
      <AnimatePresence>
        {blipViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleCloseBlipView()}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex justify-end"
          >
            <BlipViewer blip={blipViewer} onClose={() => handleCloseBlipView()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <MapToolBar>
        <AnimatePresence mode="wait">
          {mapActionState === "IMAGE PLACEMENT" && (
            <motion.div
              key="image-popover"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-40"
            >
              <InteractivePopover addImageToMap={addImageToMap} map={map} />
            </motion.div>
          )}
          {mapActionState === "DRAW" && (
            <motion.div
              key="draw-popover"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-40"
            >
              <DrawPenPopover
                handlePenColorChange={handlePenColorChange}
                handlePenSizeChange={handlePenSizeChange}
                hex={penColor}
                size={penSize}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {tools.map((tool) => {
          const isActive = mapActionState === tool.state;
          if (!currentUser.validated) {
            if (tool.state !== "MOVE" && tool.state !== "SELECT") {
              return;
            }
          }
          return (
            <button
              key={tool.state}
              onClick={() => setMapActionState(tool.state)}
              className={`group relative flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-[#e5484d] text-white shadow-lg shadow-[#e5484d]/25 scale-105"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/80"
              }`}
            >
              <tool.icon name={tool.state} className="w-5 h-5" />
              <span className="absolute bottom-full mb-2 hidden group-hover:block px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] font-medium text-neutral-200 whitespace-nowrap shadow-xl pointer-events-none">
                {tool.state}
              </span>
            </button>
          );
        })}
      </MapToolBar>
    </div>
  )
}