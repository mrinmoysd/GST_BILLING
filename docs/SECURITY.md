Security, Compliance & Privacy
================================

Authentication & Authorization
- Passwords: store hashed with Argon2 or bcrypt (work factor configured in env).
- Access tokens: JWT with short TTL (e.g., 15m) and refresh tokens stored server-side.
- RBAC: roles (owner, manager, accountant, staff) + fine-grained permissions. Enforce in services.

Data protection
- TLS everywhere (ACM certificates, HTTPS enforced).
- Encrypt sensitive fields at rest using KMS (bank_details, payment refs).
- Database: RDS encryption at rest.

Audit & Logging
- Log important actions to `audit_logs` with user and company context.
- Centralize logs and use structured JSON logs.

GDPR / Privacy
- Provide data export & deletion endpoints for customers’ personal data.
- Keep retention policy configurable.

PCI & Payment Data
- Do not store card data. Use tokenized flows from payment gateways. If storing payment methods, use gateway token IDs only.

Vulnerabilities
- Regular dependency scanning (Snyk/Dependabot).
- Static code analysis and secrets scanning in CI.

Pen-testing & hardening
- Regular penetration tests pre-prod and yearly.

Third-party integrations
- Vet providers (WhatsApp Business API, SMS gateways) and secure webhooks with signatures.

Incident response
- Maintain an incident runbook and public status page; rotate keys on compromise.
