# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Active development |
| < 1.0   | ⚠️ Pre-release     |

## Reporting a Vulnerability

WorkOutApp is a local-first PWA with no backend, no authentication, and no
server-side data processing. The attack surface is minimal — all data lives
in the user's browser (localStorage).

That said, if you find a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. Send details to [INSERT EMAIL] or open a draft security advisory on GitHub
3. You'll receive a response within 72 hours

### What to include

- Type of issue (XSS, CSRF, data exposure, etc.)
- Steps to reproduce
- Browser and OS versions
- Suggested fix (if any)

## Security Considerations

- All data is stored locally in the browser via localStorage
- No user accounts, no passwords, no server communication
- The app uses Content Security Policy headers when deployed
- External dependencies are kept minimal and audited via `npm audit`
