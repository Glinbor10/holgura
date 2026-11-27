# Publicar Holgura en GitHub (guía para Claude)

Guía de una sola vez para cuando el usuario diga "publícalo". Cuando se haya publicado, este fichero
y su referencia en `CLAUDE.md` se pueden borrar en una PR.

Lee antes `CLAUDE.md` y `openspec/changes/v0-1-mvp/tasks.md`. Respeta además las reglas globales del
usuario (rama con su prefijo de usuario de GitHub, commits en inglés, sin atribución a IA).

## 0. Comprobar el entorno

```bash
gh auth status        # debe estar logueado; si no, pídele que ejecute: ! gh auth login
git --version
node -v               # 22 o superior
```

Si falta algo, díselo y espera. No instales herramientas sin preguntar.

## 1. Preguntar al usuario (una sola vez, todo junto)

No des por hechas estas respuestas:

1. **Propietario del repositorio:** su cuenta personal u otra organización.
2. **Nombre del repo:** propuesta `holgura`.
3. **Titular de la licencia:** el texto exacto que irá en la línea `Required Notice: Copyright (c) 2026 ...`
   del `README.md` (nombre o alias; no lo inventes ni uses datos de su empresa).
4. **Confirmar que el repositorio es público.**

## 2. Revisión previa (no sigas si algo falla)

```bash
cd app
npm ci && npx tsc -b && npm test && npm run build
cd ..
```

Busca secretos y datos personales:

```bash
rg -n -i "(password|secret|token|api[_-]?key|BEGIN (RSA |EC )?PRIVATE)" \
  --glob '!**/node_modules/**' --glob '!app/package-lock.json' --glob '!app/dist/**'
```

Solo deberían salir menciones de documentación o **nombres** de variables de entorno
(`docs/SIGNING.md`, `build-apk.yml`, `app/android/app/build.gradle`). Si aparece un valor real, para y avisa.

Comprueba que **no** viajan estas cosas al repositorio: `node_modules`, `app/dist`, `app/android/app/build`,
`*.jks`, `*.keystore`, `.playwright-mcp`. Confirma que existen `docs/screenshots/*.png` (las usa el README).

## 3. Crear el repositorio y abrir la PR de importación

No se puede abrir una PR contra un repo vacío, y no se hace commit directo a `main`. Por eso se crea el
repo con un `README` inicial hecho por GitHub y todo el proyecto entra por una rama y una PR.

```bash
gh repo create <propietario>/<nombre> --public --add-readme \
  --description "Cuánto puedes gastar de verdad. App Android para controlar tu nómina, gastos y ahorro, sin conexión."
gh repo clone <propietario>/<nombre> <carpeta-temporal>/<nombre>
```

Copia el proyecto al clon **sin** lo pesado ni lo secreto.

- Windows (PowerShell):
  ```powershell
  robocopy <origen> <clon> /E /XD node_modules dist build .git .gradle .playwright-mcp /XF *.jks *.keystore
  # robocopy devuelve códigos < 8 cuando todo va bien
  ```
- macOS / Linux:
  ```bash
  rsync -a --exclude node_modules --exclude dist --exclude build --exclude .git \
    --exclude .gradle --exclude .playwright-mcp --exclude '*.jks' --exclude '*.keystore' <origen>/ <clon>/
  ```

Sustituye en `README.md` el texto `[TITULAR: pon aquí tu nombre o alias]` por lo que respondió el usuario.

Rama y commits (Conventional Commits, en inglés, sin atribución a IA). Propuesta de tres commits:

```bash
git checkout -b <prefijo-de-rama-del-usuario>/initial-import
git add .gitignore openspec docs LICENSE CLAUDE.md && git commit -m "docs: add product spec, design and publishing notes"
git add app && git commit -m "feat: add Holgura Android app"
git add .github README.md && git commit -m "ci: add APK build and pull request checks"
git push -u origin HEAD
```

