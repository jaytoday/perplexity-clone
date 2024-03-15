/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",
  browserNodeBuiltinsPolyfill: {
    modules: {
      https: "empty",
      querystring: "empty",
      fs: "empty",
      worker_threads: "empty",
      process: "empty",
      "stream/web": "empty",
      buffer: "empty"
    }
  }
};
