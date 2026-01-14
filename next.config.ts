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
  // Permitir acceso desde dispositivos en la red local durante desarrollo
  // @ts-ignore - Propiedad nueva en Next.js 16+
  allowedDevOrigins: ["localhost:3000", "192.168.0.174:3000"],
};

export default nextConfig;
