"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  dashboardItem,
  findNavigationItem,
  navigationGroups
} from "@/lib/navigation";
import { useAuth } from "@/components/auth-provider";

function Icon({ name }) {
  const common = {
    fill: "none",
    height: 18,
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    width: 18
  };

  const icons = {
    dashboard: (
      <svg {...common}>
        <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
      </svg>
    ),
    factory: (
      <svg {...common}>
        <path d="M3 20h18" />
        <path d="M5 20V10l5 3V9l5 3V7l4 2v11" />
      </svg>
    ),
    clipboard: (
      <svg {...common}>
        <path d="M9 4h6" />
        <path d="M9 2h6v4H9z" />
        <path d="M7 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1" />
      </svg>
    ),
    users: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M14 4.13a4 4 0 0 1 0 5.74" />
      </svg>
    ),
    flow: (
      <svg {...common}>
        <path d="M7 6h10" />
        <path d="M7 12h10" />
        <path d="M7 18h10" />
        <circle cx="5" cy="6" r="1" />
        <circle cx="5" cy="12" r="1" />
        <circle cx="5" cy="18" r="1" />
      </svg>
    ),
    shield: (
      <svg {...common}>
        <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
      </svg>
    ),
    cutting: (
      <svg {...common}>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <path d="M8.2 7.8 20 20" />
        <path d="M8.2 16.2 13 11.4" />
        <path d="M14.5 9.8 20 4" />
      </svg>
    ),
    layers: (
      <svg {...common}>
        <path d="M12 4 4 8l8 4 8-4-8-4z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 16 8 4 8-4" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <path d="M8 2v4M16 2v4M3 10h18" />
        <rect height="16" rx="2" width="18" x="3" y="4" />
      </svg>
    ),
    rack: (
      <svg {...common}>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <path d="M6 4v16M18 4v16" />
      </svg>
    ),
    sewing: (
      <svg {...common}>
        <path d="M6 20c5-1 7-6 7-11V5" />
        <path d="M10 5h8" />
        <path d="M16 5v10" />
        <path d="M8 12h7" />
      </svg>
    ),
    supply: (
      <svg {...common}>
        <path d="M3 7h13l4 4v6H3z" />
        <path d="M16 7v4h4" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
      </svg>
    ),
    inventory: (
      <svg {...common}>
        <path d="M4 7h16v4H4z" />
        <path d="M5 11h14v8H5z" />
        <path d="M9 15h6" />
      </svg>
    ),
    userCard: (
      <svg {...common}>
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <circle cx="9" cy="10" r="2.5" />
        <path d="M6.5 16c.8-1.3 2-2 3.5-2s2.7.7 3.5 2" />
      </svg>
    )
  };

  return <span className="nav-icon">{icons[name] ?? icons.dashboard}</span>;
}

function getSectionKey(groupKey, sectionTitle) {
  return `${groupKey}:${sectionTitle}`;
}

function buildOpenState(pathname) {
  const active = findNavigationItem(pathname);

  return {
    groups:
      active && active.group.key !== "dashboard"
        ? { [active.group.key]: true }
        : {},
    sections:
      active && active.group.key !== "dashboard"
        ? { [getSectionKey(active.group.key, active.section.title)]: true }
        : {}
  };
}

function getVisibleNavigationGroups(role) {
  if (role === "admin") {
    return navigationGroups;
  }

  if (role === "ppic") {
    return navigationGroups.filter((group) => group.key === "ppic");
  }

  if (role === "produksi") {
    return navigationGroups.filter((group) => group.key === "produksi");
  }

  return [];
}

