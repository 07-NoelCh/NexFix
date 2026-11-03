# language: es
Característica: Listar órdenes de reparación
  Como recepcionista
  Quiero listar las órdenes filtrando por estado
  Para saber qué trabajo hay pendiente en el taller

  Escenario: Filtrar órdenes por estado
    Dado el usuario recepcionista autenticado
    Y una orden de "Ana Gómez" en estado "RECIBIDO"
    Y una orden de "Beto Ruiz" en estado "ASIGNADO" asignada a "Carlos"
    Cuando consulta el listado de órdenes con estado "ASIGNADO"
    Entonces el sistema responde con estado 200
    Y el listado contiene 1 orden

  Escenario: Un técnico solo ve sus propias órdenes
    Dado una orden de "Ana Gómez" en estado "ASIGNADO" asignada a "Carlos"
    Y una orden de "Beto Ruiz" en estado "ASIGNADO" asignada a "Lucía"
    Cuando el técnico "Carlos" consulta el listado de órdenes
    Entonces el sistema responde con estado 200
    Y el listado contiene 1 orden

  Escenario: Un estado inválido se rechaza
    Dado el usuario recepcionista autenticado
    Cuando consulta el listado de órdenes con estado "VOLANDO"
    Entonces el sistema responde con estado 400
    Y el mensaje de error contiene "status"
