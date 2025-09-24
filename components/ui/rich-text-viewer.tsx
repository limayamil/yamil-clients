'use client';

import { useEffect, useState } from 'react';
import { sanitizeHtml, isHtmlContent, textToHtml } from '@/lib/utils/rich-text';
import { cn } from '@/lib/utils';

interface RichTextViewerProps {
  content: string;
  className?: string;
  fallback?: string;
}

export function RichTextViewer({ content, className, fallback = '' }: RichTextViewerProps) {
  const [sanitizedContent, setSanitizedContent] = useState<string>('');

  useEffect(() => {
    if (!content) {
      setSanitizedContent(fallback);
      return;
    }

    // Determinar si es HTML o texto plano
    let htmlContent: string;
    if (isHtmlContent(content)) {
      htmlContent = content;
    } else {
      // Convertir texto plano a HTML
      htmlContent = textToHtml(content);
    }

    // Sanitizar el contenido
    const sanitized = sanitizeHtml(htmlContent);
    setSanitizedContent(sanitized);
  }, [content, fallback]);

  if (!sanitizedContent) {
    return null;
  }

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none',
        'prose-p:text-foreground prose-p:leading-relaxed prose-p:m-0 prose-p:mb-2 last:prose-p:mb-0',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-em:text-foreground prose-em:italic',
        'prose-ul:text-foreground prose-ul:my-2 prose-ul:pl-4',
        'prose-ol:text-foreground prose-ol:my-2 prose-ol:pl-4',
        'prose-li:text-foreground prose-li:my-0.5',
        'prose-a:text-brand-600 hover:prose-a:text-brand-700 prose-a:underline prose-a:decoration-1 prose-a:underline-offset-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

/**
 * Componente simplificado para mostrar solo texto plano con formato básico
 */
export function SimpleTextViewer({ content, className }: { content: string; className?: string }) {
  if (!content) return null;

  return (
    <div className={cn('text-sm text-foreground leading-relaxed', className)}>
      {content.split('\n').map((line, index) => (
        <p key={index} className={line.trim() ? 'mb-2 last:mb-0' : 'mb-1'}>
          {line.trim() || '\u00A0'}
        </p>
      ))}
    </div>
  );
}