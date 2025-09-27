'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Underline } from '@tiptap/extension-underline';
import { ListKit } from '@tiptap/extension-list/kit';
import { Link } from '@tiptap/extension-link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isHtmlContent, textToHtml, validateRichTextContent } from '@/lib/utils/rich-text';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  mode?: 'full' | 'simple' | 'inline';
  className?: string;
  disabled?: boolean;
  showHtmlEditor?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  maxLength = 5000,
  mode = 'full',
  className,
  disabled = false,
  showHtmlEditor = false
}: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value);
  // Configurar extensiones según el modo
  const getExtensions = useCallback(() => {
    const baseExtensions = [
      StarterKit.configure({
        bulletList: false, // Usar ListKit
        orderedList: false, // Usar ListKit
        listItem: false, // Usar ListKit
        bold: false, // Usar extensión personalizada
        italic: false, // Usar extensión personalizada
      }),
      Bold,
      Italic,
    ];

    if (mode === 'inline') {
      // Modo inline: solo formateo básico
      return [...baseExtensions, Underline];
    }

    if (mode === 'simple') {
      // Modo simple: formateo básico + listas usando ListKit
      return [
        ...baseExtensions,
        Underline,
        ListKit.configure({
          bulletList: {},
          orderedList: {},
          listItem: {}
        }),
      ];
    }

    // Modo completo: todas las características usando ListKit
    return [
      ...baseExtensions,
      Underline,
      ListKit.configure({
        bulletList: {},
        orderedList: {},
        listItem: {},
        listKeymap: {
          listTypes: [
            { itemName: 'listItem', wrapperNames: ['bulletList', 'orderedList'] }
          ]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-600 hover:text-brand-700 underline',
        },
      }),
    ];
  }, [mode]);

  const editor = useEditor({
    extensions: getExtensions(),
    content: isHtmlContent(value) ? value : textToHtml(value),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'prose-p:text-foreground prose-p:leading-relaxed prose-p:m-0 prose-p:mb-2',
          'prose-strong:text-foreground prose-strong:font-semibold',
          'prose-em:text-foreground prose-em:italic',
          'prose-ul:text-foreground prose-ul:my-2 prose-ul:pl-4 prose-ul:list-disc',
          'prose-ol:text-foreground prose-ol:my-2 prose-ol:pl-4 prose-ol:list-decimal',
          'prose-li:text-foreground prose-li:my-0.5 prose-li:ml-0',
          'prose-a:text-brand-600 hover:prose-a:text-brand-700',
        ),
      },
    },
  });

  // Actualizar contenido cuando el valor externo cambie
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const contentToSet = isHtmlContent(value) ? value : textToHtml(value);
      editor.commands.setContent(contentToSet);
    }
    setHtmlContent(value);
  }, [value, editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    console.log('🔄 Toggling bullet list...', {
      canExecute: editor?.can().toggleBulletList(),
      isActive: editor?.isActive('bulletList'),
      availableCommands: Object.keys(editor?.commands || {}),
      currentContent: editor?.getHTML()
    });
    const result = editor?.chain().focus().toggleBulletList().run();
    console.log('🔄 Bullet list toggle result:', result);
    console.log('🔄 Content after toggle:', editor?.getHTML());
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    console.log('🔢 Toggling ordered list...', {
      canExecute: editor?.can().toggleOrderedList(),
      isActive: editor?.isActive('orderedList'),
      availableCommands: Object.keys(editor?.commands || {}),
      currentContent: editor?.getHTML()
    });
    const result = editor?.chain().focus().toggleOrderedList().run();
    console.log('🔢 Ordered list toggle result:', result);
    console.log('🔢 Content after toggle:', editor?.getHTML());
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const toggleHtmlMode = useCallback(() => {
    if (isHtmlMode) {
      // Switching from HTML to visual mode
      onChange(htmlContent);
      if (editor) {
        editor.commands.setContent(htmlContent);
      }
    } else {
      // Switching from visual to HTML mode
      if (editor) {
        setHtmlContent(editor.getHTML());
      }
    }
    setIsHtmlMode(!isHtmlMode);
  }, [isHtmlMode, htmlContent, editor, onChange]);

  const handleHtmlChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    onChange(newHtml);
  }, [onChange]);

  if (!editor) {
    return null;
  }

  // Validación de contenido
  const validation = validateRichTextContent(editor.getHTML(), maxLength);
  const textLength = validation.textLength;

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      {mode !== 'inline' && (
        <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">

          {/* HTML Toggle Button */}
          {showHtmlEditor && (
            <>
              <Button
                type="button"
                variant={isHtmlMode ? 'default' : 'ghost'}
                size="sm"
                onClick={toggleHtmlMode}
                disabled={disabled}
                className="h-8 w-8 p-0"
                title={isHtmlMode ? 'Vista visual' : 'Vista HTML'}
              >
                {isHtmlMode ? <Eye className="h-3 w-3" /> : <Code className="h-3 w-3" />}
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}

          {/* Format Buttons - only show in visual mode */}
          {!isHtmlMode && (
            <>
              <Button
                type="button"
                variant={editor.isActive('bold') ? 'default' : 'ghost'}
                size="sm"
                onClick={toggleBold}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <BoldIcon className="h-3 w-3" />
              </Button>

              <Button
                type="button"
                variant={editor.isActive('italic') ? 'default' : 'ghost'}
                size="sm"
                onClick={toggleItalic}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <ItalicIcon className="h-3 w-3" />
              </Button>

              <Button
                type="button"
                variant={editor.isActive('underline') ? 'default' : 'ghost'}
                size="sm"
                onClick={toggleUnderline}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <UnderlineIcon className="h-3 w-3" />
              </Button>

              {(mode === 'full' || mode === 'simple') && (
                <>
                  <div className="w-px h-4 bg-border mx-1" />

                  <Button
                    type="button"
                    variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={toggleBulletList}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-3 w-3" />
                  </Button>

                  <Button
                    type="button"
                    variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={toggleOrderedList}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <ListOrdered className="h-3 w-3" />
                  </Button>
                </>
              )}

              {mode === 'full' && (
                <>
                  <div className="w-px h-4 bg-border mx-1" />

                  <Button
                    type="button"
                    variant={editor.isActive('link') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={setLink}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <LinkIcon className="h-3 w-3" />
                  </Button>
                </>
              )}
            </>
          )}

          {/* Contador de caracteres */}
          <div className="ml-auto text-xs text-muted-foreground">
            <span className={cn(
              textLength > maxLength * 0.9 ? 'text-orange-600' : '',
              textLength > maxLength ? 'text-red-600 font-medium' : ''
            )}>
              {textLength}
            </span>
            <span className="text-muted-foreground">/{maxLength}</span>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className={cn(
        'p-3 min-h-[80px] max-h-[300px] overflow-y-auto',
        mode === 'inline' ? 'min-h-[40px] max-h-[120px]' : '',
        disabled ? 'bg-muted/50' : 'bg-background'
      )}>
        {isHtmlMode ? (
          <textarea
            value={htmlContent}
            onChange={handleHtmlChange}
            placeholder="Edita el HTML aquí..."
            disabled={disabled}
            className="w-full h-full min-h-[60px] resize-none border-0 outline-none bg-transparent font-mono text-sm"
          />
        ) : (
          <EditorContent
            editor={editor}
            placeholder={placeholder}
          />
        )}
      </div>

      {/* Error de validación */}
      {!validation.isValid && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700">
          {validation.error}
        </div>
      )}
    </div>
  );
}

/**
 * Editor inline para elementos de lista
 */
export function InlineRichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  disabled = false,
  className
}: Omit<RichTextEditorProps, 'mode' | 'maxLength' | 'showHtmlEditor'>) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      mode="inline"
      maxLength={500}
      className={cn('border-0 bg-transparent p-0', className)}
    />
  );
}