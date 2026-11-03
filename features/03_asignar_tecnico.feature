# language: es
Característica: Asignar técnico
  Como recepcionista
  Quiero asignar una orden a un técnico
  Para que se encargue del diagnóstico

  Antecedentes:
    Dado el usuario recepcionista autenticado

  Escenario: Asignación exitosa
    Dado una orden de "Ana Gómez" en estado "RECIBIDO"
    Cuando asigna la orden de "Ana Gómez" al técnico "Carlos"
    Entonces el sistema responde con estado 200
    Y la orden de "Ana Gómez" queda en estado "ASIGNADO"
    Y la orden de "Ana Gómez" tiene asignado al técnico "Carlos"

  Escenario: Un técnico no puede superar el límite de órdenes activas
    Dado el técnico "Carlos" tiene 3 órdenes activas
    Y una orden de "Ana Gómez" en estado "RECIBIDO"
    Cuando asigna la orden de "Ana Gómez" al técnico "Carlos"
    Entonces el sistema responde con estado 409
    Y el mensaje de error contiene "límite"
    Y la orden de "Ana Gómez" queda en estado "RECIBIDO"

  Escenario: Solo se puede asignar a usuarios con rol técnico
    Dado una orden de "Ana Gómez" en estado "RECIBIDO"
    Cuando asigna la orden de "Ana Gómez" a un usuario que no es técnico
    Entonces el sistema responde con estado 400
    Y el mensaje de error contiene "técnico"
