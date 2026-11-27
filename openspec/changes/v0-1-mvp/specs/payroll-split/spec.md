# Capacidad: payroll-split

## ADDED Requirements

### Requirement: Plantilla de reparto de nómina
El sistema DEBE permitir definir una plantilla de reparto con líneas de importe fijo hacia
destinos concretos y un **resto** que va al destino `SPENDING`. Al registrar una nómina se aplica
la plantilla sobre el importe cobrado y se generan los movimientos de entrada en cada destino.

#### Scenario: Reparto estándar
- GIVEN una plantilla "300,00 € → Ahorro, resto → Gastos"
- WHEN el usuario registra una nómina de 1500,00 €
- THEN "Ahorro" recibe 300,00 € y "Gastos" recibe 1200,00 €

#### Scenario: Nómina menor que las líneas fijas
- GIVEN una plantilla con líneas fijas que suman 300,00 €
- WHEN el usuario registra una nómina de 200,00 €
- THEN el sistema avisa y exige ajustar el reparto antes de guardar

#### Scenario: Reparto editable al cobrar
- GIVEN una nómina a punto de guardarse
- WHEN el usuario modifica el reparto propuesto
- THEN se guarda el reparto modificado sin alterar la plantilla

### Requirement: Mes que financia
Cada ingreso DEBE tener un `fundsMonth` que indica el mes presupuestario al que financia. Para las
nóminas, el valor por defecto DEBE ser configurable: "mismo mes" o "mes siguiente". El usuario
puede cambiarlo al registrar el ingreso.

#### Scenario: Nómina del 28 financia el mes siguiente
- GIVEN la plantilla configurada con "financia el mes siguiente"
- WHEN el usuario registra una nómina el 28 de noviembre
- THEN su `fundsMonth` es diciembre
- AND el dinero está en los destinos desde el 28 de noviembre

#### Scenario: Cambiar el mes que financia
- GIVEN una nómina con `fundsMonth` = diciembre
- WHEN el usuario lo cambia a noviembre
- THEN el presupuesto de noviembre aumenta y el de diciembre disminuye en la parte SPENDING
