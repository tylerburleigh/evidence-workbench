import { Activity, Archive, ClipboardList, Database, FileText, Home, Network, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getScopePluralLabel, getWorkbenchData } from "../lib/public-data.js";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Evidence Workbench",
  description: "Traceable evidence browser"
};

export default async function RootLayout({ children }) {
  const data = await getWorkbenchData();
  const scopeLabel = getScopePluralLabel(data);

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link href="/" className="brand">
                <span className="brand-mark" aria-hidden="true">
                  <Database size={18} />
                </span>
                <span className="brand-text">
                  <span className="brand-name">{data.domainPack.domain.name}</span>
                  <span className="brand-subtitle">{data.domainPack.domain.id}</span>
                </span>
              </Link>
              <nav className="nav" aria-label="Primary">
                <Link className="nav-link" href="/">
                  <Home size={15} />
                  Overview
                </Link>
                <Link className="nav-link" href="/scope">
                  <Network size={15} />
                  {scopeLabel}
                </Link>
                <Link className="nav-link" href="/sources">
                  <Archive size={15} />
                  Sources
                </Link>
                <Link className="nav-link" href="/activity">
                  <Activity size={15} />
                  Activity
                </Link>
                <Link className="nav-link" href="/reports">
                  <FileText size={15} />
                  Reports
                </Link>
                <Link className="nav-link" href="/methods">
                  <ShieldCheck size={15} />
                  Methods
                </Link>
                <Link className="nav-link" href="/admin/review">
                  <ClipboardList size={15} />
                  Review
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
