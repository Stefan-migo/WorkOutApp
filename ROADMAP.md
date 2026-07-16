# WorkOutApp — Roadmap v1.0

> Plan de 4 fases para llevar la app de local-first MVP a v1.0
> open-source con base de datos remota y features completas.

---

## Fase 0 — Limpieza de SDDs pendientes

**Objetivo**: Archivar los 2 SDD changes viejos que quedaron colgados de la era
pre-consolidación. Ambos ya están implementados en `main` pero nunca se
cerraron formalmente.

| Cambio | Estado | Acción |
|--------|--------|--------|
| `phase-3-sequences-exercises` | ✅ Implementado (commit `925b7dd`) | Archivar |
| `phase-4-final-pages` | ✅ Implementado (commits `2ea0258`, `ae1176b`, `dcc4f7f`) | Archivar |

**Duración**: ~15 min ✅ **Completada** (ambos cambios archivados desde 2026-07-02)

---

## Fase 1 — Open Source Foundation

**Objetivo**: Convertir WorkOutApp en un proyecto open-source real con
estructura, reglas, y comunidad.

### Entregables

- **LICENSE** — MIT (recomendado) o Apache 2.0
- **CONTRIBUTING.md** — guía de contribución con estándares, workflow, PRs
- **CODE_OF_CONDUCT.md** — código de conducta (Contributor Covenant)
- **GitHub templates** — Issue templates (bug report + feature request), PR template
- **CI/CD** — GitHub Actions: `tsc`, `vitest`, lint, build
- **README.md** renovado — badges, screenshot, features, quick start, links
- **SECURITY.md** — política de seguridad
- **.editorconfig**, `.gitattributes` si faltan

### No-code change
Esta fase **no toca código de la app** — solo configuración del repo y documentos.

**Duración**: ~1 sesión

---

## Fase 2 — Sound, Notifications & Export

**Objetivo**: Completar las features de sonido, notificaciones y exportación
de historial.

### Scope

| Feature | Estado actual | Trabajo necesario |
|---------|--------------|-------------------|
| 🔊 Sound (beep) | ✅ `useBeep.ts` exists (Web Audio API) | Mejorar: selección de sonido, volumen, preview |
| 🔔 Notifications | ✅ `useIntervalNotification.ts` exists (Notification API) | Mejorar: configuración, intervalos custom |
| 📤 Export | ❌ No existe | Nuevo: exportar sesiones a JSON/CSV |

### Dependencias
- Ninguna — todo local-first
- Tests Vitest existentes

**Duración**: ~2 sesiones | **SDD**: 1 change (posibles PRs encadenados)

---

## Fase 3 — Base de datos remota (Supabase)

**Objetivo**: Migrar de localStorage 100% local a Supabase como backend
persistente con autenticación y sync.

### Scope tentativo

1. **Esquema DB** — migrar modelos actuales a tablas PostgreSQL
2. **Auth** — registro/login con Supabase Auth (email + Google)
3. **Data Layer** — abstraer hooks para que usen Supabase en vez de localStorage
4. **Migración** — script para migrar datos de localStorage a Supabase
5. **Offline?** — decidir si usar cache local como fallback
6. **Tests** — mockear Supabase client en tests existentes

### Dependencias
- Fase 1 (estructura open-source lista)
- Fase 2 (features de sonido/notis/export ya integradas)

**Duración**: 4-6 sesiones | **SDD**: Múltiples changes encadenados

---

## Post-Fase 3: Hacia v1.0

- **Playwright E2E** — tests end-to-end de flujos críticos
- **Verificación manual** — el usuario verifica cada funcionalidad
- **Release v1.0** — tag, changelog, anuncio

---

## Principios

- **Local-first siempre**: la DB remota no debe romper la experiencia offline
- **Strict TDD**: todo cambio incluye tests
- **PRs pequeños**: <400 líneas por PR, stacked-to-main cuando sea necesario
- **SDD cada change**: proposal → spec → design → tasks → apply → verify → archive
