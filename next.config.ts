import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exponer variables de entorno al Edge Runtime (proxy)
  env: {
    APP_MODE: process.env.APP_MODE,
  },
  output: "standalone",
  // Configurar dominios permitidos para next/image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pokemontcg.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.tcgdex.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
