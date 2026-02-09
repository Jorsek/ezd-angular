const { createProxyMiddleware } = require('http-proxy-middleware');

console.log("middleware")
module.exports = function expressMiddleware(router) {
  // Basic Auth credentials for ezd backend (Storybook development only)
  const authHeader = 'Basic ' + Buffer.from('admin:123').toString('base64');

  // TODO: REMOVE THIS - Temporary direct proxy to turbo-dita for SSE testing
  // Once ezd proxy supports SSE streaming, remove this and use /ezdnxtgen path
  router.use(
    '/turbo-direct',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      changeOrigin: true,
      pathRewrite: {
        '^/turbo-direct': '', // Strip prefix
      },
    })
  );

  // Proxy /api requests to ezd backend
  router.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('Authorization', authHeader);
      },
    })
  );

  // Proxy /ezdnxtgen requests to ezd backend (preserve full path)
  router.use(
    '/ezdnxtgen',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      logLevel: 'debug',
      // Disable buffering for SSE support
      buffer: false,
      pathRewrite: {
        '^/': '/ezdnxtgen/', // Add /ezdnxtgen prefix back (router.use strips it)
      },
      onProxyReq: (proxyReq) => {
        console.log("proxied")
        proxyReq.setHeader('Authorization', authHeader);
        // Tell upstream not to compress (which causes buffering)
        proxyReq.setHeader('Accept-Encoding', 'identity');
      },
      // SSE support - disable response buffering
      onProxyRes: (proxyRes, req, res) => {
        // Disable compression buffering for SSE
        if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
          res.setHeader('X-Accel-Buffering', 'no');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.flushHeaders();
        }
      },
    })
  );
};
