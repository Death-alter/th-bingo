// vuex.d.ts
import { ComponentCustomProperties } from "vue";
import { Store } from "vuex";
import { VuexState } from "@/types";
import Mit from "@/mitt";

declare module "@vue/runtime-core" {
  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<VuexState>;
    $bus: typeof Mit;
  }
}
