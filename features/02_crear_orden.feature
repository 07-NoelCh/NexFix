# language: es
Característica: Crear orden de reparación
  Como recepcionista
  Quiero abrir una orden de reparación con el equipo y la falla reportada
  Para formalizar la recepción del equipo

  Antecedentes:
    Dado el usuario recepcionista autenticado

  Escenario: Creación exitosa de una orden
    Dado un cliente "Ana Gómez" registrado
    Cuando crea una orden para "Ana Gómez" del equipo "Notebook" marca "Lenovo" modelo "IdeaPad 3" con la falla "No enciende"
    Entonces el sistema responde con estado 201
    Y la orden creada tiene el código "NX-0001"
    Y la respuesta indica el estado "RECIBIDO"

  Escenario: La falla reportada es obligatoria
    Dado un cliente "Ana Gómez" registrado
    Cuando crea una orden para "Ana Gómez" del equipo "Notebook" marca "Lenovo" modelo "IdeaPad 3" con la falla " "
    Entonces el sistema responde con estado 400
    Y el mensaje de error contiene "problem"

  Escenario: El cliente debe existir
    Cuando crea una orden para un cliente inexistente
    Entonces el sistema responde con estado 404
    Y el mensaje de error contiene "cliente"
