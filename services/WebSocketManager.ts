export type WebSocketEventsType = 
  | ["ONMESSAGE", (event: MessageEvent) => void]
  | ["ONOPEN", (event: Event) => void]
  | ["ONCLOSE", (event: CloseEvent) => void]
  | ["ONERROR", (event: Event) => void]

class WebSocketManager {
  static instance: WebSocketManager | null = null;
  private connections: Map<string, WebSocket>;

  static getInstance() {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  constructor() {
    this.connections = new Map();
  }

  connect(name: string, url: string | URL, protocols?: string | string[] | undefined) {
    const duplicateWebsocket = this.connections.get(name);
    if (!duplicateWebsocket) {
      const websocket = new WebSocket(url, protocols);
      this.connections.set(name, websocket);
    }
  }

  private getWebsocket(name: string) {
    const websocket = this.connections.get(name);
    if (!websocket) {
      throw new Error(`Websocket[${name}] Doesn't Exist`)
    }
    return websocket;
  }

  getReadyState(name: string): number {
    const websocket = this.getWebsocket(name);
    return websocket.readyState;
  }

  send(name: string, data: BufferSource | Blob | string) {
    const websocket = this.getWebsocket(name);
    websocket.send(data);
  }

  connectionExists(name: string): boolean {
    return this.connections.has(name);
  }

  addEvent(name: string, websocketEventType: WebSocketEventsType) {
    const websocket = this.connections.get(name);
    if (!websocket) {
      throw new Error(`Websocket: [${name}] Does't Exist`);
    }
    const [eventType, handler] = websocketEventType;

    if (websocket) {
      switch (eventType) {
        case "ONOPEN":
          if (websocket.onopen) {
            throw new Error(`Websocket [${name}] Alread Has An 'onopen' handler`);
          }
          websocket.onopen = handler;
          break;
        case "ONCLOSE":
          if (websocket.onclose) {
            throw new Error(`Websocket [${name}] Alread Has An 'onclose' handler`);
          }
          websocket.onclose = handler;
          break;
        case "ONERROR":
          if (websocket.onerror) {
            throw new Error(`Websocket [${name}] Alread Has An 'onerror' handler`);
          }
          websocket.onerror = handler;
          break;
        case "ONMESSAGE":
          if (websocket.onmessage) {
            throw new Error(`Websocket [${name}] Alread Has An 'onmessage' handler`);
          }
          websocket.onmessage = handler;
      }
    }
  }

  closeConnection(name: string) {
    const websocket = this.connections.get(name);
    if (websocket) {
      websocket.close();
      this.connections.delete(name);
    } else {
      throw Error("Websocket Not Found In Map")
    }
  }

  closeAllConnections() {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
  }

  /*
  When we run tests using this singleton
  We have to reset our instance
  This helps when we have various differing tests
  */
  static resetInstance() {
    WebSocketManager.instance = null;
  }
}

// For Testing don't call getInstance() here
export default WebSocketManager.getInstance();