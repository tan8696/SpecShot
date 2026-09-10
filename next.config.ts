import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  webpack: (config) => {
    // pdfjs-dist references an optional Node-only `canvas` module; the
    // browser build never uses it, so stub it out to keep the build quiet.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
