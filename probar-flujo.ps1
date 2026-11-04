$api = "http://localhost:3000/api"
$json = @{ "Content-Type" = "application/json" }

function Login($user, $pass) {
  $body = @{ username = $user; password = $pass } | ConvertTo-Json
  $token = (Invoke-RestMethod "$api/auth/login" -Method Post -Headers $json -Body $body).token
  return @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
}

Write-Host "1. Login del admin"
$hAdmin = Login "admin" "Admin12345"

Write-Host "2. Crear recepcionista y tecnico"
Invoke-RestMethod "$api/staff" -Method Post -Headers $hAdmin -Body '{"username":"recep","fullName":"Recepcion","password":"Recep12345","role":"RECEPCIONISTA"}' | Out-Null
$tec = Invoke-RestMethod "$api/staff" -Method Post -Headers $hAdmin -Body '{"username":"carlos","fullName":"Carlos","password":"Tecnico123","role":"TECNICO"}'
$hRecep = Login "recep" "Recep12345"
$hCarlos = Login "carlos" "Tecnico123"

Write-Host "3. Crear cliente y orden"
$cli = Invoke-RestMethod "$api/customers" -Method Post -Headers $hRecep -Body '{"fullName":"Ana Gomez","documentId":"30111222"}'
$ordenBody = @{ customerId = $cli.id; device = @{ type = "Notebook"; brand = "Lenovo"; model = "IdeaPad 3" }; problem = "No enciende" } | ConvertTo-Json
$orden = Invoke-RestMethod "$api/orders" -Method Post -Headers $hRecep -Body $ordenBody
$id = $orden.id
Write-Host "   Orden creada: $($orden.code) - estado $($orden.status)"

Write-Host "4. Asignar tecnico"
$r = Invoke-RestMethod "$api/orders/$id/assign" -Method Post -Headers $hRecep -Body (@{ technicianId = $tec.id } | ConvertTo-Json)
Write-Host "   Estado: $($r.status)"

Write-Host "5. Diagnostico y presupuesto"
$r = Invoke-RestMethod "$api/orders/$id/diagnosis" -Method Post -Headers $hCarlos -Body '{"diagnosis":"Fuente danada","laborCost":15000,"parts":[]}'
Write-Host "   Estado: $($r.status) - total: $($r.quote.total)"

Write-Host "6. Cliente aprueba el presupuesto"
$r = Invoke-RestMethod "$api/orders/$id/quote-response" -Method Post -Headers $hRecep -Body '{"approved":true}'
Write-Host "   Estado: $($r.status)"

Write-Host "7. Tecnico completa la reparacion"
$r = Invoke-RestMethod "$api/orders/$id/complete" -Method Post -Headers $hCarlos -Body '{}'
Write-Host "   Estado: $($r.status)"

Write-Host "8. Entrega y pago"
$r = Invoke-RestMethod "$api/orders/$id/delivery" -Method Post -Headers $hRecep -Body '{"paymentMethod":"EFECTIVO","amount":15000}'
Write-Host "   Estado: $($r.status)"

Write-Host "9. Consulta publica del cliente"
$t = Invoke-RestMethod "$api/tracking?code=$($orden.code)&documentId=30111222"
Write-Host "   $($t.code): $($t.status) - $($t.history.Count) movimientos"