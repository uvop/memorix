/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/graphql",
          destination: `http://localhost:8080/graphql`,
        },
      ];
    }

    return [];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

module.exports = nextConfig;
