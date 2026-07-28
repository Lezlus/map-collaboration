import WebSocketManager from "@/services/WebSocketManager";
import type { WebSocketEventsType } from "@/services/WebSocketManager";
import WS from "jest-websocket-mock";
import { mock } from "node:test";

describe("WebSocketManager", () => {
  let websocket: WebSocketManager;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockWsInstance: any;
  beforeEach(() => {
    jest.clearAllMocks();
    WebSocketManager.resetInstance();
    websocket = WebSocketManager.getInstance();
    mockWsInstance = {
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      close: jest.fn()
    };
    const mockConstructor = jest.fn().mockImplementation(() => mockWsInstance);
    Object.assign(mockConstructor, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    });
    global.WebSocket = mockConstructor as unknown as typeof WebSocket;
  });

  test("Create and Store one Connection", () => {
    const url = "ws://localhost:8080";
    websocket.connect("chat", url);
    expect(global.WebSocket).toHaveBeenCalledWith(url, undefined);
  });

  test("Should Bind Events Correctly", () => {
    websocket.connect("chat", "ws://localhost:7070");
    const handler = jest.fn()
    const event: WebSocketEventsType = ["ONOPEN", handler];
    websocket.addEvent("chat", event);
    expect(mockWsInstance.onopen).toBe(handler);
  });

  test("Should Execute The Handler When The Browser Fires The Event", () => {
    websocket.connect("chat", "ws://localhost:7070");
    const userHandler = jest.fn();
    const event: WebSocketEventsType = ["ONOPEN", userHandler];
    websocket.addEvent("chat", event);
    const fakeEvent = new Event("open");
    if (mockWsInstance.onopen) {
      mockWsInstance.onopen(fakeEvent);
    }
    expect(userHandler).toHaveBeenCalledWith(fakeEvent);

  });

  test("Should be idempotent and not create duplicate connections", () => {
    websocket.connect("map", "ws://localhost:9000");
    websocket.connect("map", "ws://localhost:9000");

    expect(global.WebSocket).toHaveBeenCalledTimes(1);
  });

  test("Should cleanly close a specific connection and remove it from the map registry", () => {
    websocket.connect("map", "ws://localhost:9000");
    websocket.connect("supabase", "ws://localhost:8080");
    
    websocket.closeConnection("map");
    expect(mockWsInstance.close).toHaveBeenCalledTimes(1);
    expect(() => websocket.closeConnection("supabase")).not.toThrow();
  });

  test("Should Throw an error when trying to close a connection that doesn't exist", () => {
    websocket.connect("map", "ws://localhost:9000");
    websocket.closeConnection("map");

    expect(() => websocket.closeConnection("map")).toThrow();
  });

  test("Should Close Every Open Connection and completely clear the registry", () => {
    websocket.connect("map", "ws://localhost:9000");
    websocket.connect("supabase", "ws://localhost:8080");
    
    websocket.closeAllConnections();

    expect(mockWsInstance.close).toHaveBeenCalledTimes(2);
  });

  test("Should throw an error if a developer tries to add another onmessage handler (or any duplicate event handler)", () => {
    websocket.connect("supabase", "ws://localhost:8080");
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();

    expect(() => {
      websocket.addEvent("supabase", ["ONMESSAGE", firstHandler]);
    }).not.toThrow();

    expect(() => {
      websocket.addEvent("supabase", ["ONMESSAGE", secondHandler]);
    }).toThrow();
  });
});

describe("WebsSocketManager Integration", () => {
  let manager: WebSocketManager;
  let mockServer: WS;
  const TEST_PORT = 8089;
  const SERVER_URL = `ws://localhost:${TEST_PORT}`;

  beforeEach(async () => {
    WebSocketManager.resetInstance();
    manager = WebSocketManager.getInstance();

    mockServer = new WS(SERVER_URL, { jsonProtocol: true });
  });

  afterEach(async () => {
    manager.closeAllConnections();
    WS.clean();
  });

  test("Should Establish a Real Network Handshake and Trigger ONOPEN", async () => {
    const handler = jest.fn();
    const event: WebSocketEventsType = ["ONOPEN", handler];
    manager.connect("test", SERVER_URL);
    manager.addEvent("test", event);

    await mockServer.connected;
    expect(handler).toHaveBeenCalled();
  });

  test("Should Cleanly Forward Incoming Server Messages To The ONMESSAGE Handler", async () => {
    const handler = jest.fn();
    const event: WebSocketEventsType = ["ONMESSAGE", handler];
    manager.connect("test", SERVER_URL);
    manager.addEvent("test", event);

    await mockServer.connected;
    
    const payload = { message: "HI" }
    mockServer.send(payload);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({data: JSON.stringify(payload)})
    );
  });

  test("Connected WebSocket Should Run ONCLOSE Handler When Server Closes Connections", async () => {
    const handler = jest.fn();
    const event: WebSocketEventsType = ["ONCLOSE", handler];
    manager.connect("test", SERVER_URL);
    manager.addEvent("test", event);
    
    await mockServer.connected;
    mockServer.close();

    expect(handler).toHaveBeenCalledTimes(1);
  })

  test("Should correctly construct and connect to complex URLs with auth tokens", async () => {
    const secureSupabaseUrl = "ws://localhost:1234/realtime/v1?apikey=my-secret-jwt-token";
    const mockServer = new WS(secureSupabaseUrl);
    manager.connect("test", secureSupabaseUrl);
    await mockServer.connected;
    
    expect(manager.connectionExists("test")).toBe(true);
    mockServer.close();
  })
})