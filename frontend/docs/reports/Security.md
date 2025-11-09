# Security - Summary

- Security headers configured in `frontend/next.config.js` (CSP, HSTS, etc.).
- Avoid unsafe inline scripts unless necessary; prefer `nonce` or strict CSP.
- Periodically test headers via `frontend/scripts/test-security-headers.js`.
