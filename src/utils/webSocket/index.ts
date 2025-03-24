import config from "@/config";
import { HeartBeatOption, WebSocketCallBack, WebSocketEventType } from "./types";

export default abstract class WS {
  protected ws: WebSocket | null = null;
  protected eventList: { [index: string]: Array<WebSocketCallBack> } = {
    [WebSocketEventType.CONNECT]: [],
    [WebSocketEventType.RECONNECT]: [],
    [WebSocketEventType.DISCONNECT]: [],
    [WebSocketEventType.ERROR]: [],
  };
  protected eventStack: Array<{ (): void }> = [];
  protected heartBeatTimer = 0;
  protected heartBeatTimeOutTimer = 0;
  protected retryTime = 0;
  protected autoReconnect = true;

  public static readonly heartBeatInterval: number = config.webSocket.heartBeatInterval; //单位：秒
  public static readonly retryLimit: number = config.webSocket.maxRetryTimes; //最大重连次数
  public static readonly timeOutSeconds: number = config.webSocket.timeOutSeconds;

  get bufferedAmount() {
    return this.ws?.bufferedAmount;
  }

  get state() {
    return this.ws?.readyState;
  }

  get connecting() {
    return this.ws && this.state === this.ws.CONNECTING;
  }

  get connected() {
    return this.ws && this.state === this.ws.OPEN;
  }

  protected abstract onMessage(event: Event, resolve: (value: unknown) => void, reject: (reason?: any) => void);

  protected abstract heartBeat(): HeartBeatOption | null | undefined;

  protected abstract send(action: string, data: { [index: string]: any } | null): void;

  protected heartBeatOption = this.heartBeat();

  createConnection(url) {
    return new Promise((resolve, reject) => {
      if (WS.heartBeatInterval <= WS.timeOutSeconds) {
        reject(new Error("心跳间隔必须大于超时时间"));
        return;
      }
      if (this.connecting) {
        return;
      }
      if (this.retryTime >= WS.retryLimit) {
        reject(new Error("无法连接到服务器，请检查网络连接并刷新页面重试"));
        return;
      }
      if (this.ws == null) {
        this.retryTime++;
        this.ws = new WebSocket(url);
        this.autoReconnect = true; //连接以后开启自动重连
        this.ws.onopen = (event) => {
          if (this.retryTime > 1) {
            resolve(event);
            return;
          }
          this.retryTime = 0;
          for (const func of this.eventStack) {
            func();
          }
          this.eventStack = [];
          for (const callback of this.eventList.connect) {
            callback();
          }
          if (this.heartBeatOption) {
            this.heartBeatTimer = window.setInterval(() => {
              this.send(this.heartBeatOption!.action, this.heartBeatOption!.data);
            }, WS.heartBeatInterval * 1000);
          }
          console.log("ws已连接");
          resolve(event);
        };

        this.ws.onmessage = (event) => {
          if (this.heartBeatOption) {
            clearTimeout(this.heartBeatTimeOutTimer);
          }
          this.onMessage(event, resolve, reject);
        };

        this.ws.onclose = (event) => {
          setTimeout(() => {
            window.clearInterval(this.heartBeatTimer);
            this.ws = null;
            for (const callback of this.eventList.disconnect) {
              callback({});
            }
            if (this.retryTime == 1) {
              reject(new Error("网络连接已断开，正在尝试重新连接"));
            }
            console.log("ws已断开");
            if (this.autoReconnect) {
              this.createConnection(url)
                .then(() => {
                  for (const callback of this.eventList.reconnect) {
                    callback({});
                  }
                })
                .catch((e) => {});
            }
          }, 1000);
        };

        this.ws.onerror = (error) => {
          for (const callback of this.eventList.error) {
            callback();
          }
          if (this.state !== WebSocket.OPEN) {
            this.reconnect();
          }
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

  once(action: string, callback: WebSocketCallBack) {
    const f = (data) => {
      callback(data);
      this.off(action, f);
    };
    this.on(action, f);
  }

  on(action: string, callback: WebSocketCallBack) {
    if (!this.eventList[action]) {
      this.eventList[action] = [];
    }
    this.eventList[action].push(callback);
  }

  off(action: string, callback?: WebSocketCallBack) {
    if (this.eventList[action]) {
      if (callback) {
        for (let i = 0; i < this.eventList[action].length; i++) {
          if (this.eventList[action][i] === callback) {
            this.eventList[action].splice(i, 1);
            break;
          }
        }
      } else {
        delete this.eventList[action];
      }
    }
  }
}
