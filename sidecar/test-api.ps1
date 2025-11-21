$testCode = "import React from 'react';
import { useState } from 'react';
const express = require('express');"

$body = @{
    code = $testCode
    language = "javascript"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3002/parse" -Method Post -Body $body -ContentType "application/json"

Write-Host "===== API TEST RESULT =====" -ForegroundColor Cyan
Write-Host "Functions found: $($response.functions.Count)" -ForegroundColor Yellow
Write-Host "Imports found: $($response.imports.Count)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Imports:" -ForegroundColor Green
$i = 1
foreach ($imp in $response.imports) {
    Write-Host "  $i. $($imp.module)"
    $i++
}

if ($response.imports.Count -eq 3) {
    Write-Host ""
    Write-Host "SUCCESS! Import extraction is working correctly." -ForegroundColor Green
    Write-Host "  Expected: 3 imports" -ForegroundColor Gray
    Write-Host "  Got: $($response.imports.Count) imports" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "FAILED! Import count mismatch." -ForegroundColor Red
    Write-Host "  Expected: 3, Got: $($response.imports.Count)" -ForegroundColor Gray
}
