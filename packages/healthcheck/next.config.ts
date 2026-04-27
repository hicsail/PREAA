import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    async headers() {
        return [
        {
            source: "/api/:path*",
            headers: [
            { key: "Access-Control-Allow-Origin", value: "*" },
            { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
            { key: "Access-Control-Allow-Headers", value: "Content-Type" },
            ]
        }
        ]
    }
};

export default nextConfig;
