/* eslint-disable */
"use strict";

const path = require("path");

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
  outputDir: "dist",
  assetsDir: "static",
  lintOnSave: false,
  productionSourceMap: false,
  // webpack-dev-server 相关配置
  devServer: {
    host: "0.0.0.0",
    port: "8888",
    open: true,
    // proxy: {
    //   [process.env.VUE_APP_BASE_API]: {
    //     target: `http://`,
    //     changeOrigin: true,
    //     pathRewrite: {
    //       ["^" + process.env.VUE_APP_BASE_API]: "",
    //     },
    //   },
    // },
  },
  configureWebpack: {
    name: "th-bingo",
    resolve: {
      alias: {
        "@": resolve("src"),
        components: "@/components"
      }
    },
  },
  chainWebpack: (config) => {
    config.plugin('define').tap((definitions) => {
      Object.assign(definitions[0], {
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
      })
      return definitions
    })
  },
};
