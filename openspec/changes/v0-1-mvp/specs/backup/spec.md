# Capacidad: backup

## ADDED Requirements

### Requirement: Exportar copia de seguridad
El sistema DEBE exportar todos los datos (destinos, categorías, movimientos, plantilla de
reparto, gastos fijos, cierres y ajustes) a un único fichero JSON con `schemaVersion` y fecha de
exportación, y permitir guardarlo o compartirlo mediante el sistema de Android.

#### Scenario: Exportar
- GIVEN una instalación con datos
- WHEN el usuario pulsa "Exportar copia"
- THEN se genera un fichero JSON con todos los datos y su `schemaVersion`
- AND el usuario puede guardarlo o compartirlo (Drive, correo, etc.)

### Requirement: Importar copia de seguridad
El sistema DEBE importar un fichero de copia **reemplazando** todos los datos actuales, previa
confirmación explícita que indique que se perderán los datos actuales.

#### Scenario: Importar en un móvil nuevo
- GIVEN una instalación vacía y un fichero de copia válido
- WHEN el usuario lo importa y confirma
- THEN todos los datos quedan restaurados y los saldos coinciden con los de la copia

### Requirement: Validación atómica de la importación
El sistema DEBE validar el fichero (formato y `schemaVersion`) antes de tocar los datos. Si es
inválido o su versión es posterior a la soportada, DEBE rechazarlo sin modificar nada.

#### Scenario: Fichero corrupto
- GIVEN un fichero JSON malformado
- WHEN el usuario intenta importarlo
- THEN se muestra un error y los datos actuales no cambian

#### Scenario: Versión futura
- GIVEN un fichero con `schemaVersion` mayor que la soportada
- WHEN el usuario intenta importarlo
- THEN se rechaza indicando que hay que actualizar la app

### Requirement: Recordatorio de copia
El sistema DEBERÍA avisar si han pasado más de 30 días desde la última exportación, dado que los
datos viven solo en el móvil.

#### Scenario: Aviso tras 30 días
- GIVEN que la última exportación fue hace 31 días
- WHEN el usuario abre Inicio
- THEN se muestra un recordatorio para exportar una copia
