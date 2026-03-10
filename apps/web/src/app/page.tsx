import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>GST Billing Software</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Frontend scaffold (Phase 08 / FE-00). Use the links below to navigate to placeholder routes.
      </p>

      <ul style={{ marginTop: 20, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>
          <Link href="/login">/login</Link>
        </li>
        <li>
          <Link href="/c/00000000-0000-0000-0000-000000000001/dashboard">/c/[companyId]/dashboard</Link>
        </li>
        <li>
          <Link href="/admin/login">/admin/login</Link>
        </li>
      </ul>
    </main>
  );
}
