import * as React from 'react';

interface EmailLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function EmailLayout({ title, children }: EmailLayoutProps) {
  return (
    <html>
      <body style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#F3F4F6', padding: '32px' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: '640px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px rgba(17, 32, 74, 0.08)' }}>
          <tbody>
            <tr>
              <td>
                <h1 style={{ fontSize: '20px', marginBottom: '16px', color: '#1A46AE' }}>{title}</h1>
                <div style={{ color: '#374151', fontSize: '14px', lineHeight: 1.6 }}>{children}</div>
                <p style={{ marginTop: '32px', fontSize: '12px', color: '#6B7280' }}>
                  FlowSync · Seguimiento de proyectos Cliente ↔ Proveedor
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
