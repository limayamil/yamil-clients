# FlowSync · Guía de diseño

## Identidad visual
- **Paleta primaria** (`--brand-*`):
  - 50 `#F2F7FF`
  - 100 `#E4EEFF`
  - 200 `#C7DAFF`
  - 300 `#9BBEFF`
  - 400 `#6A9CFF`
  - 500 `#3B74FF`
  - 600 `#245CE0`
  - 700 `#1A46AE`
  - 800 `#163A8F`
  - 900 `#112C68`
- **Accents**: éxito `#16A34A`, alerta `#F59E0B`, error `#DC2626`, info `#0EA5E9`.
- **Neutrales**: texto fuerte `#0B1220`, gradiente `#1F2937` → `#374151`, texto secundario `#6B7280`, borde `#E5E7EB`, fondo suave `#F3F4F6`, blanco `#FFFFFF`.
- **Ilustraciones**: usar fondos suaves brand-50/100 con sombras muy difusas (`0 20px 40px rgba(17,32,74,0.08)`).

## Tipografía y ritmo
- **Tipografías**: Inter (UI) + Source Sans 3 (subtitulares). Fuente declarada vía `next/font`, fallback sans-serif.
- **Escala**: tamaño base 16px con progresión `clamp` (`clamp(1rem, 0.94rem + 0.4vw, 1.2rem)` en headings).
- **Espaciado**: sistema de 8px, tarjetas con `border-radius: 24px`, paddings internos 24–32px.
- **Grid**: contenedor máximo 1200px (`tailwind container 2xl`). Columnas responsive: 1 → 2 (≥768px) → 3 (≥1280px).

## Componentes clave
- **Card de etapa**
  - Header con título, badge de estado (`todo|waiting_client|…`), fechas planificadas.
  - Contenido con componentes interactivos (upload/checklist/approval/etc.).
  - Estados: borde `brand-100`, fondo `white`, hover `border-brand-300` + sombra suave.
- **Chips de estado**
  - `todo` → `secondary`, `waiting_client` → `warning`, `in_review` → `info`, `approved/done` → `success`, `blocked` → `destructive`.
  - Texto uppercase 12px, paddings 10×4 px, contraste AA.
- **Timeline**
  - Barra horizontal con tramo coloreado (`brand-400/80`) sobre fondo `brand-50`.
  - Mostrar fechas mín/max, tooltips opcionales (Lucide `info`).
- **Uploader**
  - Dropzone con borde punteado `border-brand-300`, fondo `brand-50`, label centrada + icono Upload 20px.
  - Validar tamaño 20MB, aceptar múltiples archivos (`Storage project-files`).
- **Comentarios**
  - Tarjeta 16px radius, header con rol + timestamp (`formatDate`), cuerpo texto 14px.
  - Formulario borde punteado, botón principal brand-600.
- **Aprobaciones**
  - Banner con estado, botones `Aprobar` (verde) / `Solicitar cambios` (outline rojo).
  - Guardar feedback opcional (`Textarea`).
- **Kanban**
  - Columnas reorderables (`framer-motion/reorder`).
  - Tarjetas 100% alto; call-to-actions explícitas (`Request materials`, `Complete stage`).

## Microinteracciones
- **Hover / focus**: transiciones 200ms `ease-out`, foco visible con `ring brand-500` + offset.
- **Motion**: `framer-motion` para aparición de tarjetas (`opacity + translateY`). `Reorder` sin animación personalizada.
- **Empty states**: panel punteado, tipografía secundaria (`text-muted-foreground`), copy guía (“No tenés proyectos asignados…”).

## Accesibilidad
- Contraste mínimo AA (verificar brand-100 sobre texto brand-800 ≥ 4.5).
- Roles ARIA en componentes interactivos (accordion, dialogs, selects).
- Navegación teclado completa: botones primarios con `focus-visible:ring` y `outline` en dialogs.
- Texto de acción claro (“Subir materiales”, “Marcar etapa como completa”).

## Notas de implementación
- Los estilos base viven en `app/globals.css`. Colores se manejan vía CSS custom properties (`--background`, `--foreground`...).
- Componentes UI adoptan convención shadcn (CVA + `cn`).
- Las plantillas de proyecto se guardan en `settings` (`template.*`). Ajustar desde Supabase o archivo `seed.sql`.
- Emails (`public/emails/*.tsx`) replican la identidad: fondo brand-50, tarjeta redondeada, tipografía Inter.
- Cron job sugerido: Edge Function `supabase/functions/deadline-reminder` invocada diariamente. Complementar con provider SMTP para enviar emails renderizados.

