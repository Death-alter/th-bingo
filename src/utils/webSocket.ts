import { RequestParams } from "@/types";

interface WebSocketOption {
  url: string;
}

interface WebSocketCallBack {
  (data: { [index: string]: any }): void;
}

const url = "ws://127.0.0.1:9091";

class WS {
  private url: string;
  private ws: WebSocket | null = null;
  private eventList: { [index: string]: Array<WebSocketCallBack> } = {};
  private connecting = false;

  constructor(option: WebSocketOption) {
    this.url = option.url;
    this.createConnection();
  }

  createConnection() {
    if (this.connecting) {
      return;
    }
    if (this.ws == null) {
      this.ws = new WebSocket(this.url);
      this.connecting = true;
      this.ws.onopen = (event) => {
        this.connecting = false;
        console.log("ws已连接");
      };
      this.ws.onmessage = (event) => {
        const res = JSON.parse(event.data);
        if (this.eventList[res.name]) {
          for (const callback of this.eventList[res.name]) {
            callback(res.data);
          }
        }
      };
      this.ws.onclose = (event) => {
        this.ws = null;
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
    }
  }

  send(name: string, data: RequestParams) {
    if (this.ws) {
      this.ws.send(JSON.stringify({ name, data }));
    }
  }

  on(name: string, callback: WebSocketCallBack) {
    if (!this.eventList[name]) {
      this.eventList[name] = [];
    }
    this.eventList[name].push(callback);
  }
}

export default new WS({ url });
