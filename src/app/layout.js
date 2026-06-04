import { Database } from "lucide-react";
import Link from "next/link";
import { getReportArtifacts, getScopePluralLabel, getWorkbenchData } from "../lib/public-data.js";
import "./globals.css";
import { PrimaryNav } from "./primary-nav.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Evidence Workbench",
  description: "Traceable evidence browser"
};

export default async function RootLayout({ children }) {
  const data = await getWorkbenchData();
  const scopeLabel = getScopePluralLabel(data);
  const literatureReview = getReportArtifacts(data).find((report) => report.artifact_type === "literature_review");

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
              <PrimaryNav scopeLabel={scopeLabel} literatureReviewHref={literatureReview ? `/reports/${literatureReview.id}` : undefined} />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
