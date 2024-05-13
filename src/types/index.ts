//默认对象类型
export interface Data<T> {
  [index: string]: T;
}

export interface DefaultData {
  [index: string]: any;
}

export interface RequestParams {
  [index: string]: any;
}

export interface StoreData {
  status?: string;
  data?: DefaultData | null;
  error?: any;
}

export interface VuexState {
  [index: string]: StoreData;
}

export interface ActionHandler {
  (res: DefaultData, data: DefaultData, params: RequestParams | Array<any>, trigger?: string): DefaultData;
}

export interface MutationHandler {
  (newVal: any, oldVal: DefaultData, trigger?: string): DefaultData | Promise<DefaultData>;
}

export interface HandlerList {
  pending?: ActionHandler;
  replied?: ActionHandler;
  received?: ActionHandler;
  error?: ActionHandler;
}

interface StoreItem {
  name: string;
  default: DefaultData | Array<DefaultData>;
  dataHandler?: ActionHandler | MutationHandler | HandlerList;
}

export interface StoreAction extends StoreItem {
  actionName: string;
  wsName: string;
  noParams?: boolean;
}

export interface StoreMutation extends StoreItem {
  mutationName: string;
  wsName?: string;
}

export interface EventCallback {
  (event: Event): void;
}

export interface UserData {
  name: string;
  token: string;
  [index: string]: any;
}

export type Constructor<T> = new (...args: any[]) => T;

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

export interface SpellCardInfo {
  desc: string;
  game: string;
  id: number;
  index: number;
  name: string;
  rank: string;
  star: number;
}
