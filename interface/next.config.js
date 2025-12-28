/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Only externalize better-sqlite3 on server
      config.externals.push({
        "better-sqlite3": "commonjs better-sqlite3",
      });
    }
    return config;
  },
  // Turbopack config to silence warning (we use webpack for better-sqlite3)
  turbopack: {},
  // Ensure db module is server-only
  serverComponentsExternalPackages: ["better-sqlite3"],
};

module.exports = nextConfig;

