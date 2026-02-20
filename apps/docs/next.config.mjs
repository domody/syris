import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/overview/what-is-syris",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX({
  // customise the config file path
  configPath: "source.config.ts",
});

export default withMDX(config);
