import DOMPurify from 'dompurify';

/**
 * Configuración de DOMPurify para texto enriquecido seguro
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};

/**
 * Sanitiza contenido HTML para prevenir XSS
 */
export function sanitizeHtml(htmlContent: string): string {
  if (typeof window === 'undefined') {
    // En el servidor, simplemente retornar el contenido (se sanitizará en el cliente)
    return htmlContent;
  }

  return DOMPurify.sanitize(htmlContent, RICH_TEXT_CONFIG);
}

/**
 * Detecta si el contenido es HTML o texto plano
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false;

  // Buscar tags HTML básicos
  const htmlRegex = /<\/?[a-z][\s\S]*>/i;
  return htmlRegex.test(content);
}

/**
 * Convierte texto plano a HTML básico (para migración)
 */
export function textToHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Escapar caracteres HTML especiales
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Convertir saltos de línea a párrafos
  const paragraphs = escaped
    .split('\n\n')
    .map(paragraph => {
      if (paragraph.trim()) {
        // Convertir saltos de línea simples a <br>
        const withBreaks = paragraph.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      }
      return '';
    })
    .filter(Boolean);

  return paragraphs.length > 0 ? paragraphs.join('') : `<p>${escaped}</p>`;
}

/**
 * Extrae texto plano del HTML (para search, etc.)
 */
export function htmlToText(html: string): string {
  if (typeof window === 'undefined') {
    // En el servidor, usar regex simple para extraer texto
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // En el cliente, usar DOMParser para mayor precisión
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Trunca contenido HTML manteniendo tags válidos
 */
export function truncateHtml(html: string, maxLength: number): string {
  const text = htmlToText(html);

  if (text.length <= maxLength) {
    return html;
  }

  // Si el texto es muy largo, truncar y agregar...
  const truncated = text.substring(0, maxLength - 3) + '...';
  return textToHtml(truncated);
}

/**
 * Valida contenido HTML contra límites
 */
export function validateRichTextContent(content: string, maxLength: number = 5000): {
  isValid: boolean;
  error?: string;
  textLength: number;
} {
  if (!content) {
    return { isValid: true, textLength: 0 };
  }

  const textContent = htmlToText(content);
  const textLength = textContent.length;

  if (textLength > maxLength) {
    return {
      isValid: false,
      error: `El contenido excede el límite de ${maxLength} caracteres (actual: ${textLength})`,
      textLength
    };
  }

  return { isValid: true, textLength };
}