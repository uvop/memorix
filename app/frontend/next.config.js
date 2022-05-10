/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (true || process.env.NODE_ENV === "development") {
      return [
        {
          source: "/graphql",
          destination: `http://localhost:8080/graphql`,
        },
      ];
    }

    return [];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/SchemaGraph",
        permanent: true,
      },
    ];
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
