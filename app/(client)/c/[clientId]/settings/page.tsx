import { requireRole } from '@/lib/auth/guards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/client/language-switcher';

export const dynamic = 'force-dynamic';

interface ClientSettingsPageProps {
  params: { clientId: string };
}

export default async function ClientSettingsPage({ params }: ClientSettingsPageProps) {
  await requireRole(['client']);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Idioma</p>
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
