# Capacidad: home-and-history

## ADDED Requirements

### Requirement: Pantalla de Inicio
La pantalla de Inicio DEBE mostrar para el mes en curso: `available` (lo que queda por gastar),
el saldo de cada destino `SAVINGS` y los últimos movimientos. DEBE ofrecer acceso directo a
"Añadir gasto".

#### Scenario: Consulta diaria
- GIVEN un mes con `available` = 230,40 € y Ahorro = 1500,00 €
- WHEN el usuario abre la app
- THEN ve esas dos cifras y sus 5 últimos movimientos

#### Scenario: Aviso de cierre pendiente
- GIVEN que el mes anterior ya terminó y no está cerrado
- WHEN el usuario abre Inicio
- THEN se muestra un aviso para cerrarlo

### Requirement: Ahorro del mes
El ahorro del mes M DEBE ser la suma neta de las entradas menos las salidas de todos los destinos
`SAVINGS` con fecha dentro de M (reparto de nómina, transferencias de cierre y retiradas).

#### Scenario: Ahorro con reparto y cierre
- GIVEN en noviembre un reparto de nómina de 300,00 € a Ahorro y un cierre que mueve 85,00 €
- WHEN se consulta el ahorro de noviembre
- THEN es 385,00 €

### Requirement: Histórico
La pantalla Histórico DEBE listar los meses con su ahorro mensual y mostrar el ahorro acumulado
(saldo total de destinos `SAVINGS`).

#### Scenario: Acumulado
- GIVEN ahorros mensuales de 200,00 €, 150,00 € y −50,00 €
- WHEN el usuario abre Histórico
- THEN el acumulado mostrado es 300,00 € más los saldos iniciales de los destinos SAVINGS

### Requirement: Funcionamiento sin conexión
Todas las pantallas DEBEN funcionar sin conexión a internet.

#### Scenario: Modo avión
- GIVEN el móvil sin conexión
- WHEN el usuario añade un gasto y consulta el Histórico
- THEN ambas operaciones funcionan con normalidad
