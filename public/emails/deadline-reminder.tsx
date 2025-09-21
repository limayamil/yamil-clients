import * as React from 'react';
import { EmailLayout } from './layout';

interface DeadlineReminderEmailProps {
  projectName: string;
  deadline: string;
  pendingCount: number;
}

export function DeadlineReminderEmail({ projectName, deadline, pendingCount }: DeadlineReminderEmailProps) {
  return (
    <EmailLayout title={`Recordatorio de deadline · ${projectName}`}>
      <p>Quedan {pendingCount} pendientes para completar antes del {deadline}.</p>
      <p>Ingresá a FlowSync para revisar los materiales y aprobaciones pendientes.</p>
    </EmailLayout>
  );
}
