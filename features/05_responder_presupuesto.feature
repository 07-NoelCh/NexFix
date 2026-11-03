# language: es
Característica: Responder presupuesto
  Como recepcionista
  Quiero registrar si el cliente aprueba o rechaza el presupuesto
  Para continuar o cerrar la orden

  Antecedentes:
    Dado el usuario recepcionista autenticado

  Escenario: El cliente aprueba el presupuesto
    Dado una orden de "Ana Gómez" en estado "PRESUPUESTADO" asignada a "Carlos"
    Cuando la recepción aprueba el presupuesto de la orden de "Ana Gómez"
    Entonces el sistema responde con estado 200
    Y la orden de "Ana Gómez" queda en estado "EN_REPARACION"

  Escenario: El cliente rechaza el presupuesto
    Dado una orden de "Ana Gómez" en estado "PRESUPUESTADO" asignada a "Carlos"
    Cuando la recepción rechaza el presupuesto de la orden de "Ana Gómez"
    Entonces el sistema responde con estado 200
    Y la orden de "Ana Gómez" queda en estado "RECHAZADO"

  Escenario: No se puede responder un presupuesto que no existe
    Dado una orden de "Ana Gómez" en estado "RECIBIDO"
    Cuando la recepción aprueba el presupuesto de la orden de "Ana Gómez"
    Entonces el sistema responde con estado 409
    Y la orden de "Ana Gómez" queda en estado "RECIBIDO"
