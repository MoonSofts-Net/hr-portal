import { PlatformIcons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";

const SECURITY_ITEMS = [
  {
    icon: PlatformIcons.lock,
    title: "No sensitive data in localStorage",
    description: "Session references only in mock mode. Production uses HttpOnly cookies.",
  },
  {
    icon: PlatformIcons.eye,
    title: "CPF masking & minimal exposure",
    description: "Personal data is masked in lists. Full values only where business requires.",
  },
  {
    icon: PlatformIcons.server,
    title: "Tenant context on every request",
    description: "API layer designed to send tenant scope safely — backend is source of truth.",
  },
  {
    icon: PlatformIcons.key,
    title: "Secure document downloads",
    description: "requestSecureDownloadUrl() — signed URLs, never permanent public file paths.",
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      className="py-[80px] lg:py-[100px] scroll-mt-[88px] auth-gradient-panel auth-grid-pattern relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(221_83%_53%/0.15),transparent_50%)]" />
      <div className="relative mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <div className="grid lg:grid-cols-2 gap-[48px] items-center">
          <div className="text-[white]">
            <p className="text-sm font-semibold text-[white]/70 uppercase tracking-widest mb-[12px]">
              Security & LGPD
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Compliance-first architecture
            </h2>
            <p className="mt-[16px] text-[white]/75 leading-relaxed max-w-md">
              Frontend permission guards, audit logs for sensitive actions, and cross-tenant
              prevention events — built for Brazilian corporate HR requirements.
            </p>
            <ul className="mt-[28px] space-y-[12px] text-sm text-[white]/90">
              {[
                "Route + PermissionGuard protection",
                "Audit: login, upload, download, approval, permission updates",
                "MFA placeholder for future integration",
              ].map((item) => (
                <li key={item} className="flex items-center gap-[10px]">
                  <PlatformIcons.check className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
            {SECURITY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="bg-[white]/10 border-[white]/15 backdrop-blur-sm text-[white]"
                >
                  <CardContent className="p-[20px]">
                    <Icon className="h-6 w-6 text-primary mb-[12px]" />
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="mt-[8px] text-xs text-[white]/70 leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
