$uri = "https://www.tiefgarage-kiel.de/api/anfrage"

$body = @{
    type = "PKW-Stellplatz - 108 € / Monat inkl. MwSt."
    name = "Diagnose-Test"
    email = "test@test.local"
    phone = ""
    start = ""
    message = ""
    company_website = ""
    timestamp = 1725000000000
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Testing /api/anfrage endpoint..."
Write-Host "URL: $uri"
Write-Host "Payload: $body"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $uri `
        -Method Post `
        -Body $body `
        -Headers $headers `
        -ErrorAction SilentlyContinue

    Write-Host "HTTP Status: $($response.StatusCode)"
    Write-Host "Response:"
    ($response.Content | ConvertFrom-Json) | ConvertTo-Json
} catch {
    Write-Host "HTTP Error: $($_.Exception.Message)"
}
