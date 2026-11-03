# language: es
Característica: Completar reparación
  Como técnico
  Quiero marcar la reparación como terminada
  Para avisar que el equipo está listo

  Escenario: Reparación completada descuenta el stock
    Dado el repuesto "SSD-240" con stock 5 y precio 20000
    Y una orden de "Ana Gómez" en estado "EN_REPARACION" asignada a "Carlos" con 2 unidades del repuesto "SSD-240"
    Cuando el técnico "Carlos" completa la reparación de la orden de "Ana Gómez"
    Entonces el sistema responde con estado 200
    Y la orden de "Ana Gómez" queda en estado "LISTO"
    Y el stock del repuesto "SSD-240" es 3

  Escenario: No se completa si falta stock del repuesto
    Dado el repuesto "SSD-240" con stock 5 y precio 20000
    Y una orden de "Ana Gómez" en estado "EN_REPARACION" asignada a "Carlos" con 2 unidades del repuesto "SSD-240"
    Y el stock del repuesto "SSD-240" baja a 1
    Cuando el técnico "Carlos" completa la reparación de la orden de "Ana Gómez"
    Entonces el sistema responde con estado 409
    Y el mensaje de error contiene "stock"
    Y la orden de "Ana Gómez" queda en estado "EN_REPARACION"
    Y el stock del repuesto "SSD-240" es 1

  Escenario: Solo el técnico asignado puede completar la reparación
    Dado una orden de "Ana Gómez" en estado "EN_REPARACION" asignada a "Carlos"
    Cuando el técnico "Lucía" completa la reparación de la orden de "Ana Gómez"
    Entonces el sistema responde con estado 403
    Y la orden de "Ana Gómez" queda en estado "EN_REPARACION"
