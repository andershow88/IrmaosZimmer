import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Em Railway usamos `next start` (Nixpacks), então não precisamos de "standalone".
  serverExternalPackages: ["bcryptjs"],
  turbopack: {
    // Suprime o aviso de "multiple lockfiles" (pode existir um
    // package-lock.json antigo em $HOME).
    root: process.cwd(),
  },
};

export default nextConfig;
