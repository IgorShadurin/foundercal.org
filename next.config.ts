import type { NextConfig } from "next";
import aliases from "./data/research-aliases.json";
const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(aliases).map(([from, to]) => ({
      source: `/deadline/${from}`,
      destination: `/deadline/${to}`,
      permanent: true,
    }));
  },
};
export default nextConfig;
