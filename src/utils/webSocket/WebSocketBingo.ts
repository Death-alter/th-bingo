import WS from ".";
import {
  WebSocketRequestData,
  WebSocketPushData,
  WebSocketActionType,
  WebSocketCallBack,
  HeartBeatOption,
} from "./types";
import { v4 } from "uuid";

export class WebSocketBingo extends WS {
  private eventMap: {
    [index: string]: {
      action: WebSocketActionType;
      resolve: (value: unknown) => void;
      reject: (reason?: any) => void;
    };
  } = {};

  protected onMessage(event, resolve, reject) {
    let res = JSON.parse(event.data) as WebSocketRequestData | WebSocketPushData;
    if (res.hasOwnProperty("echo")) {
      res = <WebSocketRequestData>res;
      const ep = this.eventMap[res.echo];
      for (const callback of this.eventList[ep.action]) {
        callback(res.data);
        ep.resolve(res.data);
        delete this.eventList[res.echo];
      }
    } else {
      res = <WebSocketPushData>res;
      for (const callback of this.eventList[res.push_action]) {
        callback(res.data);
      }
    }
  }

  protected heartBeat(): HeartBeatOption {
    return {
      action: WebSocketActionType.HEART,
      data: { time: new Date().getTime() },
    };
  }

  protected send(action: WebSocketActionType, data: { [index: string]: any } | null = null) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error("未建立连接，请先调用createConnection()"));
        return;
      }
      const f = () => {
        const uuid = v4();
        this.ws?.send(
          JSON.stringify({
            action,
            data,
            echo: uuid,
          })
        );
        this.eventMap[uuid] = { action, resolve, reject };
        if (action === WebSocketActionType.HEART && this.heartBeatOption) {
          this.heartBeatTimeOutTimer = setTimeout(() => {
            this.reconnect();
          }, WS.timeOutSeconds);
        }
      };
      if (this.connecting) {
        this.eventStack.push(f);
      } else {
        f();
      }
    });
  }

  once(action: WebSocketActionType, callback: WebSocketCallBack) {
    super.once(action, callback);
  }

  on(action: WebSocketActionType, callback: WebSocketCallBack) {
    super.on(action, callback);
  }

  off(action: WebSocketActionType, callback?: WebSocketCallBack) {
    super.off(action, callback);
  }
}

export default new WebSocketBingo();
