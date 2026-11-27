# Holgura: instrucciones para Claude

App Android personal para controlar nómina, gastos y ahorro. Local-first: los datos viven solo en el
móvil (SQLite), sin servidores. Licencia PolyForm Noncommercial 1.0.0.

## Estado a 27 de noviembre de 2026

**Publicado:** el repo es público (`Glinbor10/holgura`), `main` está protegida (ver Git) y hay una release firmada
`v0.1.0` con su APK. Los workflows `ci.yml` (PR) y `release.yml` (tag `v*` o a mano) se han ejecutado en GitHub.
La clave de firma existe, está fuera del repo y sus 4 secretos están subidos. Cómo sacar una versión:
[`docs/DESARROLLO.md`](docs/DESARROLLO.md).

**Hecho:** especificación, diseño y tareas (`openspec/`); lógica del dinero con tests; 8 pantallas en claro y
oscuro más la pantalla de nómina (`/payroll`, "Ha llegado la nómina", con importe prellenado desde Ajustes y
pregunta de para qué mes es); teclado numérico propio; márgenes de la barra de estado con `--safe-area-inset-*`;
logo nuevo (anillo con hueco y punto ámbar, fuentes en `app/assets/`).

**Sigue sin verificar en un móvil real:** SQLite en el teléfono, exportar/compartir e importar copias, que la app
arranque sin el permiso `INTERNET`, y los márgenes de la barra de estado y el teclado de la v0.1.1.

**Decisiones del usuario (no las reabras):**

- Nombre **Holgura**, repo `holgura`, `applicationId` `app.holgura`.
- Licencia **PolyForm Noncommercial 1.0.0**: sin uso comercial sin su permiso (es código disponible, no OSI).
  Titular: Guillermo Linares Borrego.
- "Solo en el móvil" = la app no usa servidores ni servicios externos. Las copias de seguridad (JSON a Drive o
  local) son aparte y las hace el usuario. `allowBackup` está **desactivado** (decisión del 27/11/2026): así la
  frase "tus datos no salen del móvil" es literal y recuperar datos solo es posible con la copia exportada.
- Permiso `INTERNET` quitado: si la app no abre en el móvil, hay que devolverlo.
- El README es solo para visitantes (qué hace, capturas, descargar el APK). Lo de mantenimiento va en `docs/`.
- La nómina es una pantalla propia, no un tipo de movimiento de Añadir: el `+` solo ofrece Gasto e Ingreso.
- Tras la v0.1, lo primero es importar el CSV del banco; la versión web para iPhone viene después del APK.

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
- Cada ingreso tiene `fundsMonth`: el mes que financia. La pantalla de nómina pregunta **para qué mes es** (por
  defecto el siguiente si cobra a final de mes); la fecha del movimiento es siempre hoy.
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
- Ficheros siempre en UTF-8 **sin BOM**. En PowerShell 5.1 `Set-Content -Encoding utf8` añade BOM y rompió
  `build.gradle` y `CODEOWNERS`: usa la herramienta Write o Node.
- Los `!` de la sesión corren en Bash: usa `/` en las rutas y no esperes contraseñas interactivas.

## Android

- `applicationId` = `app.holgura`. **No lo cambies**: Android lo trataría como otra app y se perderían los datos.
  El `namespace` Java (`com.savingstracker.app`) es distinto a propósito.
- La app **no declara `INTERNET` ni ningún permiso de red** (el workflow `Release` falla si aparece uno y lista los
  permisos en las notas). Las librerías añaden `USE_BIOMETRIC`, `USE_FINGERPRINT` y un permiso interno de androidx,
  que la app no usa: no digas "ningún permiso", di "sin permiso de internet". No añadas `INTERNET` sin avisar.
- El APK se firma siempre con la misma clave (ver `docs/SIGNING.md`). **Nunca** commitees una keystore ni sus
  contraseñas, ni las muestres en el chat.
- El APK se compila en GitHub Actions (workflow `Release`). La máquina del usuario tiene `build-tools` y `adb` en
  `AppData\Local\Android\Sdk`, pero **no** emulador ni imágenes de sistema.

## Git

- Nada de commits directos a `main`: rama y Pull Request. Sin `--force`. `main` exige 1 aprobación del propietario;
  como no puede aprobar su propia PR, la fusión la hace él o tú con `--admin` **solo si te lo pide**.
- Sin líneas de atribución a Claude ni a IA en commits ni en PR.
- No mezcles cambios funcionales con reformateos masivos.

## Issues y Pull Requests (repo público: `Glinbor10/holgura`)

Rellena siempre la barra lateral de cada PR e issue, no solo el título y la descripción. Así el repo
queda ordenado y se puede filtrar:

- **Reviewers:** `Glinbor10` vía `CODEOWNERS` (la protección de `main` exige 1 aprobación suya). Si la PR la
  abre él mismo, GitHub no deja pedirse revisión a sí mismo: déjalo vacío y dilo, no es un olvido.
- **Assignees:** `Glinbor10`.
- **Labels:** al menos una de tipo (`enhancement`, `bug`, `documentation`, `ci`…). Si la etiqueta no
  existe, créala con `gh label create`. Las notas de release se agrupan por `enhancement` y `bug`.
- **Projects:** el proyecto del repo, si existe. Si no existe, dilo y no lo inventes.
- **Milestone:** la versión a la que pertenece (por ejemplo `v0.2.0`), si hay una abierta.
- **Development:** enlaza la issue que cierra la PR con `Closes #N` en la descripción. Si no hay issue,
  crea una antes cuando el cambio lo merezca.

Con `gh`: `gh pr create --reviewer Glinbor10 --assignee Glinbor10 --label <tipo> --milestone <v>`
y `gh issue create --assignee Glinbor10 --label <tipo>`.

Las issues usan las plantillas de `.github/ISSUE_TEMPLATE` (Error / Idea). No pegues datos reales ni copias
de seguridad en ellas: el repo es público.
