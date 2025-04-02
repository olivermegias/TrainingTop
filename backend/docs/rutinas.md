PS C:\Users\Usuario\Desktop\TFG\TrainingTop\backend> $bodyJson | Out-File "rutina.json" -Encoding utf8
PS C:\Users\Usuario\Desktop\TFG\TrainingTop\backend> Invoke-WebRequest -Uri "http://localhost:5005/rutinas" -Method Post -Headers @{ "Content-Type" = "application/json" } -InFile "rutina.json"


StatusCode        : 201
StatusDescription : Created
Content           : {"nombre":"Rutina de Ejemplo","descripcion":"Esta es una rutina de ejemplo utilizando IDs en
                    español.","nivel":4,"publica":true,"dias":[{"nombre":"Día 1 -
                    Piernas","ejercicios":[{"ejercicio":"Barbell_...
RawContent        : HTTP/1.1 201 Created
                    Access-Control-Allow-Origin: *
                    Connection: keep-alive
                    Keep-Alive: timeout=5
                    Content-Length: 798
                    Content-Type: application/json; charset=utf-8
                    Date: Mon, 17 Mar 2025 23:27:22...
Forms             : {}
Headers           : {[Access-Control-Allow-Origin, *], [Connection, keep-alive], [Keep-Alive, timeout=5],
                    [Content-Length, 798]...}
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : System.__ComObject
RawContentLength  : 798
 Introducir rutinas por consola tras crear un json con el contenido