# WorkOutApp — OpenDesign Screens

> Arquitectura visual para prototipar en Open Design.
> Crear cada screen como un artifact HTML en Open Design Studio.

---

## Core Domain: Interval System

Un Workout se compone de intervalos anidados:

```
Workout
├── Prepare (single)
├── Cycle [1..N]          ← se repite
│   ├── Work (exercise)
│   ├── Rest
│   └── ... (more)
├── RestBetweenSets
├── Set [1..N]            ← repite todo el ciclo
└── CoolDown (single)
```

Cada intervalo: `title, duration, description, image/gif (opcional)`

---

## Screens to Design

### 1. Dashboard / Home

**Propósito**: Pantalla principal, resumen del día, acceso rápido.

**Elementos**:
- Saludo / fecha actual
- "Today's Workout" card (si hay algo programado) con botón START
- Mini calendario/mes con dots de días con workout
- Acceso rápido: Create Workout, Browse Library, Calendar
- Próximo workout programado

**Layout**: Mobile-first card layout, 1 columna.

---

### 2. Workout List

**Propósito**: Navegar y gestionar workouts guardados.

**Elementos**:
- Lista de workouts (card por cada uno)
- Cada card: título, duración total, cantidad de ejercicios, preview de intervalos
- Botón + para crear nuevo
- Búsqueda/filtro
- Tap → abre Workout Editor
- Swipe o menú contextual: Edit, Duplicate, Delete

**Layout**: Lista vertical con cards.

---

### 3. Workout Editor — Interval Builder

**Propósito**: Construir la estructura de intervalos del workout. ES LA PANTALLA MÁS IMPORTANTE.

**Elementos**:
- **Header**: título del workout, duración total calculada
- **Timeline visual**: representación horizontal/vertical de la línea de tiempo del workout
  - Bloques de colores: Prepare (azul), Work (verde), Rest (rojo/naranja), CoolDown (púrpura)
  - Ancho del bloque proporcional a duración
- **Interval list**: lista vertical donde cada intervalo es una fila
  - Icono de tipo (play, dumbbell, pause, flag)
  - Nombre del intervalo
  - Duración
  - Drag handle para reordenar
- **Add Interval**: botón para agregar prepare/work/rest/cool down
- **Nesting controls**:
  - Botón "Wrap in Cycle" para agrupar Work+Rest en ciclo
  - Configuración de cycles y sets (número)
  - Visual indicator de anidamiento (indentación/tree)
- **Save / Back**

**Layout**: Scroll vertical con timeline visual en top, lista de intervalos abajo.

---

### 4. Interval Detail Editor

**Propósito**: Configurar un intervalo individual en detalle.

**Elementos**:
- Tipo de intervalo (badge no editable)
- **Título** (input text)
- **Duración** (picker/input: minutos:segundos)
- **Descripción** (textarea) — instrucciones del ejercicio
- **Imagen/GIF** — placeholder + botón "Add Image" (ahora, después se integrará subida)
- **Exercise selector** — modal/bottom sheet para elegir ejercicio de la library (cuando exista)

**Layout**: Form vertical, clean, full-screen o modal.

---

### 5. Sequence Builder

**Propósito**: Encadenar varios workouts en una sesión.

**Elementos**:
- **Sequence list**: workouts ordenados en secuencia
  - Cada ítem: nombre del workout, duración, thumbnail de timeline
  - Drag handle para reordenar
- **Add Workout**: busca y agrega workouts existentes a la secuencia
- **Total duration** calculado
- **Sequence title** (e.g., "Full Body — Mobility + Strength + Stretch")
- Save as template

**Layout**: Similar al Interval Builder pero más simple (solo lista de workouts).

---

### 6. Active Timer — Player

**Propósito**: Ejecutar el workout con temporizador. SEGUNDA PANTALLA MÁS IMPORTANTE.

**Elementos**:
- **Timer**: número grande, countdown en segundos (formato MM:SS)
- **Progress**: barra/círculo de progreso del intervalo actual
- **Current interval info**:
  - Tipo (Work/Rest/Prepare/etc.)
  - Nombre del ejercicio
  - Descripción corta
  - Imagen/GIF del ejercicio (ocupa espacio central)
- **Controls**: Pause, Skip Forward, Restart
- **Progress overview**: mini timeline abajo mostrando posición actual en el workout total
- **Sections**: indicator de "Set 2 of 4", "Cycle 3 of 8"
- **Complete state**: pantalla de celebración al terminar

**Layout**: Timer enorme centrado, imagen de ejercicio en zona media, controles abajo. Dark mode por defecto.

---

### 7. Calendar View

**Propósito**: Planificar workouts en el tiempo (semanal/mensual).

**Elementos**:
- **Vista semanal** (default) o mensual (toggle)
- **Días**: cada día muestra el/los workouts programados como chips de colores
- **Tap en día**: popup con detalle, opción de agregar workout
- **Drag & drop**: mover workouts entre días
- **Empty state**: días sin programar se ven diferentes
- **Today**: marcador visual

**Layout**: Grid semanal (7 columnas) con scroll. Mobile: semana apilada vertical.

---

### 8. Program / Journey Builder

**Propósito**: Crear planes de entrenamiento de semanas/meses.

**Elementos**:
- **Weeks view**: timeline de semanas
- Cada semana expande a 7 días
- Cada día puede tener un workout asignado
- **Templates**: "3-month strength program", "4-week HIIT challenge"
- **Progression**: marcadores de progresión de carga
- **Overview stats**: duración total del programa, volumen estimado

**Layout**: Calendario expandido con jerarquía Mes → Semana → Día → Workout.

---

### 9. Exercise Library

**Propósito**: Browse ejercicios disponibles.

**Elementos**:
- **Grid/Card view**: tarjetas con imagen/thumbnail del ejercicio
- **Search**: barra de búsqueda
- **Filters**: por grupo muscular, equipo, tipo
- **Detail**: al tap, muestra nombre, descripción, imagen grande, instrucciones

**Layout**: Grid responsive (2 columnas mobile), search bar fixed top.

---

### 10. Settings

**Propósito**: Configuración de la app.

**Elementos**:
- Tema (claro/oscuro)
- Unidades (kg/lb, km/mi)
- Sonidos / vibración
- Timer defaults (rest duration default, prepare default)
- Export/Import data
- About

**Layout**: Lista de secciones simple.

---

## Design System Tokens (para el DESIGN.md de Open Design)

```yaml
Palette:

```
Select a color pallete by your own. Select an appropiate one. do not be obvious about the color it must be different than normal generic workout app 
```

Typography:
  timer:      "JetBrains Mono, monospace" # Números enormes
  display:    "Inter, sans-serif"

Spacing:      4px base

Dark mode:    default (timer view), light mode opcional
```

---

## Flow Navigation

```
Dashboard
├── Calendar View ──── Day Detail ──── Active Timer
├── Workout List ──── Workout Editor ──── Interval Detail Editor
│                                        └── Exercise Library
├── Sequence Builder ──── Active Timer
├── Exercise Library ──── Exercise Detail
└── Program Builder ──── Week Detail ──── Day Detail ──── Active Timer
```

---

## Orden sugerido de prototipado

1. **Active Timer (Player)** — el corazón de la app, define la atmósfera visual
2. **Workout Editor** — la pantalla más compleja, define la UX de intervalos
3. **Dashboard** — la cara de la app
4. **Interval Detail Editor** — profundidad del editor
5. **Sequence Builder** — composición de workouts
6. **Calendar View** — planificación semanal
7. **Exercise Library** — browse
8. **Program Builder** — planificación a largo plazo
9. **Settings** — simple
