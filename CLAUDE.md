# Holgura: instrucciones para Claude

App Android personal para controlar nómina, gastos y ahorro. Local-first: los datos viven solo en el
móvil (SQLite), sin servidores. Licencia PolyForm Noncommercial 1.0.0.

## Si el usuario dice "publícalo", "súbelo a GitHub" o similar

Sigue [`docs/PUBLICAR.md`](docs/PUBLICAR.md) paso a paso. No improvises el orden: hay decisiones que
solo puede tomar el usuario (propietario del repo, titular de la licencia) y una clave de firma que
nunca debe pasar por el chat ni por el repositorio.

## Estado a 26 de noviembre de 2026

**Hecho:** especificación, diseño técnico y tareas (`openspec/`); lógica del dinero con 85 tests; las 8 pantallas
(Inicio, Añadir, Movimientos, Ahorro, Fijos, Cierre de mes, Ajustes, Editar) en modo claro y oscuro;
plataforma Android sincronizada con Capacitor (icono, botón "atrás", pantalla de error); workflows
`build-apk.yml` y `ci.yml`; licencia; README con capturas; guía de publicación.

**Nada de esto se ha ejecutado en un móvil ni en GitHub.** Sigue sin verificar: SQLite en el teléfono,
exportar/compartir e importar copias, que la app arranque sin el permiso `INTERNET`, el APK firmado y los dos
workflows (se escribieron sin poder ejecutarlos).

**Decisiones del usuario (no las reabras):**

- Nombre **Holgura**, repo `holgura`, `applicationId` `app.holgura`.
- Licencia **PolyForm Noncommercial 1.0.0**: sin uso comercial sin su permiso (es código disponible, no OSI).
- "Solo en el móvil" = la app no usa servidores ni servicios externos. Las copias de seguridad (JSON a Drive o
  local) son aparte y las hace el usuario. `allowBackup` queda activo.
- Permiso `INTERNET` quitado: si la app no abre en el móvil, hay que devolverlo.
- Tras la v0.1, lo primero es importar el CSV del banco; la versión web para iPhone viene después del APK.

**Pendiente del usuario:** elegir propietario del repo y titular de la licencia, crear la clave de firma y subir
los secretos (ver `docs/SIGNING.md`), y probar el APK en su móvil.

## Prioridades del usuario

1. **El APK de Android es lo primero.** La versión web para iPhone vendrá después. No gastes tiempo en
   pulir solo el navegador a costa de Android.
2. Todo lo que no esté probado en un móvil real se dice como "sin verificar" (SQLite, exportar y
   compartir, instalación del APK firmado, permiso de internet quitado). No lo des por hecho.

## Idioma

- Interfaz, documentación y descripciones de PR: **español**.
- Código, nombres, comentarios y mensajes de commit: **inglés** (commits con Conventional Commits).

## Comandos (en `app/`)

```bash
npm ci
npm run dev        # navegador, datos en localStorage
npx tsc -b         # tipos
npm test           # Vitest
npm run build
npx cap sync android
```

Antes de dar algo por terminado: `npx tsc -b`, `npm test` y `npm run build` en verde.

## Arquitectura

- `app/src/domain`: reglas del dinero como **funciones puras** (saldos, reparto de nómina, cierre de mes,
  gastos fijos, ahorro, ritmo diario). Aquí va el TDD: test primero, y solo tests que puedan fallar por
  un cambio en nuestro código.
- `app/src/data`: persistencia detrás de la interfaz `Repository` (SQLite en Android, localStorage en web),
  mutaciones puras sobre el estado y copia de seguridad en JSON.
- `app/src/routes` y `app/src/components`: pantallas con React Router (loaders y actions) y MUI.
- `openspec/changes/v0-1-mvp`: especificación, diseño y tareas (`tasks.md` dice qué está verificado).

## Reglas del dominio que no se pueden romper

- Los importes son **céntimos enteros**, nunca decimales.
- Cada ingreso tiene `fundsMonth`: el mes que financia (una nómina del día 28 financia el mes siguiente).
- El saldo de un destino no se reinicia por mes; `available(mes)` ignora las transferencias.
- Un mes cerrado no se edita; solo se reabre el **último** cerrado, y los meses se cierran en orden.
- Un export de copia es el mismo JSON que se guarda; importar valida todo antes de tocar los datos.

## Convenciones de código

- Componentes funcionales con Hooks. Evita `useEffect`: carga en loaders, escribe en actions o handlers.
- Renderizado condicional con **ternario**, nunca con `&&`. Props en línea, sin objetos intermedios.
- Usa componentes de MUI antes de inventar UI propia.
- **MUI 9 ignora en silencio las system props**: `color` en `Typography` o `alignItems` en `Stack` no
  hacen nada. Usa `sx`.
- Código mínimo: nada de capas, wrappers ni abstracciones que no pida el cambio.

## Android

- `applicationId` = `app.holgura`. **No lo cambies**: Android lo trataría como otra app y se perderían los datos.
  El `namespace` Java (`com.savingstracker.app`) es distinto a propósito.
- La app no declara permisos de Android. No añadas `INTERNET` sin una razón real y sin avisar.
- El APK se firma siempre con la misma clave (ver `docs/SIGNING.md`). **Nunca** commitees una keystore ni sus
  contraseñas, ni las muestres en el chat.
- No hay Android SDK en la máquina del usuario: el APK se compila en GitHub Actions.

## Git

- Nada de commits directos a `main`: rama y Pull Request. Sin `--force`.
- Sin líneas de atribución a Claude ni a IA en commits ni en PR.
- No mezcles cambios funcionales con reformateos masivos.
