#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const companyPagesDir = path.join(root, "apps/web/src/app/(app)/c/[companyId]");
const adminPagesDir = path.join(root, "apps/web/src/app/admin");
const companyRuleFile = path.join(root, "apps/web/src/lib/auth/company-route-access.ts");
const adminRuleFile = path.join(root, "apps/web/src/lib/admin/route-access.ts");
const apiDir = path.join(root, "apps/api/src");

const ALLOWED_TENANT_CONTROLLER_EXCEPTIONS = new Set([
  path.join(root, "apps/api/src/files/files.controller.ts"),
]);

function walk(dir, predicate) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath, predicate));
      continue;
    }
    if (predicate(fullPath)) results.push(fullPath);
  }
  return results;
}

function extractPatterns(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  return [...source.matchAll(/pattern:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function normalizeCompanyRoute(filePath) {
  const relative = path.relative(companyPagesDir, filePath).replace(/\\/g, "/");
  return relative.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "dashboard");
}

function normalizeAdminRoute(filePath) {
  const relative = path.relative(adminPagesDir, filePath).replace(/\\/g, "/");
  const local = relative.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "dashboard");
  return `/admin/${local}`.replace(/\/dashboard$/, "/dashboard");
}

function matchesPattern(routePath, pattern) {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return routePath === prefix || routePath.startsWith(`${prefix}/`);
  }
  return routePath === pattern;
}

function validateRouteCoverage() {
  const companyPatterns = extractPatterns(companyRuleFile);
  const adminPatterns = extractPatterns(adminRuleFile);

  const companyRoutes = walk(companyPagesDir, (filePath) => filePath.endsWith("/page.tsx")).map(normalizeCompanyRoute);
  const adminRoutes = walk(adminPagesDir, (filePath) => filePath.endsWith("/page.tsx") && !filePath.endsWith("/login/page.tsx")).map(normalizeAdminRoute);

  const unmatchedCompany = companyRoutes.filter(
    (routePath) => !companyPatterns.some((pattern) => matchesPattern(routePath, pattern)),
  );
  const unmatchedAdmin = adminRoutes.filter(
    (routePath) => !adminPatterns.some((pattern) => matchesPattern(routePath, pattern)),
  );

  return { unmatchedCompany, unmatchedAdmin };
}

function validateControllerGuards() {
  const controllerFiles = walk(apiDir, (filePath) => filePath.endsWith(".controller.ts"));
  const tenantMissing = [];
  const adminMissing = [];

  for (const filePath of controllerFiles) {
    const source = fs.readFileSync(filePath, "utf8");

    if (
      source.includes("@UseGuards(JwtAccessAuthGuard, CompanyScopeGuard)") &&
      !source.includes("PermissionGuard") &&
      !ALLOWED_TENANT_CONTROLLER_EXCEPTIONS.has(filePath)
    ) {
      tenantMissing.push(filePath);
    }

    if (
      filePath.includes(`${path.sep}apps${path.sep}api${path.sep}src${path.sep}admin${path.sep}`) &&
      source.includes("@UseGuards(JwtAccessAuthGuard, SuperAdminGuard)") &&
      !source.includes("AdminPermissionGuard")
    ) {
      adminMissing.push(filePath);
    }
  }

  return { tenantMissing, adminMissing };
}

const { unmatchedCompany, unmatchedAdmin } = validateRouteCoverage();
const { tenantMissing, adminMissing } = validateControllerGuards();

if (
  unmatchedCompany.length === 0 &&
  unmatchedAdmin.length === 0 &&
  tenantMissing.length === 0 &&
  adminMissing.length === 0
) {
  console.log("RBAC surface validation passed.");
  process.exit(0);
}

if (unmatchedCompany.length > 0) {
  console.error("Company pages missing route-access coverage:");
  unmatchedCompany.forEach((routePath) => console.error(`- ${routePath}`));
}

if (unmatchedAdmin.length > 0) {
  console.error("Admin pages missing route-access coverage:");
  unmatchedAdmin.forEach((routePath) => console.error(`- ${routePath}`));
}

if (tenantMissing.length > 0) {
  console.error("Tenant controllers missing PermissionGuard:");
  tenantMissing.forEach((filePath) => console.error(`- ${path.relative(root, filePath)}`));
}

if (adminMissing.length > 0) {
  console.error("Admin controllers missing AdminPermissionGuard:");
  adminMissing.forEach((filePath) => console.error(`- ${path.relative(root, filePath)}`));
}

process.exit(1);
