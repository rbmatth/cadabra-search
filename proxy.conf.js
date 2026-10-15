// Dev-server proxy (`npm start`). The app fetches search results straight from
// the browser, so a search URL on another origin needs CORS headers that
// Amazon does not send. Requests to /amazon/* on the dev server are forwarded
// server-side instead, which sidesteps CORS for local development.
//
// Use it by opening the app with the proxied URL as the search URL:
//   http://localhost:4200/?http://localhost:4200/amazon/s?k=
//
// Set SEARCH_PROXY_TARGET to forward somewhere other than amazon.com.
const target = process.env.SEARCH_PROXY_TARGET || 'https://www.amazon.com';

module.exports = {
  '/amazon': {
    target,
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/amazon': '' },
    headers: {
      // Amazon serves a bot-check page to the default Node user agent.
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
    },
  },
};
