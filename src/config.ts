class WebSocketConfig {
  public static readonly url = process.env.VUE_APP_WS_API || ""; //webSocket地址
  public static readonly heartBeatInterval = 20; //发送心跳间隔秒数
  public static readonly maxRetryTimes = 3; //连接失败后尝试重新连接的最大次数
  public static readonly timeOutSeconds = 2; //发出心跳后多少秒没收到消息判断掉线
}

class Config {
  public static readonly webSocket = WebSocketConfig;
}

export default Config;
