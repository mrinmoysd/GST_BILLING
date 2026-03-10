Infrastructure & Deployment
===========================

Overview
- Cloud: AWS recommended. Alternatives: GCP or Azure.
- Components: RDS (Postgres), ElastiCache (Redis), S3, ECS/EKS or Lambda, ALB, Route53, ACM.

Recommended architecture
- VPC with public/private subnets across at least 2 AZs.
- RDS Postgres with Multi-AZ and read replicas.
- ElastiCache Redis for session cache and BullMQ queues.
- S3 for file storage (invoices, logos) with lifecycle rules and versioning.
- Dockerized services deployed to ECS Fargate or EKS.
- Use ALB with autoscaling groups and health checks.

Workers & Async
- Use BullMQ (Redis) for job queues (pdf-gen, notifications, exports).
- Run workers as separate services/tasks to scale independently.

Storage & backups
- RDS automated snapshots + daily pg_dump to S3 (encrypted) for long-term retention.
- S3 lifecycle: 30d frequent, then Glacier for archival.

CI/CD
- GitHub Actions pipeline to build Docker images, run tests, run migrations, and deploy to ECS/EKS.
- Use Terraform for infra as code and parameterize environment (dev/stage/prod).

Observability
- Metrics: Prometheus + Grafana or CloudWatch metrics.
- Tracing: OpenTelemetry and distributed traces.
- Error tracking: Sentry.

Secrets management
- Use AWS Secrets Manager or HashiCorp Vault.

Cost controls
- Use reserved instances for RDS if stable; autoscale app tasks based on CPU/RPS.

Disaster recovery
- DR region with standby DB or cross-region read replica; periodic failover test.

Local dev
- Provide docker-compose with Postgres, Redis and Minio (S3) for local development.
