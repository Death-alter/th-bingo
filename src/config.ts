class WebSocketConfig {
  public static readonly url = process.env.VUE_APP_WS_API || ""; //webSocket地址
  public static readonly heartBeatInterval = 20; //发送心跳间隔秒数
  public static readonly maxRetryTimes = 3; //连接失败后尝试重新连接的最大次数
  public static readonly timeOutSeconds = 2; //发出心跳后多少秒没收到消息判断掉线
}

const difficultyList = ["L", "EX", "PH"];

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
    name: "虹龙洞",
  },
];

const predefineColors = [
  "hsl(16, 100%, 50%)",
  "hsl(33, 100%, 50%)",
  "hsl(51, 100%, 50%)",
  "hsl(120, 72%, 75%)",
  "hsl(181, 100%, 41%)",
  "hsl(210, 100%, 56%)",
  "hsl(322, 80%, 43%)",
];

const gameTypeList = [
  {
    name: "bingo 标准赛",
    type: 1,
    timeLimit: 30, //分钟
    countdown: 180, //秒
  },
  {
    name: "bingo BP赛",
    type: 2,
    timeLimit: 60,
    countdown: 300,
  },
  {
    name: "bingo 自定义",
    type: 3,
    timeLimit: 60,
    countdown: 300,
  },
];

class Config {
  public static readonly webSocket = WebSocketConfig;
  public static readonly difficultyList = difficultyList;
  public static readonly gameOptionList = gameOptionList;
  public static readonly predefineColors = predefineColors;
  public static readonly gameTypeList = gameTypeList;
}

export default Config;
