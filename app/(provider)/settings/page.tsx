import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole(['provider']);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Configura la frecuencia de recordatorios y avisos automáticos.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Plantillas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Gestioná plantillas de etapas para distintos tipos de proyecto.</p>
        </CardContent>
      </Card>
    </div>
  );
}
