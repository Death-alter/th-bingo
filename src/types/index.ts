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
}

export const enum GameStatus {
  NOT_STARTED = 0,
  COUNT_DOWN = 1,
  STARTED = 2,
  PAUSED = 3,
  ENDED = 4,
}
