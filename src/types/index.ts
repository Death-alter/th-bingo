import { AxiosResponse } from "axios";

export interface RequestParams {
  [index: string]: any;
}

export interface StoreData {
  status?: string;
  data?: any;
  error?: any;
}

export interface VuexState {
  [index: string]: StoreData;
}

export interface ActionHandler {
  (res: AxiosResponse, data: StoreData, params: RequestParams): StoreData;
}

export interface MutationHandler {
  (newVal: RequestParams, oldVal: StoreData): StoreData;
}

interface StoreItem {
  name: string;
  default: any;
  dataHandler?: ActionHandler | MutationHandler;
}

export interface StoreAction extends StoreItem {
  actionName: string;
  url: string;
  method?: string;
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