Abre la PR contra `main` con `gh pr create`. Descripción en español: contexto, alcance (app, spec, workflows),
validación (tsc, tests y build que pasaste en el paso 2), riesgos (qué no está probado en móvil) y rollback.
**No fusiones la PR**: enséñasela al usuario y que decida.

Al fusionarse, el workflow `Build APK` se ejecutará solo (push a `main`). Sin secretos de firma construye un
APK de debug: sirve para probar, pero **no** para usar a diario (ver paso 5).

## 4. Después de fusionar

```bash
git switch main && git pull --ff-only
gh repo edit --add-topic android --add-topic finanzas-personales --add-topic react \
  --add-topic capacitor --add-topic offline-first
```

## 5. Firma del APK (hazlo con el usuario, sin ver sus contraseñas)

Android solo actualiza una app firmada con la misma clave; si cambia, hay que desinstalar y se
**pierden los datos**. Sigue `docs/SIGNING.md`:

1. El usuario crea la clave **él mismo** en su terminal con `! keytool ...` y elige las contraseñas.
   Tú no las generas, no las lees y no las repites en el chat.
2. Que guarde `holgura.jks` y las contraseñas en un gestor de contraseñas, fuera del repositorio.
3. Sube los cuatro secretos sin mostrar valores:
   - `HOLGURA_KEYSTORE_BASE64`: `base64 -w0 holgura.jks | gh secret set HOLGURA_KEYSTORE_BASE64`
     (en PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("holgura.jks")) | gh secret set HOLGURA_KEYSTORE_BASE64`)
   - `HOLGURA_KEY_ALIAS`: el alias (propuesto `holgura`).
   - `HOLGURA_KEYSTORE_PASSWORD` y `HOLGURA_KEY_PASSWORD`: que los ejecute el usuario con `! gh secret set <NOMBRE>`
     y los escriba en el prompt.
4. Nunca commitees la keystore. El `.gitignore` ya ignora `*.jks` y `*.keystore`.

## 6. Compilar el APK firmado

```bash
gh workflow run "Build APK" --ref main
gh run watch                      # o: gh run list --workflow "Build APK" --limit 1
gh run download <id> -n holgura-apk -D <carpeta>
```

Si falla, **no lo reintentes a ciegas**: `gh run view <id> --log-failed`, diagnostica la causa, corrige en una
rama nueva y abre otra PR. Fallos probables, porque este workflow no se había ejecutado nunca:

- Versión de alguna acción (`actions/checkout@v4`, `setup-java@v4`, `upload-artifact@v4`).
- Java 21 o la versión de Gradle.
- `chmod +x gradlew` o rutas del artefacto.
- Falta de licencias del SDK de Android en el runner.

## 7. Entregar al usuario

Dile dónde está el `app-release.apk` y cómo instalarlo. Antes de actualizar una versión ya instalada, que
exporte una copia desde Ajustes.

Pídele que pruebe y te cuente el resultado de esta lista (es lo que **sigue sin verificar**):

1. La app abre sin internet y no pide permisos (comprobar que quitar `INTERNET` no la rompe).
2. Apuntar un gasto, cerrar la app del todo y volver a abrirla: el gasto sigue ahí (SQLite).
3. Exportar una copia y compartirla; importarla después.
4. El botón o gesto "atrás" navega por la app y solo sale desde Inicio.
5. Girar la pantalla, modo claro y oscuro, icono y pantalla de arranque.

Con sus resultados, actualiza `openspec/changes/v0-1-mvp/tasks.md` (tareas 5.2 y 6.3) en una rama y una PR.

## Lo que no debes hacer

- Commit directo a `main`, `--force`, ni fusionar PRs sin que el usuario lo pida.
- Cambiar `applicationId` (`app.holgura`), quitar la licencia o añadir telemetría.
- Subir una keystore, una contraseña o un token; mostrarlos o guardarlos en memoria.
- Dar por probado en móvil algo que no se ha probado.
