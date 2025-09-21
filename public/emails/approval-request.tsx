import * as React from 'react';
import { EmailLayout } from './layout';

interface ApprovalRequestEmailProps {
  projectName: string;
  stageName: string;
  previewUrl?: string;
}

export function ApprovalRequestEmail({ projectName, stageName, previewUrl }: ApprovalRequestEmailProps) {
  return (
    <EmailLayout title={`Revisión pendiente: ${stageName}`}>
      <p>Tenés una aprobación pendiente en el proyecto <strong>{projectName}</strong>.</p>
      <p>Etapa: <strong>{stageName}</strong></p>
      {previewUrl && (
        <p>
          Podés revisar la propuesta acá: <a href={previewUrl}>{previewUrl}</a>
        </p>
      )}
      <p>Ingresá a FlowSync para aprobar o solicitar ajustes.</p>
    </EmailLayout>
  );
}
