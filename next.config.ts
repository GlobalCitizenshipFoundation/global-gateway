import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  webpack: (config: Configuration) => {
    if (process.env.NODE_ENV === "development") {
      if (config.module && config.module.rules) {
        config.module.rules.push({
          test: /\.(jsx|tsx)$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: "@dyad-sh/nextjs-webpack-component-tagger",
        });
      }
    }
    return config;
  },
};

export default nextConfig;