import { EventCallback } from "@/types";

interface WebSocketOption {
  url: string;
}

class WS {
  private ws: WebSocket | null;
  private url: string;
  private eventList: { [index: string]: Array<EventCallback> };

  constructor(option: WebSocketOption) {
    this.url = option.url;
    this.eventList = {
      message: [],
      open: [],
      close: [],
      error: [],
    };
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
        console.log(event.data);
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

  send(data: string) {
    if (this.ws) {
      this.ws.send(data);
    }
  }

  listenEvent(eventName: string, callback: EventCallback) {}
}

export default WS;
