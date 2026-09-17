import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

// Libera o host público do R2 para o next/image.
const remotePatterns: RemotePattern[] = [
  { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
];

const base = process.env.R2_PUBLIC_BASE_URL;
if (base) {
  try {
    const host = new URL(base).hostname;
    if (!host.endsWith(".r2.dev")) {
      remotePatterns.push({ protocol: "https", hostname: host, pathname: "/**" });
    }
  } catch {
    // URL inválida no env — ignorado (o next/image simplesmente não libera).
  }
}

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
