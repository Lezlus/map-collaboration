"use client";
import { ChangeEvent, MouseEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { default as OlMap } from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import Projection from "ol/proj/Projection";
import "ol/ol.css";
import "./globals.css";
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

const createFeature = (createFeatureParams: CreateFeatureParams, coordinate: Coordinate): Feature | null => {
  const feature = new Feature({
    geometry: new Point([coordinate.x, coordinate.y])
  })
  feature.setId(nanoid());
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
  const { mapData, manifestFile } = props;

  const session = authClient.useSession();

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

  // DrawPenPopover States
  const [penColor, setPenColor] = useState("#fff");
  const [penSize, setPenSize] = useState(2);
  const penColorRef = useRef(penColor);
  const penSizeRef = useRef(penSize);

  const featureToolTipRef = useRef<HTMLDivElement>(null);

  const mapActionStateRef = useRef(mapActionState);
  const userMapActionsRef = useRef(userMapActions);

  const websocket = useRef<WebSocket>(null);

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
    if (!localStorage.getItem(USER_ID_LOCALSTORAGE_NAME)) {
      localStorage.setItem(USER_ID_LOCALSTORAGE_NAME, nanoid());
      localStorage.setItem(USERNAME_LOCALSTORAGE_NAME, uniqueNamesGenerator(customConfig));
    }
  }, []);

  useEffect(() => {
    // const userId = localStorage.getItem(USER_ID_LOCALSTORAGE_NAME);
    // const username = localStorage.getItem(USERNAME_LOCALSTORAGE_NAME);
    // if (!username || !userId) return;
    const SERVER_URL = new URL(`ws://localhost:8080/ws/${mapData.id}`);
    const userId = session.data?.user ? session.data.user.id : localStorage.getItem(USER_ID_LOCALSTORAGE_NAME)!;
    const username = session.data?.user ? (session.data.user.username ?? session.data.user.name) : localStorage.getItem(USERNAME_LOCALSTORAGE_NAME)!;

    SERVER_URL.searchParams.set("userId", userId);
    SERVER_URL.searchParams.set("username", username);

    WebSocketManager.connect(WEBSOCKET_NAME, SERVER_URL);
    const onOpenCallback = (ev: Event) => {
      const id = localStorage.getItem(USER_ID_LOCALSTORAGE_NAME)
      if (id) {
        const data: WebSocketMapAction = {
          type: "MAP ACTION",
          userId: id,
          username,
          action: "USER CONNECT",
          actionId: nanoid(),
        }
        WebSocketManager.send(WEBSOCKET_NAME, JSON.stringify(data));
      }
    }
    const onMessageCallback = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (data["type"] === "USER CONNECTION") {
        const connectionData = data as WebSocketUsersConnected;
        if (connectionData.action === "USERS CONNECTED" || connectionData.action === "USER DISCONNECTED") {
          const users: User[] = [];
          connectionData.users.forEach(user => {
            const userSplit = user.split('-');
            const id = userSplit[0];
            const username = userSplit[1];
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
  }, [mapData.id, session]);

  // Initializes the map
  useEffect(() => {
    if (!mapElement.current) return;
    const userId = session.data?.user ? session.data.user.id : localStorage.getItem(USER_ID_LOCALSTORAGE_NAME)!;
    const username = session.data?.user ? (session.data.user.username ?? session.data.user.name) : localStorage.getItem(USERNAME_LOCALSTORAGE_NAME)!;

    map.current = new OlMap();
    
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
    const resolutions = [6, 4, 2, 1];

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
    const source = new XYZ({
      url: `${manifestFile.mapDirectoryKey}/{z}/{x}/{y}.png`,
      projection,
      maxZoom: 3,
    })
    map.current.setLayers([
      new TileLayer({
        source,
        maxZoom: 10
        }),
      vectorLayer,
    ],);
    const view = new View({
      projection,
      resolutions,
      center: [width / 2, height / 2],
      zoom: 3,
      minZoom: 2,
    })
    map.current.setView(view);
    map.current.addControl(mousePositionControl);    
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
              console.log(feature);
              return feature;
            });
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
      const featureId = e.selected[0].getId();
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
        const feaatureAddData: FeatureCreate = {
          id: uuidv4(),
          map_instance_id: mapData.id,
          user_id: userId,
          value: serializedFeatureString,
          action: "ERASE"
        };
        insertFeature(feaatureAddData)
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
        }
      }
    });

    // Add Features from DB
    mapData.feature.map((dataFeature) => {
      const feature = geoJsonFormatter.current.readFeature(dataFeature.value) as Feature<Point>;
      addFeature(vectorLayer, dataFeature.action, feature);
    });

    return () => {
      if (map.current) {
        map.current.setTarget(undefined);
        map.current = null;
      }
    }
  }, [websocketFeatureSend, manifestFile, mapData, session]);

  // We'll have a useEffect that tracks any changes to mapActionState
  // When we are in any state other than MOVE we disable map.control.dragpan
  // When we are in any state other than DRAW we disable the draw interaction
  useEffect(() => {
    const userId = session.data?.user ? session.data.user.id : localStorage.getItem(USER_ID_LOCALSTORAGE_NAME)!;
    const username = session.data?.user ? (session.data.user.username ?? session.data.user.name) : localStorage.getItem(USERNAME_LOCALSTORAGE_NAME)!;

    if (!map.current) return;
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
        e.feature.setId(nanoid());
        e.feature.setStyle(new Style({
          stroke: new Stroke({
            color: penColorRef.current,
            width: penSizeRef.current,
          })
        }));
        // const drawProperties: DrawFeatureExtraProperties = {
        //   type: "DRAW",
        //   timestamp: new Date(),
        //   userId,
        //   username,
        //   color: penColorRef.current,
        //   width: penSizeRef.current,
          
        // }
        // e.feature.setProperties(drawProperties);

        const serializedFeatureString = geoJsonFormatter.current.writeFeature(e.feature);
        const data: WebSocketMapAction = {
          type: "MAP ACTION",
          userId,
          username, 
          action: "DRAW",
          actionId: nanoid(),
          feature: serializedFeatureString,
        };
        const feaatureAddData: FeatureCreate = {
          id: uuidv4(),
          user_id: userId,
          map_instance_id: mapData.id,
          action: "DRAW",
          value: serializedFeatureString,
        }
        insertFeature(feaatureAddData)
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
  }, [mapActionState, websocketFeatureSend, session, mapData]);

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
    const userId = session.data?.user ? session.data.user.id : localStorage.getItem(USER_ID_LOCALSTORAGE_NAME)!;
    const username = session.data?.user ? (session.data.user.username ?? session.data.user.name) : localStorage.getItem(USERNAME_LOCALSTORAGE_NAME)!;

    if (!userId || !username) return;
    if (!map.current) return;
    
    if (text) {
      console.log("Clicked Off TextBox, Saving as Feature");
      // Save text onto map
      const textBox = textBoxes.find((textBox) => textBox.id === id);
      if (!textBox) return;
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
      }];
      const textFeature = createFeature(featrueData, textBoxCoordinates);
      if (!textFeature) return;
      const serializedFeatureString = geoJsonFormatter.current.writeFeature(textFeature, {
        featureProjection: 'custom-image',
        dataProjection: 'custom-image',
      });
      const data: WebSocketMapAction = {
        type: "MAP ACTION",
        userId: localStorage.getItem("userIdMapCollab") ?? "",
        username: localStorage.getItem("username") ?? "",
        action: "TEXT",
        actionId: nanoid(),
        feature: serializedFeatureString,
      };
      const feaatureAddData: FeatureCreate = {
        map_instance_id: mapData.id,
        user_id: userId,
        value: serializedFeatureString,
        action: "TEXT",
        id: uuidv4(),
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
    }
    
  }

  const handlePenColorChange = (color: ColorResult) => {
    setPenColor(color.hex);
  }

  const handlePenSizeChange = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    setPenSize(parseInt(e.target.value));
  }

  return (
    <>
      <main
        ref={mapElement} 
        onClick={handleMapClick}
        className="w-full h-screen" 
        style={{ cursor: getCursorStyle(mapActionState)}}
      />
      {/* Connected Users */}
      <div className="absolute top-4 right-4 z-10 select-none rounded-xl border border-slate-700/40 bg-slate-900/80 p-3 shadow-2xl backdrop-blur-md">
        {/* Header Section */}
        <div className="mb-2 flex items-center justify-between border-b border-slate-800/60 pb-1.5 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Connected ({connectedUsers.length || 0})
          </span>
        </div>

        {/* Scrollable Users Container */}
        <div className="flex max-w-xs gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[...connectedUsers].map((user) => {
            return (
              <div 
                key={user.id} 
                className="flex items-center gap-2 whitespace-nowrap rounded-full bg-slate-800/60 pl-2.5 pr-3 py-1 border border-slate-700/30 hover:bg-slate-800 transition-colors"
              >
                {/* Glowing Green Dot Indictor */}
                <span className="relative flex h-2 w-2 shrink-0">
                  {/* Pulsing ring */}
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  {/* Core glowing dot */}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                </span>
                
                {/* Username */}
                <p className="text-xs font-medium text-slate-200">
                  {user.username}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      {/* Tooltip to display over features */}
      <div ref={featureToolTipRef} className="tool-tip-feature absolute inline-block h-auto w-auto z-100 bg-gray-300 text-white invisible pointer-events-none"></div>
      {textBoxes.map(textbox => (
        <div
          key={textbox.id}
          style={{
            position: "absolute",
            top: textbox.position.y,
            left: textbox.position.x,
            transform: "translate(-50%, -50%)"
          }}
        > 
          <TextBox  handleOutSideClick={handleTextBoxOutSideClick} {...textbox} />
        </div>
      ))}
      {/* Blip Sidebar */}
      <AnimatePresence>
        { toggleBlipSidebar && <BlipSidebar /> }
      </AnimatePresence>
        {/* <AnimatePresence>
          { toggleBlipSidebar && <BlipSidebar /> }
        </AnimatePresence> */}
      {/* Toolbar */}
      <MapToolBar>
        <AnimatePresence>
          {mapActionState === "IMAGE PLACEMENT" && <InteractivePopover addImageToMap={addImageToMap} map={map} />}
          { mapActionState === "DRAW" && <DrawPenPopover handlePenColorChange={handlePenColorChange} handlePenSizeChange={handlePenSizeChange} hex={penColor} size={penSize} /> }
        </AnimatePresence>
        {tools.map((tool) => (
          <div 
            style={{ color: mapActionState === tool.state ? "white" : "black", cursor: "pointer" }} 
            className="px-2 py-2.5" 
            onClick={() => {
              setMapActionState(tool.state)
            }}
            key={tool.state}
          >
            <button style={{ cursor: "pointer" }}>
              <tool.icon name={tool.state} />
            </button>
          </div>
        ))}
      </MapToolBar>
    </>
  )
}