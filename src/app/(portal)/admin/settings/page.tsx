import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="System settings"
        description="Branding and layout placeholders"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-[16px]">
            <div className="space-y-[6px]">
              <Label>Company display name</Label>
              <Input defaultValue="Moonsofts Tecnologia" disabled />
            </div>
            <div className="space-y-[6px]">
              <Label>Primary color</Label>
              <Input type="color" defaultValue="#2563eb" className="h-10 w-20" disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              Logo upload — placeholder for future media API
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-[8px] text-sm text-muted-foreground">
            <p>• GOV.BR — not connected</p>
            <p>• WhatsApp — not connected</p>
            <p>• ERP / eSocial — not connected</p>
            <p>• Active Directory — not connected</p>
            <Button variant="outline" size="sm" className="mt-[8px]" disabled>
              Configure integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
