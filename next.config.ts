import type { NextConfig } from "next";
const config: NextConfig = {
  // PGlite loads its WASM asset at runtime; bundling it changes module behavior.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};
export default config;
