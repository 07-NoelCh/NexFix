# language: es
Característica: Diagnóstico y presupuesto
  Como técnico
  Quiero registrar el diagnóstico, la mano de obra y los repuestos necesarios
  Para que el cliente reciba un presupuesto

  Escenario: Diagnóstico exitoso con repuestos
    Dado el repuesto "SSD-240" con stock 5 y precio 20000
    Y una orden de "Ana Gómez" en estado "ASIGNADO" asignada a "Carlos"
    Cuando el técnico "Carlos" diagnostica la orden de "Ana Gómez" con diagnóstico "Disco dañado", mano de obra 15000 y 1 unidad del repuesto "SSD-240"
    Entonces el sistema responde con estado 200
    Y la orden de "Ana Gómez" queda en estado "PRESUPUESTADO"
    Y el total del presupuesto de la orden de "Ana Gómez" es 35000 pesos

  Escenario: Solo el técnico asignado puede diagnosticar
    Dado una orden de "Ana Gómez" en estado "ASIGNADO" asignada a "Carlos"
    Cuando el técnico "Lucía" diagnostica la orden de "Ana Gómez" con diagnóstico "Placa dañada" y mano de obra 8000
    Entonces el sistema responde con estado 403
    Y la orden de "Ana Gómez" queda en estado "ASIGNADO"

  Escenario: La mano de obra no puede ser negativa
    Dado una orden de "Ana Gómez" en estado "ASIGNADO" asignada a "Carlos"
    Cuando el técnico "Carlos" diagnostica la orden de "Ana Gómez" con diagnóstico "Placa dañada" y mano de obra -100
    Entonces el sistema responde con estado 400
    Y el mensaje de error contiene "laborCost"
