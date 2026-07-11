/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Remove the small dev indicator that Next renders in the bottom-left corner.
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  eslint: {
    // Type safety is enforced by the typecheck script. Lint runs separately in CI.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
