export interface WebSocketRequestData {
  action: WebSocketActionType;
  data: { [index: string]: any };
  echo: string;
}

export interface WebSocketResponseData {
  code: number;
  msg: string;
  data: { [index: string]: any };
  echo: string;
}

export interface WebSocketPushData {
  push_action: WebSocketPushActionType;
  data: { [index: string]: any };
}

export type WebSocketCallBack<T = any> = { (data?: T): void };

export interface HeartBeatOption {
  action: string;
  data: { [index: string]: any };
}

export enum WebSocketEventType {
  CONNECT = "connect",
  RECONNECT = "reconnect",
  DISCONNECT = "disconnect",
  ERROR = "error",
}

export enum WebSocketActionType {
  HEART = "heart",
  LOGIN = "login",
  CREATE_ROOM = "create_room",
  GET_ROOM_CONFIG = "get_room_config",
  UPDATE_ROOM_CONFIG = "update_room_config",
  JOIN_ROOM = "join_room",
  GET_ROOM = "get_room",
  LEAVE_ROOM = "leave_room",
  STAND_UP = "stand_up",
  SIT_DOWN = "sit_down",
  SET_PHASE = "set_phase",
  GET_PHASE = "get_phase",
  START_GAME = "start_game",
  STOP_GAME = "stop_game",
  RESET_ROOM = "reset_room",
  GM_WARN_PLAYER = "gm_warn_player",
  UPDATE_CHANGE_CARD_COUNT = "update_change_card_count",
  GET_ALL_SPELLS = "get_all_spells",
  PAUSE = "pause",
  SET_DEBUG_SPELLS = "set_debug_spells",
  SELECT_SPELL = "select_spell",
  FINISH_SPELL = "finish_spell",
  UPDATE_SPELL_STATUS = "update_spell_status",
  START_BAN_PICK = "start_ban_pick",
  BAN_PICK = "ban_pick",

  //bp赛
  BP_GAME_BAN_PICK = "bp_game_ban_pick",
  BP_GAME_NEXT_ROUND = "bp_game_next_round",
}

export enum WebSocketPushActionType {
  PUSH_UPDATE_ROOM_CONFIG = "push_update_room_config",
  PUSH_JOIN_ROOM = "push_join_room",
  PUSH_LEAVE_ROOM = "push_leave_room",
  PUSH_STAND_UP = "push_stand_up",
  PUSH_SIT_DOWN = "push_sit_down",
  PUSH_START_GAME = "push_start_game",
  PUSH_STOP_GAME = "push_stop_game",
  PUSH_RESET_ROOM = "push_reset_room",
  PUSH_GM_WARN_PLAYER = "push_gm_warn_player",
  PUSH_UPDATE_CHANGE_CARD_COUNT = "push_update_change_card_count",
  PUSH_PAUSE = "push_pause",
  PUSH_UPDATE_SEPLL_STATUS = "push_update_spell_status",
  PUSH_BAN_PICK = "push_ban_pick",
  PUSH_KICK = "push_kick",

  //bp赛
  PUSH_BP_GAME_NEXT_ROUND = "push_bp_game_next_round",
}
