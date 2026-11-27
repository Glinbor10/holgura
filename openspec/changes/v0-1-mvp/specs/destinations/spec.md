# Capacidad: destinations

## ADDED Requirements

### Requirement: Gestión de destinos
El sistema DEBE permitir crear, renombrar y archivar destinos. Cada destino tiene nombre, tipo
(`SPENDING` o `SAVINGS`) y saldo inicial. En una instalación nueva DEBEN existir por defecto un
destino `SPENDING` ("Gastos") y uno `SAVINGS` ("Ahorro").

#### Scenario: Instalación nueva
- GIVEN una instalación sin datos
- WHEN el usuario abre la app por primera vez
- THEN existen los destinos "Gastos" (SPENDING) y "Ahorro" (SAVINGS) con saldo 0

#### Scenario: Archivar un destino con saldo
- GIVEN un destino con saldo distinto de 0
- WHEN el usuario intenta archivarlo
- THEN el sistema lo rechaza e indica que debe dejar el saldo en 0 primero

### Requirement: Un único destino SPENDING activo
El sistema DEBE mantener exactamente un destino `SPENDING` activo, que es el origen de los gastos.
Puede haber varios destinos `SAVINGS`.

#### Scenario: Intento de crear un segundo SPENDING
- GIVEN que ya existe un destino SPENDING activo
- WHEN el usuario intenta crear otro de tipo SPENDING
- THEN el sistema lo rechaza

### Requirement: Saldo corriente
El saldo de un destino DEBE ser su saldo inicial más ingresos y transferencias entrantes menos
gastos y transferencias salientes. El saldo NO se reinicia al cambiar de mes y puede ser negativo.

#### Scenario: Saldo continuo entre meses
- GIVEN un destino con saldo 100,00 € a 31 de octubre
- WHEN llega el 1 de noviembre sin movimientos
- THEN su saldo sigue siendo 100,00 €
