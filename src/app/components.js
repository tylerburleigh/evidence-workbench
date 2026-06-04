import {
  ArrowRight,
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  FileText,
  FlaskConical,
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

export function Breadcrumbs({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      {items.map((item, index) => (
        <span className="breadcrumb-item" key={`${item.href ?? item.label}-${index}`}>
          {index > 0 ? <ChevronRight size={13} /> : null}
          {item.href ? (
            <Link className="text-link" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Section({ id, title, note, children }) {
  return (
    <section className="section" id={id}>
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

function supportRoleTone(role) {
  if (role === "supports" || role === "direct_support") {
    return "good";
  }

  if (role === "counterexample") {
    return "danger";
  }

  if (role === "qualifies" || role === "boundary_condition" || role === "adjacent_evidence") {
    return "warn";
  }

  return "neutral";
}

export function SupportMap({ findings = [], sources = [], support }) {
  const findingById = new Map(findings.map((finding) => [finding.id, finding]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const supportFindings = (support.finding_ids ?? []).map((id) => findingById.get(id) ?? { id, name: id });
  const supportSources = (support.source_ids ?? []).map((id) => sourceById.get(id) ?? { id, name: id });

  return (
    <div className="support-item">
      <div className="support-title-row">
        <h3>{support.label}</h3>
        <span className="meta-row no-top-margin">
          {support.support_role ? <Badge tone={supportRoleTone(support.support_role)}>{statusLabel(support.support_role)}</Badge> : null}
          {support.claim_field ? <Badge>{statusLabel(support.claim_field)}</Badge> : null}
        </span>
      </div>
      <p>{support.conclusion}</p>
      {support.rationale ? <p className="support-rationale">{support.rationale}</p> : null}
      {supportFindings.length || supportSources.length ? (
        <div className="support-trace">
          {supportFindings.length ? (
            <div>
              <div className="trace-label">
                <FlaskConical size={13} /> Findings
              </div>
              <div className="link-list">
                {supportFindings.map((finding) => (
                  <Link className="text-link" href={`/findings/${finding.id}`} key={finding.id}>
                    {finding.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {supportSources.length ? (
            <div>
              <div className="trace-label">
                <Archive size={13} /> Sources
              </div>
              <div className="link-list">
                {supportSources.map((source) => (
                  <span className="support-source-link" key={source.id}>
                    <Link className="text-link" href={`/sources/${source.id}`}>
                      {source.name}
                    </Link>
                    {source.source_type ? <SourceAccessBadge source={source} /> : null}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {support.limitations?.length ? (
        <div className="meta-row">
          {support.limitations.map((limitation, index) => (
            <Badge key={`${limitation}-${index}`}>{limitation}</Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppraisalGateBadge({ report }) {
  if (!report?.evidence_appraisal_gate?.eligible) {
    return <Badge>No gate</Badge>;
  }

  if (report.evidence_appraisal_gate.ready) {
    return (
      <Badge tone="good">
        <CheckCircle2 size={13} /> Appraisal ready
      </Badge>
    );
  }

  return (
    <Badge tone="warn">
      <CircleAlert size={13} /> Appraisal pending
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
