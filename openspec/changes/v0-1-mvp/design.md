# Diseño técnico: v0.1 MVP

> Las versiones y APIs concretas de librerías (Capacitor, plugin SQLite, MUI, React Router) se
> **verifican con Context7 al implementar**; este documento fija decisiones, no firmas.

## Principios

- **Dominio puro y testeable**: toda la lógica de dinero (saldos, `available`, cierre, reparto,
  generación de fijos) son funciones TypeScript puras, sin acceso a BD ni a React. Ahí se concentra TDD.
- **Local-first**: sin servidor, sin red. Todo funciona offline.
- **Mínimo código**: sin capas especulativas. Una interfaz de repositorio porque hay dos
  implementaciones reales (SQLite en móvil, en memoria en tests).

## Stack

| Pieza | Decisión | Por qué |
|---|---|---|
| UI | React + TypeScript + Vite | Stack habitual; tipado claro |
| Componentes | MUI | Convención del equipo |
| Navegación/carga | React Router (data router, `loader`/`action`) | Cargar datos sin `useEffect` |
| Empaquetado Android | Capacitor | Decidido en la spec; genera el APK |
| Persistencia | SQLite nativo vía plugin de Capacitor | Más robusto que IndexedDB ante limpiezas del WebView; transacciones reales para importar |
| Tests | Vitest | Dominio puro y repositorio en memoria |

Alternativa descartada: IndexedDB (Dexie). Más simple en web, pero el almacenamiento del WebView
puede ser purgado por el sistema y no ofrece las mismas garantías transaccionales.

## Estructura

```
src/
  domain/        # pure functions + types (no I/O)
    money.ts           # cents helpers, EUR formatting
    balances.ts        # destination balances, month allowance/available
    payrollSplit.ts    # apply template, validate
    recurring.ts       # which expenses to generate up to today
    closing.ts         # closing options + reopening
    savings.ts         # monthly savings, accumulated
  data/
    repository.ts      # interface
    sqliteRepository.ts
    memoryRepository.ts   # tests only
    migrations/        # versioned schema
    backup.ts          # export / validate / atomic import
  routes/        # home, add, transactions, recurring, history, settings (loaders/actions)
  components/
```

## Modelo de datos (implementado)

> **Cambio respecto al diseño inicial:** el estado completo se guarda como **un único documento JSON** en una tabla SQLite de una sola fila (`app_state`). La escritura es atómica y el volumen de datos personales es pequeño; es lo mínimo que cumple. El backup es ese mismo JSON. Las tablas normalizadas de abajo quedan como referencia conceptual del modelo. Los gastos fijos usan `startMonth` (en lugar de `lastGeneratedMonth`) y la idempotencia se garantiza comprobando `(recurringId, mes)` ya generados, no con un `UNIQUE` de BD.

Fechas como texto ISO local `YYYY-MM-DD` (sin zona horaria); mes como `YYYY-MM`. Importes en
céntimos (`INTEGER`).

- `destination(id, name, kind: SPENDING|SAVINGS, initialCents, archived)`
- `category(id, name, archived)`
- `transaction(id, type: INCOME|EXPENSE|TRANSFER, date, amountCents, categoryId?, note?,
  fundsMonth?, fromDestinationId?, toDestinationId?, recurringId?, closingMonth?)`
- `income_allocation(transactionId, destinationId, amountCents)` — reparto de un ingreso; un
  ingreso simple tiene una sola fila.
- `payroll_template(id, fundsNextMonth, remainderDestinationId)` + `payroll_template_line(templateId,
  destinationId, amountCents)`
- `recurring_expense(id, name, amountCents, categoryId, dayOfMonth, active, lastGeneratedMonth)`
- `month_closing(month PK, action, carryOutCents, transferTransactionId?, closedAt)`
- `app_meta(key, value)` — `schemaVersion`, `lastExportAt`

Restricciones clave:
- `UNIQUE(recurringId, month)` sobre los gastos generados → idempotencia garantizada por la BD.
- Un gasto siempre referencia el destino SPENDING activo.

## Cálculos (en `domain/`)

- **Saldo de destino** = `initialCents` + asignaciones de ingresos + transferencias entrantes −
  gastos (si es SPENDING) − transferencias salientes.
- **carryIn(M)** = `carryOutCents` del cierre de M−1; 0 si no existe.
- **allowance(M)** = carryIn(M) + Σ asignaciones a SPENDING de ingresos con `fundsMonth` = M.
- **available(M)** = allowance(M) − Σ gastos con fecha en M. Las transferencias NO cuentan.
- **Ahorro del mes** = neto de asignaciones y transferencias hacia/desde destinos SAVINGS con fecha en M.
- Si M−1 no está cerrado, `carryIn(M)` es 0 y Inicio muestra el aviso de cierre pendiente (spec
  `home-and-history`); el valor se corrige al cerrar M−1.

## Cierre y reapertura

- `closing.ts` recibe `available(M)` y devuelve las opciones válidas (sobrante / déficit).
- Aplicar un cierre en **una sola transacción SQL**: transferencia (si la hay) + fila `month_closing`.
- Reabrir: borrar en una transacción la fila `month_closing` y su transferencia; solo el último.

## Gastos fijos

Al arrancar la app (en el `loader` raíz, no en un efecto): `recurring.ts` calcula qué
(plantilla, mes) faltan hasta hoy y el repositorio los inserta; el `UNIQUE` evita duplicados aunque
se ejecute dos veces.

## Backup

- Export: volcado de todas las tablas a JSON con `schemaVersion`; guardado/compartido con las
  utilidades de Capacitor (Filesystem + Share).
- Import: parsear → validar estructura y versión → en **una transacción** vaciar y cargar. Cualquier
  fallo hace rollback y deja los datos intactos.
- Migraciones: una lista ordenada de migraciones; un `schemaVersion` mayor al soportado se rechaza.

## Convenciones de UI (React)

Sin `useEffect` (carga en loaders, escritura en actions/handlers); renderizado condicional con
ternario; props en línea; MUI siempre que exista componente. Pantalla "Añadir gasto" a 2–3 toques:
importe con teclado numérico, chips de categorías recientes, fecha = hoy.

## Estrategia de tests (TDD)

Solo tests que puedan fallar por un cambio en nuestro código:
- `domain/`: un caso por escenario de la spec — reparto (incl. error por líneas > nómina), nómina del
  28 con `fundsMonth`, `available`, cierre con sobrante/déficit/arrastre, fijos (día 31, meses
  saltados, idempotencia), ahorro del mes y acumulado.
- `data/backup`: importar fichero corrupto o de versión futura no modifica datos (repositorio en
  memoria o SQLite de test).
- Sin tests de getters, constantes ni snapshots sin aserciones.

## Build y distribución

- `vite build` → `cap sync android` → Gradle genera el APK. El primer entregable es un APK de
  **debug** instalable a mano; el de release exige keystore.
- La **keystore y sus contraseñas no se commitean** nunca (variables locales / GitHub Secrets).
- GitHub y CI (Actions para build del APK) se añaden cuando montes el repo; no bloquean la v0.1.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Datos solo en el móvil | Export/importar + recordatorio a 30 días |
| Plugin SQLite no funciona en `vite dev` (navegador) | Desarrollar contra `memoryRepository` y probar SQLite en emulador/dispositivo |
| Fechas y zonas horarias | Fechas ISO locales como texto, sin `Date` UTC en el dominio |
| Cambios de esquema futuros | Migraciones versionadas + `schemaVersion` en backups |
