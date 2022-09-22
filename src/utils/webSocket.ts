import { EventCallback } from "@/types";

interface WebSocketOption {
  url: string;
}

interface WebSocketMessage {
  name: string;
  data?: {
    [index: string]: any;
  };
}

class WS {
  private ws: WebSocket | null;
  private url: string;
  private eventList: { [index: string]: Array<EventCallback> };

  constructor(option: WebSocketOption) {
    this.url = option.url;
    this.eventList = {};
    this.ws = null;
    this.createConnection();
  }

  createConnection() {
    if (this.ws == null) {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = (event) => {
        console.log("ws已连接");
      };
      this.ws.onmessage = (event) => {
        const res = JSON.parse(event.data);
        this.eventList[res.name];
      };
      this.ws.onclose = (event) => {
        console.log("ws已断开");
      };
      this.ws.onerror = (error) => {
        console.log(error);
      };
    }
  }

  closeConnection() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: WebSocketMessage) {
    if (this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  listenEvent(eventName: string, callback: EventCallback) {}
}

export default WS;
