import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  FileText,
  Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { getSourceAccessInfo, statusLabel } from "../lib/public-data.js";

export function Badge({ children, tone = "neutral" }) {
  const className = tone === "neutral" ? "badge" : `badge ${tone}`;
  return <span className={className}>{children}</span>;
}

export function StatusBadge({ status }) {
  const tone =
    status === "published" || status === "baseline"
      ? "good"
      : status === "submitted" || status === "in_review"
        ? "info"
        : status === "needs_revision"
          ? "warn"
          : status === "rejected"
            ? "danger"
            : "neutral";

  return <Badge tone={tone}>{statusLabel(status)}</Badge>;
}

export function SourceAccessBadge({ source }) {
  const access = getSourceAccessInfo(source);
  return <Badge tone={access.tone}>{access.label}</Badge>;
}

export function EmptyState({ children }) {
  return <div className="empty">{children}</div>;
}

export function Metric({ icon: Icon = CircleDashed, label, value }) {
  return (
    <div className="metric">
      <div className="metric-label">
        <Icon size={14} />
        {label}
      </div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children, aside }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {children ? <p className="lede">{children}</p> : null}
      </div>
      {aside ? <div className="meta-row">{aside}</div> : null}
    </div>
  );
}

export function Section({ title, note, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {note ? <div className="section-note">{note}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function RecordCard({ href, title, body, meta, icon: Icon = FileText }) {
  const content = (
    <>
      <div className="card-title">
        <span>
          <Icon className="icon" size={16} /> {title}
        </span>
        {href ? <ArrowRight size={15} /> : null}
      </div>
      {body ? <div className="card-body">{body}</div> : null}
      {meta ? <div className="meta-row">{meta}</div> : null}
    </>
  );

  if (!href) {
    return <div className="card">{content}</div>;
  }

  return (
    <Link href={href} className="card card-link">
      {content}
    </Link>
  );
}

export function RowLink({ href, title, kicker, status }) {
  return (
    <Link className="row-link" href={href}>
      <span>
        <strong>{title}</strong>
        {kicker ? <span className="row-kicker">{kicker}</span> : null}
      </span>
      {status ? <StatusBadge status={status} /> : <ArrowRight size={16} />}
    </Link>
  );
}

export function SupportMap({ support }) {
  return (
    <div className="support-item">
      <h3>{support.label}</h3>
      <p>{support.conclusion}</p>
      {support.limitations?.length ? (
        <div className="meta-row">
          {support.limitations.map((limitation) => (
            <Badge key={limitation}>{limitation}</Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ReviewGateBadge({ report }) {
  if (!report?.evidence_review_gate?.eligible) {
    return <Badge>No gate</Badge>;
  }

  if (report.evidence_review_gate.ready) {
    return (
      <Badge tone="good">
        <CheckCircle2 size={13} /> Review ready
      </Badge>
    );
  }

  return (
    <Badge tone="warn">
      <CircleAlert size={13} /> Review pending
    </Badge>
  );
}

export function ExternalSourceLink({ source }) {
  const url = source.urls?.[0];
  if (!url) {
    return null;
  }

  return (
    <a className="text-link" href={url}>
      <LinkIcon size={13} /> Source URL
    </a>
  );
}

export function BreadcrumbLink({ href, children }) {
  return (
    <Link className="text-link" href={href}>
      <BookOpen size={13} /> {children}
    </Link>
  );
}
