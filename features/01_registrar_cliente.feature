# language: es
Característica: Registrar cliente
  Como recepcionista
  Quiero registrar los datos de un cliente
  Para asociarle sus equipos y reparaciones

  Antecedentes:
    Dado el usuario recepcionista autenticado

  Escenario: Registro exitoso de un cliente nuevo
    Cuando registra al cliente "Ana Gómez" con documento "30111222"
    Entonces el sistema responde con estado 201
    Y el cliente "Ana Gómez" queda registrado

  Escenario: No se permite registrar dos clientes con el mismo documento
    Dado un cliente "Ana Gómez" con documento "30111222" ya registrado
    Cuando registra al cliente "Ana Pérez" con documento "30111222"
    Entonces el sistema responde con estado 409
    Y el mensaje de error contiene "documento"

  Escenario: El documento es obligatorio
    Cuando registra un cliente "Ana Gómez" sin documento
    Entonces el sistema responde con estado 400
    Y el mensaje de error contiene "documentId"
