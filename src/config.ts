class WebSocketConfig {
  public static readonly url = process.env.VUE_APP_WS_API || ""; //webSocket地址
  public static readonly heartBeatInterval = 20; //发送心跳间隔秒数
  public static readonly maxRetryTimes = 3; //连接失败后尝试重新连接的最大次数
  public static readonly timeOutSeconds = 2; //发出心跳后多少秒没收到消息判断掉线
}

const gameOptionList = [
  {
    code: "6",
    name: "红魔乡",
  },
  {
    code: "7",
    name: "妖妖梦",
  },
  {
    code: "8",
    name: "永夜抄",
  },
  {
    code: "10",
    name: "风神录",
  },
  {
    code: "11",
    name: "地灵殿",
  },
  {
    code: "12",
    name: "星莲船",
  },
  {
    code: "13",
    name: "神灵庙",
  },
  {
    code: "14",
    name: "辉针城",
  },
  {
    code: "15",
    name: "绀珠传",
  },
  {
    code: "16",
    name: "天空璋",
  },
  {
    code: "17",
    name: "鬼形兽",
  },
  {
    code: "18",
    name: "红龙洞",
  },
];

const predefineColors = [
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
];

class Config {
  public static readonly webSocket = WebSocketConfig;
  public static readonly gameOptionList = gameOptionList;
  public static readonly predefineColors = predefineColors;
}

export default Config;
