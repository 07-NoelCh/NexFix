# language: es
Característica: Consultar estado de la reparación
  Como cliente
  Quiero consultar el estado de mi equipo con mi código y documento
  Para saber cuándo retirarlo sin llamar al taller

  Escenario: Consulta exitosa con código y documento
    Dado un cliente "Ana Gómez" con documento "30111222" ya registrado
    Y una orden de "Ana Gómez" en estado "EN_REPARACION" asignada a "Carlos"
    Cuando el cliente "Ana Gómez" consulta el estado de su orden con su documento
    Entonces el sistema responde con estado 200
    Y la respuesta de seguimiento muestra el estado "EN_REPARACION" y un historial de 4 movimientos
    Y la respuesta de seguimiento no expone datos internos

  Escenario: Un documento que no corresponde no revela la orden
    Dado un cliente "Ana Gómez" con documento "30111222" ya registrado
    Y una orden de "Ana Gómez" en estado "LISTO" asignada a "Carlos"
    Cuando consulta el estado de la orden de "Ana Gómez" con el documento "99999999"
    Entonces el sistema responde con estado 404