## Inspiración (Presupuesto – Luma)
- Etapas base: Kickoff → Materiales → Diseño → Desarrollo → QA → Entrega.
- Diferenciar versiones “express” vs “a medida” mediante plantillas (`template.landing`, `template.custom`).
- Comunicación proactiva: recordatorios antes de deadlines, notificar cuando `stage.status = waiting_client` > 3 días.

## Navegación y Layout (v2.0)
- **Sidebar colapsable**
  - Estado persistido en `localStorage` con hook personalizado `useSidebar()`
  - Desktop: `w-72` expandido, `w-16` colapsado con tooltips
  - Mobile: overlay completo `w-72` con backdrop
  - Transiciones suaves `transition-all duration-300 ease-out`
  - Header con gradiente `from-brand-500 to-brand-600`
- **Navegación por colores**
  - Dashboard: gradiente `from-blue-500 to-emerald-500`
  - Clientes: gradiente `from-purple-500 to-pink-500`
  - Proyectos: gradiente `from-orange-500 to-yellow-500`
  - Configuración: gradiente `from-gray-500 to-slate-500`
  - Iconos con fondo gradient en estado activo, sólido pastel en hover

## Sistema de colores por tipo de etapa
- **Intake** (Toma de requerimientos): rosa pastel `rose-*`
  - Fondo: `bg-rose-100/60`, borde: `border-rose-200`, texto: `text-rose-700`
  - Gradiente: `from-rose-50 to-rose-100/30`, sólido: `bg-rose-500`
- **Materials** (Materiales): azul cielo `sky-*`
  - Fondo: `bg-sky-100/60`, borde: `border-sky-200`, texto: `text-sky-700`
  - Gradiente: `from-sky-50 to-sky-100/30`, sólido: `bg-sky-500`
- **Design** (Diseño): violeta `violet-*`
  - Fondo: `bg-violet-100/60`, borde: `border-violet-200`, texto: `text-violet-700`
  - Gradiente: `from-violet-50 to-violet-100/30`, sólido: `bg-violet-500`
- **Development** (Desarrollo): esmeralda `emerald-*`
  - Fondo: `bg-emerald-100/60`, borde: `border-emerald-200`, texto: `text-emerald-700`
  - Gradiente: `from-emerald-50 to-emerald-100/30`, sólido: `bg-emerald-500`
- **Review** (Revisión): naranja `orange-*`
  - Fondo: `bg-orange-100/60`, borde: `border-orange-200`, texto: `text-orange-700`
  - Gradiente: `from-orange-50 to-orange-100/30`, sólido: `bg-orange-500`
- **Handoff** (Entrega): índigo `indigo-*`
  - Fondo: `bg-indigo-100/60`, borde: `border-indigo-200`, texto: `text-indigo-700`
  - Gradiente: `from-indigo-50 to-indigo-100/30`, sólido: `bg-indigo-500`

## Colores por estado de etapa
- **Todo**: gris pizarra `slate-*` - `bg-slate-100/60`, sólido: `bg-slate-400`
- **Waiting Client**: ámbar `amber-*` - `bg-amber-100/60`, sólido: `bg-amber-500`
- **In Review**: púrpura `purple-*` - `bg-purple-100/60`, sólido: `bg-purple-500`
- **Approved**: azul `blue-*` - `bg-blue-100/60`, sólido: `bg-blue-500`
- **Done**: verde `green-*` - `bg-green-100/60`, sólido: `bg-green-500`
- **Blocked**: rojo `red-*` - `bg-red-100/60`, sólido: `bg-red-500`

## Funciones de utilidad
- `getStageTypeColors(type)`: retorna objeto con `bg`, `border`, `text`, `gradient`, `icon`, `solid`
- `getStageStatusColors(status)`: retorna objeto con `bg`, `border`, `text`, `solid`
- `getNavItemColors(href)`: retorna colores específicos para navegación

## Próximos pasos de diseño
1. Definir token `--surface-elevated` para modales/overlays y documentar estados dark mode si se requiere.
2. Extender paleta con variantes neutrales cálidas (`stone-*`) para mensajes informativos.
3. Añadir ejemplos de tipografía en headings H1–H4 y variaciones responsive.
4. Considerar modo oscuro para el sistema de colores pasteles
5. Documentar patrones de microinteracciones para transiciones de estado
