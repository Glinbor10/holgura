# Capacidad: month-closing

## ADDED Requirements

### Requirement: Presupuesto disponible del mes
Para un mes M, el sistema DEBE calcular:
- `allowance(M)` = arrastre de entrada de M + suma de las partes `SPENDING` de los ingresos con
  `fundsMonth` = M.
- `available(M)` = `allowance(M)` − suma de los gastos con fecha dentro de M.

#### Scenario: Nómina del 28 financia diciembre
- GIVEN una nómina de 1200,00 € a SPENDING el 28 de noviembre con `fundsMonth` = diciembre
- AND gastos de noviembre por 900,00 € financiados por la nómina de octubre
- WHEN se consulta diciembre
- THEN `allowance(diciembre)` incluye los 1200,00 € y `available(diciembre)` los descuenta de los gastos de diciembre

### Requirement: Cierre asistido con sobrante
Al cerrar el mes M con `available(M)` > 0, el sistema DEBE proponer el sobrante y ofrecer dos
opciones: **mover a ahorro** (transferencia de SPENDING a un destino SAVINGS elegido, fechada el
último día de M) o **arrastrar** al mes siguiente. Nada se aplica sin confirmación del usuario.

#### Scenario: Sobrante a ahorro
- GIVEN `available(noviembre)` = 85,00 €
- WHEN el usuario cierra noviembre y elige "mover a ahorro"
- THEN se crea una transferencia de 85,00 € de SPENDING a Ahorro con fecha 30 de noviembre
- AND el arrastre de entrada de diciembre es 0

#### Scenario: Sobrante arrastrado
- GIVEN `available(noviembre)` = 85,00 €
- WHEN el usuario elige "arrastrar"
- THEN el arrastre de entrada de diciembre es 85,00 € y no se crea ninguna transferencia

### Requirement: Cierre asistido con saldo negativo
Con `available(M)` < 0, el sistema DEBE ofrecer **cubrir con ahorro** (transferencia de un destino
SAVINGS a SPENDING por el importe del déficit) o **arrastrar** el déficit como arrastre negativo.

#### Scenario: Cubrir déficit
- GIVEN `available(noviembre)` = −40,00 €
- WHEN el usuario elige "cubrir con ahorro"
- THEN se crea una transferencia de 40,00 € de Ahorro a Gastos fechada el 30 de noviembre

### Requirement: Cierre solo de meses terminados
El sistema DEBE permitir cerrar un mes solo cuando su último día ya ha pasado, y solo en orden
cronológico (no se cierra M+1 sin haber cerrado M).

#### Scenario: Cerrar el mes en curso
- GIVEN que hoy es 15 de noviembre
- WHEN el usuario intenta cerrar noviembre
- THEN el sistema lo impide

### Requirement: Reabrir el último mes cerrado
El sistema DEBE permitir reabrir solo el último mes cerrado, deshaciendo la transferencia y el
arrastre generados por su cierre.

#### Scenario: Reabrir
- GIVEN noviembre cerrado con una transferencia de 85,00 € a ahorro
- WHEN el usuario lo reabre
- THEN la transferencia se elimina y el mes vuelve a ser editable
