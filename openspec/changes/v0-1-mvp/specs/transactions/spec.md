# Capacidad: transactions

## ADDED Requirements

### Requirement: Alta rápida de gasto
El sistema DEBE permitir registrar un gasto indicando importe y categoría, con fecha igual a hoy
por defecto, y nota opcional. La fecha DEBE ser editable. El gasto se descuenta del destino
`SPENDING`.

#### Scenario: Gasto en la calle
- GIVEN la pantalla "Añadir movimiento" abierta en modo gasto
- WHEN el usuario introduce 12,50 y elige la categoría "Comida" y guarda
- THEN se crea un gasto de 1250 céntimos con fecha de hoy
- AND el saldo del destino SPENDING disminuye en 12,50 €

#### Scenario: Importe inválido
- GIVEN la pantalla de alta de gasto
- WHEN el usuario intenta guardar con importe 0 o vacío
- THEN el sistema no guarda y muestra un error de validación

### Requirement: Alta de ingreso
El sistema DEBE permitir registrar un ingreso con importe, fecha, nota opcional y destino de
entrada. Si el ingreso es una nómina, se aplica la capacidad `payroll-split`.

#### Scenario: Ingreso simple
- GIVEN un ingreso de 50,00 € hacia "Gastos"
- WHEN el usuario guarda
- THEN el saldo de "Gastos" aumenta en 50,00 €

### Requirement: Importes en céntimos enteros
El sistema DEBE almacenar y calcular importes como enteros en céntimos, sin usar coma flotante.

#### Scenario: Suma sin error de redondeo
- GIVEN gastos de 0,10 € y 0,20 €
- WHEN se calcula el total
- THEN el total es exactamente 0,30 €

### Requirement: Categorías
El sistema DEBE incluir categorías por defecto y permitir crear, renombrar y archivar categorías.
Una categoría con movimientos NO se elimina: se archiva y sigue visible en los movimientos antiguos.

#### Scenario: Archivar una categoría usada
- GIVEN una categoría con movimientos
- WHEN el usuario la archiva
- THEN deja de ofrecerse en altas nuevas
- AND los movimientos antiguos conservan su categoría

### Requirement: Listado y edición de movimientos
El sistema DEBE mostrar los movimientos del mes seleccionado, ordenados por fecha descendente,
y permitir editarlos y borrarlos. Editar o borrar DEBE recalcular los saldos.

#### Scenario: Borrar un gasto
- GIVEN un gasto de 20,00 € en el mes en curso
- WHEN el usuario lo borra
- THEN el saldo de SPENDING aumenta en 20,00 €

#### Scenario: Mes cerrado
- GIVEN un mes cerrado
- WHEN el usuario intenta editar o borrar un movimiento de ese mes
- THEN el sistema lo impide e indica que hay que reabrir el mes (si es el último cerrado)
