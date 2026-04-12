$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $root "lib\\excel-db.generated.js"

function Read-SheetRows {
  param(
    [Parameter(Mandatory = $true)]
    $Worksheet
  )

  $used = $Worksheet.UsedRange
  $rowCount = $used.Rows.Count
  $colCount = $used.Columns.Count
  $headers = @()

  for ($col = 1; $col -le $colCount; $col++) {
    $headers += [string]($used.Item(1, $col).Text).Trim()
  }

  $rows = @()

  for ($row = 2; $row -le $rowCount; $row++) {
    $item = [ordered]@{}
    $hasValue = $false

    for ($col = 1; $col -le $colCount; $col++) {
      $header = $headers[$col - 1]

      if (-not $header) {
        continue
      }

      $value = [string]($used.Item($row, $col).Text)

      if ($value.Trim()) {
        $hasValue = $true
      }

      $item[$header] = $value.Trim()
    }

    if ($hasValue) {
      $rows += [pscustomobject]$item
    }
  }

  return $rows
}

function Convert-ProductionType {
  param(
    [string]$Value
  )

  $normalized = ""

  if ($null -ne $Value) {
    $normalized = $Value.ToLowerInvariant()
  }

  if ($normalized -match "rayon") {
    return "Rayon"
  }

  if ($normalized -match "kaos") {
    return "Kaos"
  }

  return "Kaos"
}

$excel = $null

try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false

  $skuWorkbook = $excel.Workbooks.Open((Join-Path $root "db_sku.xlsx"), $null, $true)
  $skuSourceRows = Read-SheetRows -Worksheet $skuWorkbook.Worksheets.Item(1)
  $skuWorkbook.Close($false)

  $kodePolaWorkbook = $excel.Workbooks.Open((Join-Path $root "db_kode pola.xlsx"), $null, $true)
  $kodePolaRows = Read-SheetRows -Worksheet $kodePolaWorkbook.Worksheets.Item(1) | ForEach-Object {
    [ordered]@{
      model = $_.MODEL
      kodePola = $_."kode pola"
    }
  }
  $kodePolaWorkbook.Close($false)

  $jenisKainWorkbook = $excel.Workbooks.Open((Join-Path $root "db_jenis kain.xlsx"), $null, $true)
  $jenisKainRows = Read-SheetRows -Worksheet $jenisKainWorkbook.Worksheets.Item(1) | ForEach-Object {
    [ordered]@{
      model = $_.MODEL
      jenisKain = $_."Jenis kain"
    }
  }
  $jenisKainWorkbook.Close($false)

  $cuttingWorkbook = $excel.Workbooks.Open((Join-Path $root "db_op cutting.xlsx"), $null, $true)
  $cuttingOperators = (Read-SheetRows -Worksheet $cuttingWorkbook.Worksheets.Item(1))."Nama Operator"
  $cuttingWorkbook.Close($false)

  $rackWorkbook = $excel.Workbooks.Open((Join-Path $root "db_op racking.xlsx"), $null, $true)
  $rackOperators = (Read-SheetRows -Worksheet $rackWorkbook.Worksheets.Item(1))."Nama Operator"
  $rackWorkbook.Close($false)

  $seriWorkbook = $excel.Workbooks.Open((Join-Path $root "db_op seri.xlsx"), $null, $true)
  $seriOperators = (Read-SheetRows -Worksheet $seriWorkbook.Worksheets.Item(1))."Nama Operator"
  $seriWorkbook.Close($false)

  $sewingWorkbook = $excel.Workbooks.Open((Join-Path $root "db_op sewing.xlsx"), $null, $true)
  $sewingOperators = (Read-SheetRows -Worksheet $sewingWorkbook.Worksheets.Item(1))."Nama Operator"
  $sewingWorkbook.Close($false)

  $skuRows = $skuSourceRows | ForEach-Object {
    $jenisProduksi = $_."Ket. Rayon & Kaos"

    [ordered]@{
      sku = $_."KODE SKU"
      produk = $_."NAMA PRODUK"
      model = $_.MODEL
      size = $_.SIZE
      colour = $_.COLOUR
      ketSize = $_."Ket. Size"
      modelSize = $_."MODEL-SIZE"
      ketDistModel = $_."Ket. Dist Model"
      jenisProduksi = $jenisProduksi
      ketDistSku = $_."Ket. Dist SKU"
      type = Convert-ProductionType -Value $jenisProduksi
      qtyPlan = 0
      qtyCutting = 0
      qtyRacking = 0
      qtyPlanSewing = 0
      qtyIkat = 0
    }
  }

  $sections = @(
    @{ Name = "skuRows"; Value = $skuRows },
    @{ Name = "kodePolaRows"; Value = $kodePolaRows },
    @{ Name = "jenisKainRows"; Value = $jenisKainRows },
    @{ Name = "cuttingOperators"; Value = $cuttingOperators },
    @{ Name = "rackOperators"; Value = $rackOperators },
    @{ Name = "seriOperators"; Value = $seriOperators },
    @{ Name = "sewingOperators"; Value = $sewingOperators }
  )

  $lines = @(
    "// Generated from local Excel database files.",
    "// Run: powershell -ExecutionPolicy Bypass -File .\\scripts\\export-excel-db.ps1",
    ""
  )

  foreach ($section in $sections) {
    $json = $section.Value | ConvertTo-Json -Depth 8
    $lines += "export const $($section.Name) = $json;"
    $lines += ""
  }

  Set-Content -Path $outputPath -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
  Write-Output "Generated: $outputPath"
}
finally {
  if ($excel) {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
  }

  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
