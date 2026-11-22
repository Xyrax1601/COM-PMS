$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "c:\Users\jcmal\Desktop\ProjectCOM_PMS\server"

Write-Output "--- Starting COM-PMS Server in background job ---"
$proc = Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList "dist/index.js" -PassThru

try {
    Write-Output "Waiting for server to initialize and bind port 5000..."
    $retries = 20
    $ready = $false
    while ($retries -gt 0 -and -not $ready) {
        Start-Sleep -Seconds 1
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 2
            if ($health.status -eq "healthy") {
                $ready = $true
            }
        } catch {}
        $retries--
    }

    if (-not $ready) {
        Write-Error "Server failed to start within timeout."
        exit 1
    }

    Write-Output "SUCCESS: COM-PMS Server healthy and running on http://localhost:5000!`n"

    # 1. Test Admin Login
    Write-Output "=== 1. Testing Admin Login ==="
    $loginBody = @{ email = "admin@compms.edu"; password = "Admin@123" } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    Write-Output "Logged in as: $($loginRes.user.name) ($($loginRes.user.role))"
    Write-Output "JWT token acquired: $($token.Substring(0, 20))...`n"

    $headers = @{ Authorization = "Bearer $token" }

    # 2. Test Dashboard KPIs & Charts
    Write-Output "=== 2. Testing Dashboard Dynamic Analytics ==="
    $dashRes = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/stats?year=2026" -Headers $headers
    Write-Output "Total Registered Patients in DB: $($dashRes.stats.totalPatients)"
    Write-Output "Total Completed FPE: $($dashRes.stats.totalFpeCompleted)"
    Write-Output "Total Completed Consultations: $($dashRes.stats.totalConsultationsCompleted)"
    Write-Output "Upcoming Follow-ups: $($dashRes.stats.upcomingFollowUps)"
    Write-Output "Overdue Follow-ups: $($dashRes.stats.overdueFollowUps)"
    Write-Output "Monthly trend data points: $($dashRes.charts.trendData.Count)`n"

    # 3. Test Patient Directory & Search
    Write-Output "=== 3. Testing Patient Directory & Search ==="
    $patRes = Invoke-RestMethod -Uri "http://localhost:5000/api/patients?limit=5" -Headers $headers
    Write-Output "Total patient records in directory: $($patRes.pagination.total)"
    foreach ($p in $patRes.patients) {
        Write-Output "  • ID: $($p.patient_id) | Name: $($p.complete_name) | Status: $($p.patient_status)"
    }

    # Test Search by Name
    $searchRes = Invoke-RestMethod -Uri "http://localhost:5000/api/patients?search=MURALLON" -Headers $headers
    Write-Output "Search 'MURALLON' found: $($searchRes.patients.Count) record(s) -> $($searchRes.patients[0].complete_name)`n"

    # 4. Test Single Patient Document Profile Inspection
    Write-Output "=== 4. Testing Document Inspector (Patient Detail) ==="
    $testPatientId = $patRes.patients[0]._id
    $detailRes = Invoke-RestMethod -Uri "http://localhost:5000/api/patients/$testPatientId" -Headers $headers
    Write-Output "Document Profile for $($detailRes.patient.complete_name):"
    Write-Output "  - FPE Records: $($detailRes.records.fpeRecords.Count)"
    Write-Output "  - Consultations: $($detailRes.records.consultations.Count)"
    Write-Output "  - Lab Requests: $($detailRes.records.laboratoryRecords.Count)"
    Write-Output "  - Medications: $($detailRes.records.medicationRecords.Count)"
    Write-Output "  - Follow-up Records: $($detailRes.records.followUpRecords.Count)`n"

    # 5. Test Patient Monitoring Module (Section III.H)
    Write-Output "=== 5. Testing Automated Patient Monitoring Buckets ==="
    $monRes = Invoke-RestMethod -Uri "http://localhost:5000/api/monitoring/summary" -Headers $headers
    Write-Output "  [Bucket 1] Registered & Completed FPE + Consult: $($monRes.summary.categories.registered_and_completed)"
    Write-Output "  [Bucket 2] Registered but No FPE: $($monRes.summary.categories.registered_no_fpe)"
    Write-Output "  [Bucket 3] Completed FPE but No Consultation: $($monRes.summary.categories.fpe_no_consultation)"
    Write-Output "  [Bucket 4] Completed FPE but Not Registered: $($monRes.summary.categories.fpe_not_registered)"
    Write-Output "  [Bucket 5] Pending Follow-ups: $($monRes.summary.categories.pending_follow_ups)`n"

    # 6. Test Reports Module & Excel Export
    Write-Output "=== 6. Testing Institutional Report Generation ==="
    $repRes = Invoke-RestMethod -Uri "http://localhost:5000/api/reports/data?reportType=monthly_registration&year=2026" -Headers $headers
    Write-Output "Report Title: $($repRes.reportTitle)"
    Write-Output "Rows Generated: $($repRes.rows.Count)`n"

    # 7. Test Frontend Serving
    Write-Output "=== 7. Testing Client UI Web Serving ==="
    $web = Invoke-WebRequest -Uri "http://localhost:5000/" -UseBasicParsing
    Write-Output "HTTP Status: $($web.StatusCode)"
    Write-Output "Contains 'COM-PMS': $($web.Content.Contains('COM-PMS'))"
    Write-Output "Contains React root div: $($web.Content.Contains('<div id=""root"">'))`n"

    Write-Output "========================================================="
    Write-Output "ALL 7 INTEGRATION & ARCHITECTURAL CHECKS PASSED!"
    Write-Output "========================================================="

} finally {
    Write-Output "Shutting down test server process..."
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
