# WorkOutApp — Product Vision & Roadmap

## Product Vision

Una webapp que permite crear, organizar y ejecutar entrenamientos temporizados con intervalos. Cualquier persona con un browser puede diseñar un workout, seguirlo con un timer guiado con imágenes, planificarlo en un calendario, y armar programas de entrenamiento de semanas o meses.

**Sin registro, sin backend, sin app store.** PWA instalable al homescreen.

---

## Core Concepts

```
Workout = Interval[] (estructura anidada)
  ├── Prepare
  ├── Cycle [1..N] (Work + Rest) × N
  ├── RestBetweenSets
  ├── Set [1..N] (repite los cycles)
  └── CoolDown

Sequence = Workout[] (ordenado, encadenado)

Program = Sequence[] en calendario (meses/semanas)

Exercise = { nombre, descripción, imagen/gif, grupo muscular }
```

Cada intervalo: `type, title, duration, description, mediaUrl`

---

## Roadmap to Launch

### Phase 0: Foundation (MVP) ← AHORA
**Objetivo**: app funcional con las 2 pantallas que definen el producto.

- Scaffold Next.js + Tailwind + TypeScript
- Core data model e interfaces (TypeScript types)
- Workout Editor (crear workout con intervalos básicos)
- Active Timer (countdown con progreso)
- Datos en localStorage
- Sin nesting complejo todavía (solo lista plana de intervalos: Prepare → Work × N → CoolDown)
- Base exercise data hardcodeada (4-5 ejercicios)

**Ponytail**: timer con `setInterval`, datos en `localStorage`, cero abstracciones, cero librerías externas.

**Criterio de éxito**: podés crear un workout y ejecutarlo de principio a fin.

---

### Phase 1: Interval Engine
**Objetivo**: la potencia real del sistema de intervalos.

- Nesting completo: Cycles (work + rest loops), Sets (repeat cycles), RestBetweenSets
- Interval Detail Editor (configurar cada intervalo individualmente)
- Drag & drop reorder de intervalos
- Workout CRUD completo (list, edit, delete, duplicate, import)
- Ciclo/set indicators en el timer

**Ponytail**: listas planas con metadatos de nesting en vez de árbol recursivo.

**Criterio**: podés construir un HIIT complejo con ciclos y sets anidados.

---

### Phase 2: Sequence Engine
**Objetivo**: encadenar workouts en sesiones.

- Sequence Builder (elegir y ordenar workouts)
- Sequence Player (transición automática entre workouts)
- Session history (qué se ejecutó, cuándo, duración)

**Ponytail**: secuencia = array de IDs de workouts, sin UUIDs ni ORM.

**Criterio**: podés correr "Movilidad → Fuerza → Estiramiento" sin tocar nada.

---

### Phase 3: Exercise Library
**Objetivo**: catálogo de ejercicios con imágenes.

- Integrar free-exercise-db (CC0, 870+ ejercicios)
- Browse grid + search
- Exercise detail (nombre, descripción, imagen, grupo muscular)
- Asignar exercise a intervalos Work
- Imágenes/GIFs en el timer durante Work intervals

**Ponytail**: JSON estático embebido, sin backend ni API.

**Criterio**: cada Work interval puede tener un ejercicio asignado con imagen.

---

### Phase 4: Calendar & Planning
**Objetivo**: organizar entrenamientos en el tiempo.

- Weekly calendar view
- Asignar workouts a días específicos
- Drag & drop para reorganizar
- Monthly overview
- Today indicator + "start scheduled workout"

**Ponytail**: calendario = tabla de fechas con IDs de workouts, sin librería de calendario.

**Criterio**: podés planificar tu semana de entrenamiento.

---

### Phase 5: Programs / Journeys
**Objetivo**: planes de entrenamiento de largo plazo.

- Multi-week program builder
- Program templates (4-week, 8-week, 12-week)
- Assign sequences/days per week
- Progression markers

**Ponytail**: programa = array de semanas con arrays de días, datos planos.

**Criterio**: podés crear un "3-month strength program" y seguirlo.

---

### Phase 6: Polish & Launch
**Objetivo**: producto listo para usar.

- PWA manifest + service worker (timer en background)
- Sound notifications (Web Audio API, sin librerías)
- Dark/Light theme
- Settings panel
- Data export/import (JSON)
- Responsive: mobile-first + tablet
- Offline support (todo es local)

**Ponytail**: Web Notification API nativa, CSS custom properties para tema.

**Criterio**: podés instalar la app al home screen del iPhone, abrirla y usarla offline.

---

## Principios de desarrollo

| Principio | Aplica |
|-----------|--------|
| **Ponytail full** | Siempre. La solución más corta que funciona. Nada especulativo. |
| **TDD strict** | Desde Phase 1 en adelante (cuando tengamos test runner). |
| **SDD cycles** | Cada Phase es un SDD cycle completo (proposal → specs → design → tasks → apply → verify → archive). |
| **Local-first** | Sin backend, sin auth, sin cloud. localStorage → IndexedDB si escala. |
| **No dependencies** | Si el browser lo hace nativo (timer, notificaciones, sonidos), usamos el browser. |
| **Mobile-first** | Diseñamos para mobile, adaptamos a desktop. |

---

## Stack

```
Next.js 14+ (App Router)
TypeScript
Tailwind CSS v4
localStorage / IndexedDB
PWA (next-pwa o manual)
Vitest + Testing Library (desde Phase 1)
Playwright (E2E, desde Phase 3+)
```

Nada más. Cero runtime state management, cero server, cero DB externa.
