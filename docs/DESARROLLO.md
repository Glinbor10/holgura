# Desarrollo de Holgura

Guía para quien mantiene el código. El README es solo para quien quiere conocer y descargar la app.

[![CI](https://github.com/Glinbor10/holgura/actions/workflows/ci.yml/badge.svg)](https://github.com/Glinbor10/holgura/actions/workflows/ci.yml)

## Pila

React, TypeScript, Vite, MUI y Capacitor para empaquetar la app Android. La base de datos es SQLite en
Android y localStorage en el navegador.

```bash
cd app
npm ci
npm run dev      # navegador (guarda los datos en localStorage)
npx tsc -b       # tipos
npm test         # tests de la lógica y de la capa de datos
npm run build
```

Las reglas del dinero viven en `app/src/domain` como funciones puras, sin acceso a la base de datos ni a
la interfaz, y por eso se prueban fácilmente.

| Carpeta | Contenido |
|---|---|
| [`app/`](../app/README.md) | Código de la app |
| [`openspec/`](../openspec/changes/v0-1-mvp/proposal.md) | Especificación del producto, diseño técnico y tareas |
| [`docs/`](SIGNING.md) | Firma del APK y capturas de pantalla |
| `.github/workflows/` | CI de las pull requests y publicación de versiones con su APK |

## Publicar una versión

```bash
git tag v0.2.0 && git push origin v0.2.0
```

O desde **Actions > Release > Run workflow**, escribiendo la versión. El workflow compila el APK y crea la
release con él adjunto. Sin clave de firma configurada, la release sale como pre-release con un APK de debug.
La firma se explica en [`SIGNING.md`](SIGNING.md).

## Cambios y contribuciones

`main` está protegida: los cambios entran solo por pull request y necesitan la aprobación del propietario.
Antes de abrir una PR, `npx tsc -b`, `npm test` y `npm run build` deben pasar. Las vulnerabilidades se
reportan en privado ([`SECURITY.md`](../SECURITY.md)).
