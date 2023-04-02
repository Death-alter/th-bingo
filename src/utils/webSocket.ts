import { RequestParams } from "@/types";
import { ElMessage } from "element-plus";
import config from "@/config";

interface WebSocketOption {
  url: string;
}

interface WebSocketCallBack {
  (name: string, data: { [index: string]: any }, trigger: string, webSocket: WS): void;
}

export interface WebSocketData {
  name: string;
  reply: string;
  data: { [index: string]: any };
}

export class WS {
  private url: string;
  private ws: WebSocket | null = null;
  private eventList: { [index: string]: Array<WebSocketCallBack> } = {
    connect: [],
    reconnect: [],
    disconnect: [],
    error: [],
  };
  private initList: Array<{ (): void }> = [];
  private heartBeatTimer = 0;
  private retryTime = 0;
  private autoReconnect = true;

  private heartBeat: { (): void } | null = null;

  public static readonly heartBeatInterval: number = config.webSocket.heartBeatInterval; //单位：秒
  public static readonly retryLimit: number = config.webSocket.maxRetryTimes; //最大重连次数
  public static readonly timeOutSeconds: number = config.webSocket.timeOutSeconds;

  constructor(option: WebSocketOption) {
    this.url = option.url;
    if (!this.url) {
      console.error("没有设置url，无法创建socket连接");
    }
  }

  get bufferedAmount() {
    return this.ws?.bufferedAmount;
  }

  get state() {
    return this.ws?.readyState;
  }

  get connecting() {
    return this.ws && this.state === this.ws.CONNECTING;
  }

  createConnection() {
    return new Promise((resolve, reject) => {
      if (this.connecting) {
        return;
      }
      if (this.retryTime >= WS.retryLimit) {
        ElMessage({
          type: "error",
          message: "无法连接到服务器，请检查网络连接并刷新页面重试",
        });
        return;
      }
      if (this.ws == null) {
        this.retryTime++;
        this.ws = new WebSocket(this.url);
        this.autoReconnect = true; //连接以后开启自动重连
        this.ws.onopen = (event) => {
          if (this.retryTime > 1) {
            ElMessage({
              type: "success",
              message: "重新连接服务器成功",
            });
          }
          this.retryTime = 0;
          for (const func of this.initList) {
            func();
          }
          this.initList = [];
          for (const callback of this.eventList.connect) {
            callback("connect", {}, "", this);
          }
          if (this.heartBeat) {
            this.heartBeatTimer = window.setInterval(this.heartBeat, WS.heartBeatInterval * 1000);
          }
          console.log("ws已连接");
          resolve(event);
        };

        this.ws.onmessage = (event) => {
          const res = JSON.parse(event.data);
          if (res.reply && this.eventList[res.reply]) {
            for (const callback of this.eventList[res.reply]) {
              callback(res.name, res.data, res.trigger, this);
            }
          }
          if (!res.reply && this.eventList[res.name]) {
            for (const callback of this.eventList[res.name]) {
              callback(res.name, res.data, res.trigger, this);
            }
          }
        };

        this.ws.onclose = (event) => {
          setTimeout(() => {
            window.clearInterval(this.heartBeatTimer);
            this.ws = null;
            for (const callback of this.eventList.disconnect) {
              callback("disconnect", {}, "", this);
            }
            if (this.retryTime == 1) {
              ElMessage({
                type: "error",
                message: "网络连接已断开，正在尝试重新连接",
              });
            }
            console.log("ws已断开");
            if (this.autoReconnect) {
              this.createConnection()
                .then(() => {
                  for (const callback of this.eventList.reconnect) {
                    callback("reconnect", {}, "", this);
                  }
                })
                .catch((e) => {});
            }
          }, 1000);
        };

        this.ws.onerror = (error) => {
          for (const callback of this.eventList.error) {
            callback("error", {}, "", this);
          }
          this.reconnect();
          console.log(error);
          reject(error);
        };
      }
    });
  }

  reconnect() {
    this.ws?.close();
  }

  closeConnection() {
    if (this.ws) {
      this.autoReconnect = false; //手动断开连接不自动重连
      this.ws.close();
    }
  }

  send(name: string, data: RequestParams | null = null) {
    if (this.connecting) {
      this.initList.push(() => {
        this.ws?.send(JSON.stringify(data ? { name, data } : { name }));
      });
    } else {
      this.ws?.send(JSON.stringify(data ? { name, data } : { name }));
    }
  }

  setHeartBeatFunction(func: { (): void }) {
    this.heartBeat = func;
  }

  on(name: string, callback: WebSocketCallBack) {
    if (!this.eventList[name]) {
      this.eventList[name] = [];
    }
    this.eventList[name].push(callback);
  }
}

export default new WS({ url: config.webSocket.url });
