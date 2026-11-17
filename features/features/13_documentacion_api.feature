# language: es
Característica: Documentación interactiva de la API
  Como desarrollador que consume la API
  Quiero una documentación OpenAPI con Swagger UI
  Para conocer y probar los endpoints sin herramientas externas

  Antecedentes:
    Dado un usuario sin autenticar

  Escenario: La especificación OpenAPI describe los endpoints principales
    Cuando se solicita la especificación OpenAPI
    Entonces el sistema responde con estado 200
    Y la especificación describe el endpoint "POST" "/auth/login"
    Y la especificación describe el endpoint "POST" "/orders/{id}/assign"
    Y la especificación describe el endpoint "POST" "/orders/{id}/cancel"
    Y la especificación describe el endpoint "GET" "/tracking"
    Y la especificación define la autenticación "bearerAuth"

  Escenario: La interfaz de Swagger UI está disponible
    Cuando se abre la página de documentación
    Entonces el sistema responde con estado 200
    Y la respuesta es una página HTML de Swagger UI