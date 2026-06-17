import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import type { IconType } from "react-icons";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LINKS: {
  href: string;
  title: string;
  description: string;
  icon: IconType;
  accent: string;
  iconBg: string;
}[] = [
  {
    href: "/admin/branches",
    title: "Branches / Filiais",
    description: "Manage branches, contracts, and employee associations",
    icon: PlatformIcons.building,
    accent: "from-teal-500/10 to-transparent",
    iconBg: "bg-teal-500/10 text-teal-600",
  },
  {
    href: "/admin/companies",
    title: "Companies / Tenants",
    description: "Multi-company SaaS management",
    icon: PlatformIcons.companies,
    accent: "from-blue-500/10 to-transparent",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    href: "/admin/settings",
    title: "System settings",
    description: "Layout, branding, operational config",
    icon: PlatformIcons.admin,
    accent: "from-violet-500/10 to-transparent",
    iconBg: "bg-violet-500/10 text-violet-600",
  },
  {
    href: "/users",
    title: "User management",
    description: "Access user administration",
    icon: PlatformIcons.users,
    accent: "from-emerald-500/10 to-transparent",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    href: "/roles",
    title: "Roles & permissions",
    description: "Permission matrix configuration",
    icon: PlatformIcons.roles,
    accent: "from-amber-500/10 to-transparent",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
  {
    href: "/audit-logs",
    title: "Audit logs",
    description: "LGPD compliance trail",
    icon: PlatformIcons.audit,
    accent: "from-rose-500/10 to-transparent",
    iconBg: "bg-rose-500/10 text-rose-600",
  },
];

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Administration"
        description="System configuration, tenants, and governance"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block animate-fade-in">
              <Card
                variant="elevated"
                className="h-full overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={cn("h-1 bg-gradient-to-r", item.accent)} />
                <CardHeader className="pb-[8px]">
                  <div className="flex items-start justify-between">
                    <div className={cn("rounded-xl p-[12px]", item.iconBg)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <PlatformIcons.arrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-base mt-[12px]">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      <Card variant="outline" className="mt-[20px] border-dashed bg-muted/20">
        <CardContent className="py-[20px] text-sm text-muted-foreground flex items-center gap-[10px]">
          <PlatformIcons.server className="h-5 w-5 shrink-0" />
          Operational logs — placeholder for future integration with observability stack.
        </CardContent>
      </Card>
    </div>
  );
}
