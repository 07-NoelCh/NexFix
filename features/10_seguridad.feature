# language: es
Característica: Seguridad de credenciales y acceso
  Como auditor de seguridad
  Quiero que las contraseñas se guarden con bcrypt y que los endpoints exijan autenticación y rol
  Para proteger los datos ante una brecha o uso indebido

  Escenario: La contraseña se almacena con hash bcrypt
    Dado el usuario administrador autenticado
    Cuando se crea el usuario "marta" con contraseña "Secreta123" y rol "RECEPCIONISTA"
    Entonces el sistema responde con estado 201
    Y la contraseña guardada de "marta" no es "Secreta123" y tiene formato bcrypt
    Y el usuario "marta" puede iniciar sesión con la contraseña "Secreta123"

  Escenario: Se rechazan contraseñas débiles
    Dado el usuario administrador autenticado
    Cuando se crea el usuario "marta" con contraseña "corta" y rol "RECEPCIONISTA"
    Entonces el sistema responde con estado 400
    Y el mensaje de error contiene "contraseña"

  Escenario: Sin autenticación no se accede a los endpoints protegidos
    Dado un usuario sin autenticar
    Cuando registra al cliente "Ana Gómez" con documento "30111222"
    Entonces el sistema responde con estado 401

  Escenario: Un rol no autorizado no puede ejecutar la acción
    Dado el usuario técnico "Carlos" autenticado
    Cuando registra al cliente "Ana Gómez" con documento "30111222"
    Entonces el sistema responde con estado 403
