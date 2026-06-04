"use client";

import { Archive, ArrowRight, ClipboardList, FileText, FlaskConical, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const ICONS = {
  Archive,
  ClipboardList,
  FileText,
  FlaskConical
};

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined || value === null || value === "" ? [] : [value];
}

function compareValues(left, right, direction = "asc") {
  const multiplier = direction === "desc" ? -1 : 1;

  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * multiplier;
  }

  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    numeric: true,
    sensitivity: "base"
  }) * multiplier;
}

function Badge({ label, tone = "neutral" }) {
  return <span className={tone === "neutral" ? "badge" : `badge ${tone}`}>{label}</span>;
}

function ResultCard({ item, variant }) {
  const Icon = ICONS[item.icon] ?? FileText;
  const content = (
    <>
      <span>
        <strong>
          {variant === "cards" ? <Icon className="icon" size={16} /> : null}
          {item.title}
        </strong>
        {item.body ? <span className="row-kicker">{item.body}</span> : null}
        {item.kicker ? <span className="row-kicker">{item.kicker}</span> : null}
      </span>
      <span className="meta-row">
        {(item.badges ?? []).map((badge) => (
          <Badge key={`${item.id}-${badge.label}`} label={badge.label} tone={badge.tone} />
        ))}
        {variant === "cards" ? <ArrowRight size={15} /> : null}
      </span>
    </>
  );

  if (variant === "list") {
    return (
      <Link className="row-link index-row-link" href={item.href}>
        {content}
      </Link>
    );
  }

  return (
    <Link className="card card-link index-card" href={item.href}>
      <div className="card-title">{content}</div>
    </Link>
  );
}

export function RecordIndex({
  emptyMessage = "No records found.",
  filters = [],
  gridClass = "grid two",
  items = [],
  sortOptions = [],
  variant = "cards"
}) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState(() => Object.fromEntries(filters.map((filter) => [filter.id, "all"])));
  const [sortId, setSortId] = useState(sortOptions[0]?.id ?? "title");

  const activeSort = sortOptions.find((option) => option.id === sortId) ?? sortOptions[0];
  const normalizedQuery = query.trim().toLowerCase();
  const resultItems = useMemo(() => {
    return items
      .filter((item) => {
        const searchText = String(item.searchText ?? `${item.title} ${item.body ?? ""} ${item.kicker ?? ""}`).toLowerCase();
        if (normalizedQuery && !searchText.includes(normalizedQuery)) {
          return false;
        }

        return filters.every((filter) => {
          const selected = filterValues[filter.id];
          if (!selected || selected === "all") {
            return true;
          }

          return asArray(item.filterValues?.[filter.id]).includes(selected);
        });
      })
      .sort((left, right) =>
        compareValues(left.sortValues?.[activeSort?.id] ?? left.title, right.sortValues?.[activeSort?.id] ?? right.title, activeSort?.direction)
      );
  }, [activeSort, filterValues, filters, items, normalizedQuery]);

  return (
    <div className="record-index">
      <div className="record-controls">
        <label className="control-field search-field">
          <span>Search</span>
          <span className="input-shell">
            <Search size={15} />
            <input
              aria-label="Search records"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search records"
              type="search"
              value={query}
            />
          </span>
        </label>

        {filters.map((filter) => (
          <label className="control-field" key={filter.id}>
            <span>{filter.label}</span>
            <select
              aria-label={filter.label}
              onChange={(event) => setFilterValues((current) => ({ ...current, [filter.id]: event.target.value }))}
              value={filterValues[filter.id] ?? "all"}
            >
              <option value="all">All</option>
              {(filter.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}

        {sortOptions.length ? (
          <label className="control-field sort-field">
            <span>Sort</span>
            <select aria-label="Sort records" onChange={(event) => setSortId(event.target.value)} value={sortId}>
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="result-count" aria-live="polite">
          {resultItems.length}/{items.length}
        </div>
      </div>

      {resultItems.length ? (
        <div className={variant === "list" ? "list" : gridClass}>
          {resultItems.map((item) => (
            <ResultCard item={item} key={item.id} variant={variant} />
          ))}
        </div>
      ) : (
        <div className="empty">{emptyMessage}</div>
      )}
    </div>
  );
}
