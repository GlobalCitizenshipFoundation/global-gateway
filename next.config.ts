import type { NextConfig } from "next";
// import type { Configuration } from "webpack"; // Commented out as it's no longer needed

const nextConfig: NextConfig = {
  // webpack: (config: Configuration) => { // Commented out custom webpack config
  //   if (process.env.NODE_ENV === "development") {
  //     if (config.module && config.module.rules) {
  //       config.module.rules.push({
  //         test: /\.(jsx|tsx)$/,
  //         exclude: /node_modules/,
  //         enforce: "pre",
  //         use: "@dyad-sh/nextjs-webpack-component-tagger",
  //       });
  //     }
  //   }
  //   return config;
  // },
};

export default nextConfig;