const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactive Turbopack en forçant Webpack pour la compatibilité avec next-pwa
  webpack: (config) => {
    return config;
  },
  // On ajoute un objet turbopack vide pour signifier qu'on gère le conflit
  experimental: {
    turbopack: {}
  }
};

module.exports = withPWA(nextConfig);
