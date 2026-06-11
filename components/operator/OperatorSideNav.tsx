"use client";

import { LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/operator",
    icon: LayoutDashboard,
    isActive: (pathname: string) =>
      pathname === "/operator" || pathname.startsWith("/operator/tenants"),
    label: "租户",
  },
  {
    href: "/operator/account",
    icon: Settings,
    isActive: (pathname: string) => pathname === "/operator/account",
    label: "账号配置",
  },
];

export function OperatorSideNav() {
  const pathname = usePathname();

  return (
    <div className="operator-side-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive(pathname);

        return (
          <Link aria-current={active ? "page" : undefined} href={item.href} key={item.href}>
            <Icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
