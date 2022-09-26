//默认对象类型
export interface defaultData {
  [index: string]: any;
}

export interface RequestParams {
  [index: string]: any;
}

export interface StoreData {
  status?: string;
  data?: defaultData | null;
  error?: any;
}

export interface VuexState {
  [index: string]: StoreData;
}

export interface ActionHandler {
  (res: defaultData, data: defaultData, params: RequestParams): defaultData;
}

export interface MutationHandler {
  (newVal: RequestParams, oldVal: defaultData): defaultData;
}

export interface HandlerList {
  pending?: ActionHandler;
  replied?: ActionHandler;
  received?: ActionHandler;
  error?: ActionHandler;
}

interface StoreItem {
  name: string;
  default: any;
  dataHandler?: ActionHandler | MutationHandler | HandlerList;
}

export interface StoreAction extends StoreItem {
  actionName: string;
  wsName: string;
}

export interface StoreMutation extends StoreItem {
  mutationName: string;
}

export interface EventCallback {
  (event: Event): void;
}

export interface UserData {
  name: string;
  token: string;
  [index: string]: any;
}
