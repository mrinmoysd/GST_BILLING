Product Roadmap & Milestones
=============================

MVP (8-12 weeks, 1-2 devs + 1 QA)
- Core: Company onboarding, customers, products, invoicing (tax calc), invoice PDF generation, products stock snapshot, basic reports (sales, stock), auth + RBAC, S3 storage, Postgres + Prisma, Next.js UI skeleton.
- Deliverables: API, DB migrations, Next.js Admin UI (CRUD flows), PDF worker, docker-compose for local dev.

Phase 2 (12 weeks)
- Purchases & suppliers, stock movements, purchase returns, low stock alerts, email/whatsapp sending, payment recording, subscription billing (Stripe/Razorpay), admin panel for super-admin.

Phase 3 (12 weeks)
- GSTR reports (GSTR-1, 3B, HSN summary), ledger & basic accounting reports, POS mode & barcode printing, thermal support, export features.

Phase 4+ (ongoing)
- AI invoice OCR, auto GST filing connectors, advanced analytics, marketplace integrations (Shopify), multi-warehouse, advanced permissions.

V2 Distributor / Wholesaler Track
- Quotations / estimates
- Sales orders
- Warehouses / godowns and stock transfer
- Salesperson attribution and reporting
- Distributor analytics for sales, dues, stock, and collections
- Pilot-led go-to-market for trading and wholesale businesses

Team & Roles
- Backend engineers (NestJS/Prisma) x2
- Frontend (Next.js/Tailwind) x1-2
- DevOps/SRE x1 (part time)
- QA x1

Estimated cost considerations (monthly prod)
- RDS + read replicas: $200-600
- Redis: $50-200
- S3 storage + CloudFront: $20-100
- ECS/EKS compute: $100-600

Success Metrics
- Time to create invoice < 2s (API latency)
- PDF generated within 30s of invoice creation (async)
- 99.9% uptime
