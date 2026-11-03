# language: es
Característica: Entregar equipo y registrar pago
  Como recepcionista
  Quiero registrar la entrega y el pago
  Para cerrar la orden

  Antecedentes:
    Dado el usuario recepcionista autenticado
    Y una mano de obra estándar de 12000 pesos

  Escenario: Entrega exitosa con pago exacto
    Dado una orden de "Ana Gómez" en estado "LISTO" asignada a "Carlos"
    Cuando la recepción entrega la orden de "Ana Gómez" con pago "EFECTIVO" por 12000 pesos
    Entonces el sistema responde con estado 200
    Y la orden de "Ana Gómez" queda en estado "ENTREGADO"

  Escenario: El monto del pago debe coincidir con el total
    Dado una orden de "Ana Gómez" en estado "LISTO" asignada a "Carlos"
    Cuando la recepción entrega la orden de "Ana Gómez" con pago "TARJETA" por 5000 pesos
    Entonces el sistema responde con estado 400
    Y el mensaje de error contiene "monto"
    Y la orden de "Ana Gómez" queda en estado "LISTO"

  Escenario: No se puede entregar un equipo que no está listo
    Dado una orden de "Ana Gómez" en estado "EN_REPARACION" asignada a "Carlos"
    Cuando la recepción entrega la orden de "Ana Gómez" con pago "EFECTIVO" por 12000 pesos
    Entonces el sistema responde con estado 409
    Y la orden de "Ana Gómez" queda en estado "EN_REPARACION"
