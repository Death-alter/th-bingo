import { RequestParams, defaultData } from "@/types";
import store from "@/store";
import { ElMessage } from "element-plus";

interface WebSocketOption {
  url: string;
}

interface WebSocketCallBack {
  (name: string, data: { [index: string]: any }): void;
}

export interface WebSocketData {
  name: string;
  reply: string;
  data: { [index: string]: any };
}

const url = process.env.VUE_APP_WS_API || "";

class WS {
  private url: string;
  private ws: WebSocket | null = null;
  private eventList: { [index: string]: Array<WebSocketCallBack> } = {};
  private connecting = false;
  private heartBeatTimer = 0;
  private retryTime = 0;
  private autoReconnect = true;
  static readonly heartBeatInterval: number = 20; //单位：秒
  static readonly retryLimit: number = 3; //单位：秒

  constructor(option: WebSocketOption) {
    this.url = option.url;
    if (!this.url) {
      console.error("没有设置url，无法创建socket连接");
    }
    this.createConnection();
  }

  createConnection() {
    if (this.connecting) {
      return;
    }
    if (this.retryTime >= WS.retryLimit) {
      ElMessage({
        type: "error",
        message: "无法连接到服务器，请稍后再试",
      });
      return;
    }
    if (this.ws == null) {
      this.retryTime++;
      this.ws = new WebSocket(this.url);
      this.connecting = true;
      this.autoReconnect = true;

      this.ws.onopen = (event) => {
        this.connecting = false;
        this.retryTime = 0;
        this.heartBeatTimer = window.setInterval(() => {
          store.dispatch("heart_beat", { time: new Date().getTime() });
          setTimeout(() => {
            if (store.getters.wsTimeOut_status === "pending") {
              this.ws?.close();
            }
          }, store.getters.wsTimeOut.second * 1000);
        }, WS.heartBeatInterval * 1000);
        if (process.env.NODE_ENV === "development") {
          console.log("ws已连接");
        }
      };

      this.ws.onmessage = (event) => {
        const res = JSON.parse(event.data);
        if (this.eventList[res.reply]) {
          for (const callback of this.eventList[res.reply]) {
            callback(res.name, res.data);
          }
        } else if (this.eventList[res.name]) {
          for (const callback of this.eventList[res.name]) {
            callback(res.name, res.data);
          }
        }
      };

      this.ws.onclose = (event) => {
        window.clearInterval(this.heartBeatTimer);
        this.ws = null;
        if (process.env.NODE_ENV === "development") {
          console.log("ws已断开");
        }
        if (this.autoReconnect) {
          this.createConnection();
        }
      };

      this.ws.onerror = (error) => {
        if (this.connecting) {
          this.connecting = false;
        }
        this.ws?.close();
        if (process.env.NODE_ENV === "development") {
          console.log(error);
        }
      };
    }
  }

  closeConnection() {
    if (this.ws) {
      this.autoReconnect = false;
      this.ws.close();
    }
  }

  send(name: string, data: RequestParams | null = null) {
    if (this.ws) {
      this.ws.send(JSON.stringify(data ? { name, data } : { name }));
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
