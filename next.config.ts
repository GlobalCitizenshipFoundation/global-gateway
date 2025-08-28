import type { NextConfig } from "next";
import type { Configuration } from "webpack"; // Import Configuration type from webpack

const nextConfig: NextConfig = {
  webpack: (config: Configuration) => { // Explicitly type config as Configuration
    if (process.env.NODE_ENV === "development") {
      if (config.module && config.module.rules) { // Explicitly check if module and rules exist
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