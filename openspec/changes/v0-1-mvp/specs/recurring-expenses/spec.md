# Capacidad: recurring-expenses

## ADDED Requirements

### Requirement: Definición de gasto fijo
El sistema DEBE permitir definir gastos fijos con nombre, importe, categoría, día del mes (1–31) y
estado activo/inactivo. Si el mes no tiene ese día, se usa el último día del mes.

#### Scenario: Día 31 en un mes corto
- GIVEN un gasto fijo con día 31
- WHEN se genera para febrero
- THEN su fecha es el último día de febrero

### Requirement: Generación automática al abrir la app
No existe servidor ni proceso en segundo plano, por lo que el sistema DEBE generar los gastos fijos
al abrir la app: para cada gasto fijo activo y cada mes desde el último generado hasta hoy, crear el
gasto si su fecha es igual o anterior a hoy.

#### Scenario: Mes sin abrir la app
- GIVEN un gasto fijo del día 5 y la app sin abrir desde el 20 de octubre
- WHEN el usuario la abre el 10 de diciembre
- THEN existen los gastos del 5 de noviembre y del 5 de diciembre

#### Scenario: Idempotencia
- GIVEN un gasto fijo ya generado para un mes
- WHEN el usuario abre la app varias veces
- THEN no se crean duplicados

### Requirement: Cambios en la plantilla no reescriben el pasado
Modificar el importe o el día de un gasto fijo DEBE afectar solo a los meses aún no generados. Los
gastos ya generados se pueden editar individualmente como cualquier movimiento.

#### Scenario: Subida de alquiler
- GIVEN un alquiler fijo de 600,00 € ya generado en noviembre
- WHEN el usuario lo cambia a 650,00 €
- THEN noviembre sigue en 600,00 € y diciembre se genera en 650,00 €

### Requirement: Desactivar un gasto fijo
Un gasto fijo inactivo DEBE dejar de generar movimientos sin borrar los ya creados.

#### Scenario: Cancelar una suscripción
- GIVEN una suscripción activa con gastos en meses anteriores
- WHEN el usuario la desactiva
- THEN no se generan más gastos y los anteriores se conservan
