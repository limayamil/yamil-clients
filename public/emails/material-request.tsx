import * as React from 'react';
import { EmailLayout } from './layout';

interface MaterialRequestEmailProps {
  projectName: string;
  items: string[];
  deadline?: string;
}

export function MaterialRequestEmail({ projectName, items, deadline }: MaterialRequestEmailProps) {
  return (
    <EmailLayout title={`Faltan materiales para ${projectName}`}>
      <p>Hola,</p>
      <p>
        Tu proveedor necesita algunos materiales para avanzar con <strong>{projectName}</strong>.
      </p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {deadline && <p>Idealmente envialos antes de: <strong>{deadline}</strong>.</p>}
      <p>Podés subirlos directamente desde tu panel de FlowSync.</p>
    </EmailLayout>
  );
}
