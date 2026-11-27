# Tareas: v0.1 MVP

Orden TDD: primero el test que falla, luego el mínimo código. `[x]` = hecha.

## 1. Proyecto
- [x] 1.1 Scaffold Vite + React + TypeScript + Vitest (`savings-tracker/app`)
- [x] 1.2 Dependencias: MUI, React Router, Capacitor, plugin SQLite

## 2. Dominio puro (`src/domain`) — TDD
- [x] 2.1 `money`: formato EUR y parseo de importes a céntimos
- [x] 2.2 `dates`: helpers de mes (`YYYY-MM`), último día, día 31 en meses cortos
- [x] 2.3 `balances`: saldo de destino, `allowance`, `available`
- [x] 2.4 `payrollSplit`: aplicar plantilla, error si líneas fijas > nómina
- [x] 2.5 `recurring`: qué gastos generar hasta hoy (meses saltados, día 31)
- [x] 2.6 `closing`: opciones de sobrante/déficit, arrastre, reabrir último
- [x] 2.7 `savings`: ahorro del mes y acumulado

## 3. Datos (`src/data`)
- [x] 3.1 Interfaz `Repository` + `localStorageRepository` (web); sin `memoryRepository`: no hacía falta, la lógica se testea con funciones puras
- [x] 3.2 `sqliteRepository` (documento JSON en una fila); sin migraciones de esquema todavía (v1)
- [x] 3.3 `backup`: exportar, validar, importar atómico (test: corrupto / versión futura)

## 4. UI (`src/routes`)
- [x] 4.1 Layout, tema MUI y navegación inferior
- [x] 4.2 Inicio (available, ahorro, últimos movimientos, avisos)
- [x] 4.3 Añadir movimiento (gasto rápido / ingreso). La nómina es una pantalla propia (`/payroll`): importe prellenado desde Ajustes, para qué mes es y reparto de la plantilla
- [x] 4.4 Movimientos (listado, editar, borrar, mes cerrado)
- [x] 4.5 Fijos (CRUD)
- [x] 4.6 Cierre de mes
- [x] 4.7 Histórico
- [x] 4.8 Configuración (antes Ajustes): nómina (importe y cuánto ahorrar), categorías, gastos fijos, cierre de mes, exportar/importar. Los destinos ya no se gestionan en la interfaz

## 5. Android
- [x] 5.1 Configuración de Capacitor y plataforma android
- [x] 5.3 Detalles Android: botón "atrás" (sale solo desde Inicio), icono adaptable propio, arranque a juego, `SystemBars` con márgenes `css`, pantalla de error en vez de pantalla en blanco
- [x] 5.4 Permiso `INTERNET` quitado del manifiesto (ninguna librería lo declara). **Verificar en el móvil que la app arranca**; si no, volver a ponerlo. `allowBackup` desactivado (27/11/2026): Android no copia los datos a ningún sitio; las copias son solo las que exporta el usuario. Las librerías añaden `USE_BIOMETRIC`/`USE_FINGERPRINT`, que la app no usa.
- [x] 5.5 Nombre **Holgura**, id `app.holgura` (el `namespace` Java sigue siendo `com.savingstracker.app`; el id y el namespace pueden diferir)
- [x] 5.6 Firma: el workflow firma con secretos de GitHub si existen (`docs/SIGNING.md`) y sube el `versionCode` con el número de ejecución. Clave creada y 4 secretos subidos; la `v0.1.0` salió firmada.
- [x] 5.7 Licencia PolyForm Noncommercial 1.0.0 (`LICENSE.md`), con `Required Notice` rellena en el README.
- [x] 4.9 Pantallas Fijos, Cierre de mes, Ajustes y Editar rediseñadas al estilo del resto; flujo de cierre de mes recorrido en el navegador (cerrar, ver ahorro) y correcto
- [ ] 5.2 Probar el APK en un móvil real (el APK sale del workflow `Release`; la v0.1.0 está firmada)

## 6. Cierre
- [x] 6.1 Todos los tests en verde, build de producción OK
- [x] 6.2 README (español, para visitantes), guía de desarrollo en `docs/DESARROLLO.md` y verificación de escenarios de la spec
- [ ] 6.3 Probar SQLite y exportar/importar en un dispositivo Android (solo verificado en navegador)
