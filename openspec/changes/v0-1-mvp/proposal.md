# Propuesta: v0.1 MVP — control de nómina, gastos y ahorro

> Convención: en las specs, **DEBE** equivale a SHALL/MUST (requisito obligatorio).
> Código, identificadores y comentarios en inglés; documentación en español.

## Contexto

Aplicación personal, open-source, para controlar la nómina mensual, apuntar gastos (fijos y
variables) y ver cuánto se ahorra cada mes y en el histórico. Se usa **principalmente desde Android
(APK)**. Los datos viven **solo en el móvil** (local-first, sin servidor).

## Cambios propuestos

Se añaden las siguientes capacidades (cada una con su `spec.md`):

| Capacidad | Resumen |
|---|---|
| `destinations` | Destinos con saldo (etiquetas, p. ej. "Cuenta gastos", "Ahorro") |
| `transactions` | Alta/edición de ingresos y gastos, categorías |
| `payroll-split` | Plantilla de reparto de la nómina entre destinos y "mes que financia" |
| `recurring-expenses` | Gastos fijos que se crean solos el día X |
| `month-closing` | Cierre de mes asistido (sobrante / saldo negativo) |
| `home-and-history` | Pantalla de Inicio e Histórico de ahorro |
| `backup` | Exportar / importar copia de seguridad (JSON) |

## Objetivo

Poder cobrar la nómina, apuntar un gasto en la calle en 2–3 toques y revisar el ahorro a fin de
mes, todo desde el APK, sin conexión y sin perder datos.

## Modelo conceptual (resumen)

- **Destino**: etiqueta con saldo corriente (no se reinicia cada mes). Tipo `SPENDING` o `SAVINGS`.
- **Movimiento**: `INCOME`, `EXPENSE` o `TRANSFER`. Importes en **céntimos enteros**.
- **Mes natural (1–31)** como vista de informes. El saldo de los destinos es continuo.
- **Mes que financia** (`fundsMonth`): cada ingreso indica qué mes presupuestario financia. La nómina
  del día 28 financia por defecto el **mes siguiente**. Esta es la regla que resuelve el arrastre.

## Decisiones ya tomadas

- Android (APK) vía web React + Capacitor; datos solo en el móvil; sin GitHub por ahora.
- Mes natural con arrastre; sobrante propuesto y confirmado por el usuario; saldo negativo decidido
  por el usuario al cerrar; gastos fijos automáticos el día X.
- Exportar/importar copia de seguridad ENTRA en v0.1.

## Fuera de alcance (v0.1)

Importar CSV del banco, objetivos de ahorro, presupuesto por categoría con avisos, conciliación
bancaria, multi-usuario, multi-moneda, gráficas por categoría y comparativas, sincronización con
servidor, iOS, i18n (interfaz solo en español).

## Decisiones sobre las preguntas abiertas (cerradas)

1. **Moneda:** EUR fija en v0.1.
2. **Android mínimo:** el que exija la versión vigente de Capacitor (se fija en el diseño).
3. **Reabrir mes:** solo el último mes cerrado.
4. **Bloqueo PIN/huella:** fuera de v0.1.
