export const enum Role {
  HOST = 0,
  PLAYER = 1,
  WATHCER = 2,
}

export const enum BingoType {
  STANDARD = 1,
  BP = 2,
  LINK = 3,
}

export const enum BpStatus {
  IS_A_BAN = 0,
  IS_A_PICK = 1,
  IS_B_BAN = 2,
  IS_B_PICK = 3,
  SELECT_OPEN_EX = 4,
  BP_FINISH = 5,
}

export const enum SpellStatus {
  BANNED = -1,
  NONE = 0,
  A_SELECTED = 1,
  BOTH_SELECTED = 2,
  B_SELECTED = 3,
  A_ATTAINED = 5,
  BOTH_ATTAINED = 6,
  B_ATTAINED = 7,
  BOTH_HIDDEN = 0x1000,
  LEFT_SEE_ONLY = 0x1001,
  RIGHT_SEE_ONLY = 0x1002,
  ONLY_REVEAL_GAME = 0x1010,
  ONLY_REVEAL_GAME_STAGE = 0x1011,
  ONLY_REVEAL_STAR = 0x1012,
}

export const enum GameStatus {
  NOT_STARTED = 0,
  COUNT_DOWN = 1,
  STARTED = 2,
  PAUSED = 3,
  ENDED = 4,
}

export interface Spell {
  index: number; // 符卡唯一ID
  game: string; // 作品
  name: string; // 符卡名
  rank: string; // 难度
  star: number; // 星级
  desc: string; // 符卡描述
  id: number; // 在对应作品里的id
  fastest: number, //理论最快速度
  miss_time: number, //miss平均时间
  power_weight: number, //底力系数，熟练度系数=1-底力系数
  difficulty: number,  //难度
  change_rate: number, //变化率，越高说明门槛的性质越强
  max_capRate: number, //最高收率
}

export interface GameData {
  spells: Spell[];
  spell_status: number[]; // 25张符卡的收取状态
  left_time: number; // 倒计时剩余时间，单位：毫秒
  status: number; // 0-未开始，1-赛前倒计时中，2-开始，3-暂停中，4-结束
  left_cd_time: number; // 选卡cd剩余时间，单位：毫秒
  push_ban_pick: { [index: string]: any } | null; // 赛前BP的相关数据，同push_ban_pick协议的参数，如果不是赛前BP则为null
  bp_data: {
    // BP赛相关数据，如果不是BP赛则为null
    whose_turn: number; // 轮到谁了，0-左边，1-右边
    ban_pick: number; // 0-选，1-ban，2-轮到收卡了
    spell_failed_count_a: number[]; // 左边玩家25张符卡的失败次数
    spell_failed_count_b: number[]; // 右边玩家25张符卡的失败次数
  };
  link_data: { [index: string]: any } | null; // BP赛相关数据，同push_link_data协议的参数，如果不是BP赛则为null
  normal_data: {
    which_board_a: number;
    which_board_b: number;
    is_portal_a: number[];
    is_portal_b: number[];
    get_on_which_board: number[];
  }
  spells2: Spell[] | [];
}

export interface OneSpell{
  board_idx: number;
  spell_idx: number;
  spell: Spell;
  player_name: string;
}

export interface RoomConfig {
  rid: string; // 房间名
  type: BingoType; // 1-标准赛，2-BP赛，3-link赛
  game_time: 30; // 游戏总时间（不含倒计时），单位：分
  countdown: 5; // 倒计时，单位：秒
  games: []; // 含有哪些作品
  ranks: []; // 含有哪些游戏难度，也就是L卡和EX卡
  need_win: 3; // 需要胜利的局数，例如2表示bo3
  difficulty: 3; // 难度（影响不同星级的卡的分布），1对应E，2对应N，3对应L，其它对应随机
  cd_time: 30; // 选卡cd，收卡后要多少秒才能选下一张卡
  reserved_type: 1; // 纯客户端用的一个类型字段，服务器只负责透传
  blind_setting: 1;
  spell_version: 1;
  dual_board: 0;
  portal_count: 5;
  blind_reveal_level: 2;
  diff_level: 3;
  use_ai: false;
  ai_strategy_level: 2;
  ai_style: 0;
  ai_base_power: 5;
  ai_experience: 5;
}
