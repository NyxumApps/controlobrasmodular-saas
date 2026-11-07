import type { NextConfig } from "next";

const allowedDevOrigins = [
  process.env.V0_RUNTIME_URL,
  process.env.V0_DEV_APP_URL,
  process.env.V0_BUILD_URL,
  process.env.V0_SANDBOX_URL,
].flatMap((origin) => {
  if (!origin) return [];
  try {
    return [new URL(origin).hostname];
  } catch {
    return [];
  }
});

const nextConfig: NextConfig = {
  allowedDevOrigins,
  transpilePackages: ["@workspace/api-client-react", "@workspace/api-zod", "@workspace/auth", "@workspace/db"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
