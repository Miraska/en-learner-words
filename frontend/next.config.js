/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH;
    const legacy = '/admin-panel-x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8';
    if (!adminPath) return [
      {
        source: `${legacy}`,
        destination: '/404',
        permanent: false,
      },
      {
        source: `${legacy}/:path*`,
        destination: '/404',
        permanent: false,
      },
    ];
    return [
      {
        source: `${legacy}`,
        destination: '/404',
        permanent: false,
      },
      {
        source: `${legacy}/:path*`,
        destination: '/404',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH;
    const adminDir = '/admin-panel-x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8';
    const rules = [];
    if (adminPath && adminPath !== adminDir) {
      rules.push(
        // Map env-based path to the actual admin directory
        {
          source: `${adminPath}`,
          destination: `${adminDir}`,
        },
        {
          source: `${adminPath}/:path*`,
          destination: `${adminDir}/:path*`,
        },
      );
    }
    // Fallback favicon route if .ico is missing/broken
    rules.push({ source: '/favicon.ico', destination: '/favicon.svg' });
    return rules;
  },
  async headers() {
    // Get API URL from environment or use default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const apiHost = new URL(apiUrl).origin;
    const wsHost = apiHost.replace(/^http/, 'ws');
    
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Разрешаем Яндекс.Метрику (оба домена)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://mc.yandex.ru https://mc.yandex.com",
              "style-src 'self' 'unsafe-inline'",
              // Разрешаем пиксели/графику Метрики (оба домена)
              "img-src 'self' data: blob: https://mc.yandex.ru https://mc.yandex.com",
              "font-src 'self'",
              // Разрешаем сетевые соединения Метрики (оба домена)
              `connect-src 'self' ${apiHost} ${wsHost} https://mc.yandex.ru https://mc.yandex.com`,
              // Разрешаем фреймы Метрики (если они используются)
              "frame-src https://mc.yandex.ru https://mc.yandex.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'"
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;