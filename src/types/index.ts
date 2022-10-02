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
  (res: DefaultData, data: DefaultData, params: RequestParams | Array<any>): DefaultData;
}

export interface MutationHandler {
  (newVal: RequestParams | Array<any>, oldVal: DefaultData): DefaultData;
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
