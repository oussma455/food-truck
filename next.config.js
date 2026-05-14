module.exports = {
  reactStrictMode: true,
  eslint: {
    // Les fichiers dans public sont du code généré ou tiers
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};
