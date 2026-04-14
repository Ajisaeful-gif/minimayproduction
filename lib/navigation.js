export const dashboardItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: "dashboard"
};

export const navigationGroups = [
  {
    title: "PPIC",
    key: "ppic",
    icon: "clipboard",
    sections: [
      {
        title: "Proses Produksi",
        icon: "flow",
        items: [
          { label: "Plan Cutting", href: "/ppic/plan-cutting", icon: "calendar" },
          { label: "Racking", href: "/ppic/racking", icon: "rack" },
          { label: "Plan Sewing", href: "/ppic/plan-sewing", icon: "sewing" },
          { label: "Supply", href: "/ppic/supply", icon: "supply" }
        ]
      },
      {
        title: "Inventory",
        icon: "inventory",
        items: [
          { label: "Penggunaan Kain", href: "/ppic/inventory", icon: "inventory" }
        ]
      }
    ]
  },
  {
    title: "Produksi",
    key: "produksi",
    icon: "factory",
    sections: [
      {
        title: "Proses Produksi",
        icon: "flow",
        items: [
          { label: "Cutting", href: "/produksi/cutting", icon: "cutting" },
          { label: "Seri", href: "/produksi/seri", icon: "layers" }
        ]
      }
    ]
  },
  {
    title: "Report",
    key: "report",
    icon: "report",
    sections: [
      {
        title: "Laporan Produksi",
        icon: "report",
        items: [
          { label: "Plan Cutting", href: "/report/plan-cutting", icon: "calendar" },
          { label: "Cutting", href: "/report/cutting", icon: "cutting" },
          { label: "Seri", href: "/report/seri", icon: "layers" },
          { label: "Racking", href: "/report/racking", icon: "rack" },
          { label: "Supply", href: "/report/supply", icon: "supply" }
        ]
      }
    ]
  },
  {
    title: "User",
    key: "user",
    icon: "users",
    sections: [
      {
        title: "Akses",
        icon: "shield",
        items: [
          { label: "User Management", href: "/user/management", icon: "userCard" }
        ]
      }
    ]
  }
];

export function findNavigationItem(pathname) {
  if (pathname === dashboardItem.href) {
    return {
      group: {
        title: "Dashboard",
        key: "dashboard",
        icon: dashboardItem.icon
      },
      section: {
        title: "Overview",
        icon: dashboardItem.icon
      },
      item: dashboardItem
    };
  }

  for (const group of navigationGroups) {
    for (const section of group.sections) {
      for (const item of section.items) {
        if (item.href === pathname) {
          return { group, section, item };
        }
      }
    }
  }

  return null;
}
