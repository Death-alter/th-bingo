import WS from ".";
import {
  WebSocketResponseData,
  WebSocketPushData,
  WebSocketActionType,
  WebSocketCallBack,
  HeartBeatOption,
  WebSocketPushActionType,
} from "./types";
import { v4 } from "uuid";
import { ElMessage } from "element-plus";
import config from "@/config";

export class WebSocketBingo extends WS {
  protected autoSendHeartBeat = true;
  public heartBeatSendTime = 0;
  private eventMap: {
    [index: string]: {
      action: WebSocketActionType;
      resolve: (value: unknown) => void;
      reject: (reason?: any) => void;
    };
  } = {};

  protected onMessage(event, resolve, reject) {
    let res = JSON.parse(event.data) as WebSocketResponseData | WebSocketPushData;
    if (res.hasOwnProperty("echo")) {
      res = <WebSocketResponseData>res;
      const ep = this.eventMap[res.echo];
      if (res.code === 0) {
        ep.resolve(res.data);
      } else {
        ElMessage.error(res.msg);
        ep.reject(res);
      }
      if (this.eventList[ep.action]) {
        for (const callback of this.eventList[ep.action]) {
          callback(res.data);
        }
      }
      delete this.eventMap[res.echo];
    } else {
      res = <WebSocketPushData>res;

      if (this.eventList[res.push_action]) {
        for (const callback of this.eventList[res.push_action]) {
          callback(res.data);
        }
      } else {
        console.log(`事件${res.push_action}未被监听`);
      }
    }
  }

  protected heartBeat(): HeartBeatOption {
    return {
      action: WebSocketActionType.HEART,
      data: { time: new Date().getTime() },
    };
  }

  send(action: WebSocketActionType, data: { [index: string]: any } | null = null) {
    return new Promise<any>((resolve, reject) => {
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
          this.heartBeatSendTime = new Date().getTime();
          this.heartBeatTimeOutTimer = setTimeout(() => {
            if(++this.heartbeat_miss > config.webSocket.heartBeatMaxFailureTimes) {
              this.reconnect();
              this.heartbeat_miss = 0;
            }
          }, WS.timeOutSeconds * 1000);
        }
      };
      if (!this.connected) {
        this.eventStack.push(f);
      } else {
        f();
      }
    });
  }

  once<T = any>(action: WebSocketActionType, callback: WebSocketCallBack<T>) {
    super.once(action, callback);
  }

  on<T = any>(action: WebSocketActionType | WebSocketPushActionType, callback: WebSocketCallBack<T>) {
    super.on(action, callback);
  }

  off<T = any>(action: WebSocketActionType | WebSocketPushActionType, callback?: WebSocketCallBack<T>) {
    super.off(action, callback);
  }
}

export default new WebSocketBingo();
