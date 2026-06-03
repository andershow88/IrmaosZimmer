import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bcryptjs"],
  turbopack: {
    // Suprime o aviso de "multiple lockfiles" (pode existir um
    // package-lock.json antigo em $HOME).
    root: process.cwd(),
  },
};

export default nextConfig;