function SidebarContent({ pathname, role, onNavigate }) {
  const active = findNavigationItem(pathname);
  const activeGroupKey = active?.group.key;
  const activeSectionTitle = active?.section.title;
  const [openState, setOpenState] = useState(() => buildOpenState(pathname));
  const previousPathnameRef = useRef(pathname);
  const visibleNavigationGroups = getVisibleNavigationGroups(role);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    const enteredDashboard =
      pathname === dashboardItem.href && previousPathname !== pathname;

    if (enteredDashboard) {
      setOpenState((current) =>
        Object.keys(current.groups).length || Object.keys(current.sections).length
          ? { groups: {}, sections: {} }
          : current
      );
      previousPathnameRef.current = pathname;
      return;
    }

    if (pathname === dashboardItem.href || !activeGroupKey || !activeSectionTitle) {
      previousPathnameRef.current = pathname;
      return;
    }

    setOpenState((current) => ({
      groups: {
        ...current.groups,
        [activeGroupKey]: true
      },
      sections: {
        ...current.sections,
        [getSectionKey(activeGroupKey, activeSectionTitle)]: true
      }
    }));
    previousPathnameRef.current = pathname;
  }, [activeGroupKey, activeSectionTitle, pathname]);

  function toggleGroup(groupKey) {
    setOpenState((current) => {
      const isOpen = Boolean(current.groups[groupKey]);

      if (isOpen) {
        const nextSections = Object.fromEntries(
          Object.entries(current.sections).filter(
            ([sectionKey]) => !sectionKey.startsWith(`${groupKey}:`)
          )
        );

        return {
          groups: {
            ...current.groups,
            [groupKey]: false
          },
          sections: nextSections
        };
      }

      return {
        groups: {
          ...current.groups,
          [groupKey]: true
        },
        sections: current.sections
      };
    });
  }

  function toggleSection(groupKey, sectionTitle) {
    const sectionKey = getSectionKey(groupKey, sectionTitle);

    setOpenState((current) => ({
      groups: {
        ...current.groups,
        [groupKey]: true
      },
      sections: {
        ...current.sections,
        [sectionKey]: !current.sections[sectionKey]
      }
    }));
  }

  return (
    <div className="sidebar-content">
      <div className="brand-block">
        <div className="brand-badge">MM</div>
        <div>
          <p className="brand-eyebrow">Sistem Produksi</p>
          <h1 className="brand-title">Minimay</h1>
        </div>
      </div>

      <div className="sidebar-scroll-area">
        <nav className="nav-groups">
          <Link
            className={`nav-dashboard-link ${
              pathname === dashboardItem.href ? "is-active" : ""
            }`}
            href={dashboardItem.href}
            onClick={onNavigate}
          >
            <div className="nav-label">
              <Icon name={dashboardItem.icon} />
              <span>Dashboard</span>
            </div>
          </Link>

          {visibleNavigationGroups.map((group) => {
            const isGroupOpen = Boolean(openState.groups[group.key]);

            return (
              <div
                className={`nav-group ${isGroupOpen ? "is-open" : ""}`}
                key={group.key}
              >
                <button
                  aria-expanded={isGroupOpen}
                  className={`nav-group-toggle ${isGroupOpen ? "is-open" : ""}`}
                  onClick={() => toggleGroup(group.key)}
                  type="button"
                >
                  <span className="nav-label">
                    <Icon name={group.icon} />
                    <span className="nav-group-title">{group.title}</span>
                  </span>
                </button>

                {isGroupOpen
                  ? group.sections.map((section) => {
                      const sectionKey = getSectionKey(group.key, section.title);
                      const isSectionOpen = Boolean(openState.sections[sectionKey]);

                      return (
                        <div className="nav-section" key={`${group.key}-${section.title}`}>
                          <button
                            aria-expanded={isSectionOpen}
                            className={`nav-section-toggle ${
                              isSectionOpen ? "is-open" : ""
                            }`}
                            onClick={() => toggleSection(group.key, section.title)}
                            type="button"
                          >
                            <span className="nav-label nav-label-sub">
                              <Icon name={section.icon} />
                              <span className="nav-section-title">{section.title}</span>
                            </span>
                          </button>

                          {isSectionOpen ? (
                            <div className="nav-links">
                              {section.items.map((item) => {
                                const isActive = pathname === item.href;

                                return (
                                  <Link
                                    className={`nav-link ${isActive ? "is-active" : ""}`}
                                    href={item.href}
                                    key={item.href}
                                    onClick={onNavigate}
                                  >
                                    <span className="nav-label nav-label-item">
                                      <Icon name={item.icon} />
                                      <span className="nav-link-text">{item.label}</span>
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  : null}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-label">Deploy Siap</p>
          <p className="sidebar-footer-copy">
            Frontend: Vercel
            <br />
            Backend: Next.js API
            <br />
            Database: PostgreSQL
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = findNavigationItem(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { authEnabled, profile, role, signOut, user } = useAuth();
  const effectiveRole = role || (authEnabled ? "" : "admin");
  const topbarLabel =
    active?.group.key === "dashboard"
      ? "Dashboard"
      : active
        ? `${active.group.title} / ${active.section.title}`
        : "Dashboard";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const topbarTitle =
    active?.item.label ??
    (effectiveRole === "ppic"
      ? "PPIC"
      : effectiveRole === "produksi"
        ? "Produksi"
        : "Minimay");
  const userName = authEnabled
    ? profile?.nama || user?.email || "Mode Lokal"
    : "Guest Mode";
  const userRoleLabel = !authEnabled
    ? "Guest"
    : role
      ? effectiveRole === "admin"
        ? "Admin"
        : effectiveRole === "ppic"
          ? "PPIC"
          : effectiveRole === "produksi"
            ? "Produksi"
            : "User"
      : "Tanpa Login";

  async function handleLogout() {
    if (!authEnabled) {
      router.replace("/dashboard");
      return;
    }

    await signOut();
    router.replace("/login");
  }

  return (
    <div className="dashboard-shell">
      <aside className="desktop-sidebar">
        <SidebarContent pathname={pathname} role={effectiveRole} />
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="topbar-eyebrow">{topbarLabel}</p>
            <h2 className="topbar-title">{topbarTitle}</h2>
          </div>
          <div className="topbar-actions">
            <div className="topbar-user-card">
              <p className="topbar-user-name">{userName}</p>
              <p className="topbar-user-role">{userRoleLabel}</p>
            </div>
            {user ? (
              <button className="button" onClick={handleLogout} type="button">
                Logout
              </button>
            ) : null}
            <button
              className="menu-toggle"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              Menu
            </button>
          </div>
        </header>

        <main className="page-wrap">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="mobile-drawer">
          <button
            aria-label="Tutup menu"
            className="mobile-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="mobile-drawer-panel">
            <div className="mobile-drawer-head">
              <p>Menu Navigasi</p>
              <button
                className="drawer-close"
                onClick={() => setMobileOpen(false)}
                type="button"
              >
                Tutup
              </button>
            </div>
            <SidebarContent
              onNavigate={() => setMobileOpen(false)}
              pathname={pathname}
              role={effectiveRole}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
