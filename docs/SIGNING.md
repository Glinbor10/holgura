# Firmar el APK de Holgura

Android solo deja **actualizar** una app si la nueva versión está firmada con **la misma clave**
que la instalada. Si la clave cambia, hay que desinstalar la app y se **pierden los datos locales**.
Por eso el APK se firma siempre con una clave tuya, fija, que se crea una sola vez.

## 1. Crear la clave (una sola vez, en tu PC)

Necesitas Java (`keytool` viene con el JDK). En una terminal:

```bash
keytool -genkeypair -v -keystore holgura.jks -alias holgura -keyalg RSA -keysize 2048 -validity 10000
```

Te pedirá una contraseña para el fichero y otra para la clave (pueden ser la misma), y tus datos.
**Apunta las contraseñas en un gestor de contraseñas.**

## 2. Guardar copia de la clave (importante)

Guarda `holgura.jks` y sus contraseñas fuera del repositorio: gestor de contraseñas, USB o una
nube privada. **Si la pierdes no podrás publicar actualizaciones** que se instalen encima.
Nunca la subas a GitHub. El `.gitignore` ya ignora `*.jks` y `*.keystore`.

## 3. Pasarla a GitHub como secretos

Convierte el fichero a texto (base64):

- **Windows (PowerShell):** `[Convert]::ToBase64String([IO.File]::ReadAllBytes("holgura.jks")) | Set-Clipboard`
- **Linux / macOS:** `base64 -w0 holgura.jks`

En el repositorio: **Settings > Secrets and variables > Actions > New repository secret**, y crea
estos cuatro:

| Nombre | Valor |
|---|---|
| `HOLGURA_KEYSTORE_BASE64` | el texto base64 del paso anterior |
| `HOLGURA_KEYSTORE_PASSWORD` | la contraseña del fichero `.jks` |
| `HOLGURA_KEY_ALIAS` | `holgura` |
| `HOLGURA_KEY_PASSWORD` | la contraseña de la clave |

## 4. Compilar

**Actions > Build APK > Run workflow**. El artefacto `holgura-apk` contiene `app-release.apk`,
ya firmado. Cada ejecución sube el `versionCode` automáticamente, así que Android lo acepta como
actualización.

## Antes de cualquier reinstalación

Exporta una copia de seguridad desde la app (Ajustes > Exportar copia). Si alguna vez hay que
desinstalar, esa copia es lo único que recupera tus datos.
