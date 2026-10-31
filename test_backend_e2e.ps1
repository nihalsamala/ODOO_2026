$ErrorActionPreference = "Stop"

# 1. Login Admin
Write-Host "=== 1. Login Admin ==="
$loginBody = @{
    email = "admin@subscriptiq.com"
    password = "Admin@123"
} | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginRes.token
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}
Write-Host "Admin Logged In. Token length: $($token.Length)"

# 2. Create Product
Write-Host "`n=== 2. Create Product ==="
$prodBody = @{
    name = "Cloud Hosting Enterprise"
    type = "SERVICE"
    salesPrice = 120.00
    costPrice = 45.00
    notes = "Dedicated virtual instance"
    active = $true
    variants = @(
        @{
            name = "Extra 32GB RAM"
            priceAdjustment = 30.00
            active = $true
        }
    )
} | ConvertTo-Json
$prodRes = Invoke-RestMethod -Uri "http://localhost:8080/api/products" -Method Post -Headers $headers -Body $prodBody
$productId = $prodRes.id
$variantId = $prodRes.variants[0].id
Write-Host "Product Created: ID $productId, Variant ID $variantId, Name: $($prodRes.name)"

# 3. Create Plan
Write-Host "`n=== 3. Create Plan ==="
$planBody = @{
    name = "Monthly Pro"
    price = 15.00
    billingInterval = "MONTHLY"
    minimumQuantity = 1
    availabilityStartDate = "2026-01-01"
    availabilityEndDate = $null
    lifecycleRule = "AUTO_RENEW"
    active = $true
} | ConvertTo-Json
$planRes = Invoke-RestMethod -Uri "http://localhost:8080/api/plans" -Method Post -Headers $headers -Body $planBody
$planId = $planRes.id
Write-Host "Plan Created: ID $planId, Name: $($planRes.name), Interval: $($planRes.billingInterval)"

# 4. Link Product & Plan
Write-Host "`n=== 4. Link Product & Plan Compatibility ==="
$linkBody = @{
    productId = $productId
    planId = $planId
    active = $true
} | ConvertTo-Json
$linkRes = Invoke-RestMethod -Uri "http://localhost:8080/api/product-plans" -Method Post -Headers $headers -Body $linkBody
Write-Host "Product-Plan Linked: Mapping ID $($linkRes.id)"

# 5. Create Customer
Write-Host "`n=== 5. Create Customer ==="
$custBody = @{
    name = "Acme Innovations"
    email = "contact@acme.com"
    phone = "+1-800-555-0199"
    address = "742 Evergreen Terrace"
} | ConvertTo-Json
$custRes = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method Post -Headers $headers -Body $custBody
$customerId = $custRes.id
Write-Host "Customer Created: ID $customerId, Name: $($custRes.name)"

# 6. Create Subscription
Write-Host "`n=== 6. Create Subscription ==="
$today = (Get-Date).ToString("yyyy-MM-dd")
$subBody = @{
    customerId = $customerId
    productId = $productId
    planId = $planId
    variantId = $variantId
    quantity = 2
    startDate = $today
    expiryDate = "2027-11-01"
    agreedUnitPrice = $null
    initialStatus = "ACTIVE"
} | ConvertTo-Json
$subRes = Invoke-RestMethod -Uri "http://localhost:8080/api/subscriptions" -Method Post -Headers $headers -Body $subBody
$subId = $subRes.id
Write-Host "Subscription Created: ID $subId, Number: $($subRes.subscriptionNumber), Subtotal: $($subRes.subtotal), Status: $($subRes.status)"

# 7. Generate Invoice
Write-Host "`n=== 7. Generate Invoice ==="
$invRes = Invoke-RestMethod -Uri "http://localhost:8080/api/invoices/generate?subscriptionId=$subId" -Method Post -Headers $headers
$invoiceId = $invRes.id
Write-Host "Invoice Generated: ID $invoiceId, Number: $($invRes.invoiceNumber), Total: $($invRes.total), Status: $($invRes.status)"

# 8. Record Payment
Write-Host "`n=== 8. Record Payment ==="
$payBody = @{
    invoiceId = $invoiceId
    amount = [decimal]100.00
    paymentMethod = "CREDIT_CARD"
    paymentDate = $today
    note = "Partial payment test"
} | ConvertTo-Json
$payRes = Invoke-RestMethod -Uri "http://localhost:8080/api/payments" -Method Post -Headers $headers -Body $payBody
Write-Host "Payment Recorded: ID $($payRes.id), Paid: $($payRes.amount), Invoice Status: $($payRes.invoiceStatus), Remaining: $($payRes.remainingOutstandingBalance)"

# 9. Dashboard Summary
Write-Host "`n=== 9. Dashboard Summary ==="
$dashRes = Invoke-RestMethod -Uri "http://localhost:8080/api/dashboard/summary" -Method Get -Headers $headers
Write-Host "Dashboard Summary: ActiveSubs=$($dashRes.activeSubscriptions), RevReceived=$($dashRes.revenueReceived), AmountOwed=$($dashRes.amountOwed), Invoices=$($dashRes.totalInvoices)"

Write-Host "`n=== WORKFLOW VERIFICATION COMPLETE: ALL STEPS SUCCEEDED ==="
