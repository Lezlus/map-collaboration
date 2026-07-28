import { WebSocket as NodeWebSocket, WebSocketServer } from "ws";
import { createServer, Server as HttpServer } from 'http';

export class WebSocketTestHarness {
  private httpServer: HttpServer;
  private port: number;
  public wss: WebSocketServer;
  public lastRecievedMessage: string | null = null;
  private activeConnections: Set<NodeWebSocket> = new Set();

  constructor(port: number) {
    this.port = port;
    this.httpServer = createServer();
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on("connection", (ws) => {
      this.activeConnections.add(ws);
      ws.on('message', (message) => {
        this.lastRecievedMessage = message.toString();
      });
      ws.on("close", () => {
        this.activeConnections.delete(ws);
      });
    });
  }

  public start(): Promise<void> {
    return new Promise((res) => {
      this.httpServer.listen(this.port, () => res());
    });
  }

  public stop(): Promise<void> {
    return new Promise((res) => {
      for (const ws of this.activeConnections) {
        ws.terminate();
      }
      this.wss.close(() => {
        this.httpServer.close(() => res());
      })
    });
  }
}