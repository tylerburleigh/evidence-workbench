"use client";

import {
  Activity,
  Archive,
  BookOpen,
  ClipboardList,
  FileText,
  Home,
  Menu,
  Network,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname, item) {
  if (item.href === "/") {
    return pathname === "/";
  }

  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavItems({ items, pathname }) {
  return items.map((item) => {
    const Icon = item.icon;
    const active = isActive(pathname, item);
    return (
      <Link aria-current={active ? "page" : undefined} className={`nav-link${active ? " active" : ""}`} href={item.href} key={item.key}>
        <Icon size={15} />
        {item.label}
      </Link>
    );
  });
}

export function PrimaryNav({ scopeLabel, literatureReviewHref }) {
  const pathname = usePathname();
  const items = [
    { key: "overview", href: "/", label: "Overview", icon: Home },
    { key: "scope", href: "/scope", label: scopeLabel, icon: Network },
    { key: "sources", href: "/sources", label: "Sources", icon: Archive },
    { key: "activity", href: "/activity", label: "Activity", icon: Activity },
    ...(literatureReviewHref
      ? [{ key: "literature", href: literatureReviewHref, label: "Literature Review", icon: BookOpen, exact: true }]
      : []),
    { key: "reports", href: "/reports", label: "Reports", icon: FileText },
    { key: "methods", href: "/methods", label: "Methods", icon: ShieldCheck },
    { key: "review", href: "/admin/review", label: "Review", icon: ClipboardList }
  ];
  const activeItem = items.find((item) => isActive(pathname, item));

  return (
    <>
      <nav className="nav nav-desktop" aria-label="Primary">
        <NavItems items={items} pathname={pathname} />
      </nav>
      <details className="mobile-nav">
        <summary>
          <Menu size={16} />
          <span>{activeItem?.label ?? "Menu"}</span>
        </summary>
        <nav className="mobile-nav-panel" aria-label="Primary">
          <NavItems items={items} pathname={pathname} />
        </nav>
      </details>
    </>
  );
}
