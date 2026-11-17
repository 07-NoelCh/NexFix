# language: es
Característica: Cancelar orden de reparación
  Como recepcionista
  Quiero cancelar una orden antes de que empiece la reparación
  Para liberar al técnico y cerrar pedidos que el cliente ya no quiere

  Antecedentes:
    Dado el usuario recepcionista autenticado

  Escenario: Cancelación exitosa de una orden recibida
    Dado una orden de "Ana Gómez" en estado "RECIBIDO"
    Cuando la recepción cancela la orden de "Ana Gómez" por el motivo "El cliente ya no la quiere"
    Entonces el sistema responde con estado 200
    Y la orden de "Ana Gómez" queda en estado "CANCELADO"
    Y el historial registra la cancelación con el motivo "El cliente ya no la quiere"

  Escenario: No se puede cancelar una orden que ya está en reparación
    Dado una orden de "Ana Gómez" en estado "EN_REPARACION" asignada a "Carlos"
    Cuando la recepción cancela la orden de "Ana Gómez" por el motivo "Cambié de opinión"
    Entonces el sistema responde con estado 409
    Y la orden de "Ana Gómez" queda en estado "EN_REPARACION"

  Escenario: El motivo de la cancelación es obligatorio
    Dado una orden de "Ana Gómez" en estado "RECIBIDO"
    Cuando la recepción cancela la orden de "Ana Gómez" por el motivo " "
    Entonces el sistema responde con estado 400
    Y el mensaje de error contiene "reason"
    Y la orden de "Ana Gómez" queda en estado "RECIBIDO"

  Escenario: Cancelar una orden libera al técnico
    Dado el técnico "Carlos" tiene 3 órdenes activas
    Y una orden de "Ana Gómez" en estado "RECIBIDO"
    Cuando la recepción cancela la orden de "Cliente activo 1" por el motivo "Pedido duplicado"
    Y asigna la orden de "Ana Gómez" al técnico "Carlos"
    Entonces el sistema responde con estado 200
    Y la orden de "Ana Gómez" queda en estado "ASIGNADO"