# language: es
Característica: Rendimiento de la API
  Como administrador del sistema
  Quiero que los endpoints respondan en menos de 200 ms
  Para garantizar una experiencia fluida en el mostrador

  Escenario: Solicitudes consecutivas responden dentro del límite
    Dado el usuario recepcionista autenticado
    Cuando se registran 20 clientes consecutivos
    Entonces cada respuesta tarda menos de 200 ms
