using namespace System.Drawing
using namespace System.Drawing.Drawing2D
using namespace System.Drawing.Imaging

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$script:Palette = @{
  Canvas       = [ColorTranslator]::FromHtml('#FCF7F0')
  CanvasStrong = [ColorTranslator]::FromHtml('#F3EBDD')
  Primary      = [ColorTranslator]::FromHtml('#235353')
  PrimaryDark  = [ColorTranslator]::FromHtml('#163838')
  Accent       = [ColorTranslator]::FromHtml('#C8925A')
  Ink          = [ColorTranslator]::FromHtml('#1C1C18')
  SoftTeal     = [ColorTranslator]::FromHtml('#E1EFED')
  White        = [Color]::White
}

$script:WordmarkSubtitle = 'M' + [char]0x00FC + 'lk Y' + [char]0x00F6 + 'netim'

function New-Bitmap {
  param([int]$Width, [int]$Height)

  $bitmap = [Bitmap]::new($Width, $Height)
  $bitmap.SetResolution(300, 300)
  return $bitmap
}

function New-Graphics {
  param([Bitmap]$Bitmap)

  $graphics = [Graphics]::FromImage($Bitmap)
  $graphics.SmoothingMode = [SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [CompositingQuality]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return $graphics
}

function New-RoundedPath {
  param(
    [single]$X,
    [single]$Y,
    [single]$Width,
    [single]$Height,
    [single]$Radius
  )

  $path = [GraphicsPath]::new()
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Draw-EvimosMark {
  param(
    [Graphics]$Graphics,
    [RectangleF]$Bounds,
    [bool]$IncludeUnderline = $true
  )

  $housePath = [GraphicsPath]::new()
  $housePoints = [PointF[]]@(
    [PointF]::new($Bounds.X + ($Bounds.Width * 0.50), $Bounds.Y + ($Bounds.Height * 0.08)),
    [PointF]::new($Bounds.X + ($Bounds.Width * 0.86), $Bounds.Y + ($Bounds.Height * 0.34)),
    [PointF]::new($Bounds.X + ($Bounds.Width * 0.86), $Bounds.Y + ($Bounds.Height * 0.82)),
    [PointF]::new($Bounds.X + ($Bounds.Width * 0.14), $Bounds.Y + ($Bounds.Height * 0.82)),
    [PointF]::new($Bounds.X + ($Bounds.Width * 0.14), $Bounds.Y + ($Bounds.Height * 0.34))
  )
  $housePath.AddPolygon($housePoints)

  $primaryBrush = [SolidBrush]::new($script:Palette.Primary)
  $outlinePen = [Pen]::new($script:Palette.PrimaryDark, [Math]::Max($Bounds.Width * 0.028, 6))
  $outlinePen.LineJoin = [LineJoin]::Round

  $Graphics.FillPath($primaryBrush, $housePath)
  $Graphics.DrawPath($outlinePen, $housePath)

  $accentBrush = [SolidBrush]::new($script:Palette.Accent)
  $dotSize = $Bounds.Width * 0.14
  $Graphics.FillEllipse(
    $accentBrush,
    $Bounds.X + ($Bounds.Width * 0.63),
    $Bounds.Y + ($Bounds.Height * 0.17),
    $dotSize,
    $dotSize
  )

  if ($IncludeUnderline) {
    $underlinePath = New-RoundedPath `
      ($Bounds.X + ($Bounds.Width * 0.22)) `
      ($Bounds.Y + ($Bounds.Height * 0.94)) `
      ($Bounds.Width * 0.56) `
      ($Bounds.Height * 0.06) `
      ($Bounds.Height * 0.03)
    $Graphics.FillPath($accentBrush, $underlinePath)
    $underlinePath.Dispose()
  }

  $accentBrush.Dispose()
  $outlinePen.Dispose()
  $primaryBrush.Dispose()
  $housePath.Dispose()
}

function Save-Png {
  param(
    [Bitmap]$Bitmap,
    [string]$Path
  )

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $Bitmap.Save($Path, [ImageFormat]::Png)
}

function New-IconAsset {
  param(
    [int]$Size,
    [string]$Path
  )

  $bitmap = New-Bitmap -Width $Size -Height $Size
  $graphics = New-Graphics -Bitmap $bitmap
  $graphics.Clear($script:Palette.Canvas)

  $platePath = New-RoundedPath ($Size * 0.08) ($Size * 0.08) ($Size * 0.84) ($Size * 0.84) ($Size * 0.24)
  $plateBrush = [SolidBrush]::new($script:Palette.CanvasStrong)
  $graphics.FillPath($plateBrush, $platePath)

  $shadowBrush = [SolidBrush]::new([Color]::FromArgb(24, 22, 56, 56))
  $graphics.FillEllipse($shadowBrush, $Size * 0.20, $Size * 0.76, $Size * 0.60, $Size * 0.06)

  Draw-EvimosMark `
    -Graphics $graphics `
    -Bounds ([RectangleF]::new($Size * 0.20, $Size * 0.18, $Size * 0.60, $Size * 0.60)) `
    -IncludeUnderline $false

  $underlinePath = New-RoundedPath ($Size * 0.30) ($Size * 0.80) ($Size * 0.40) ($Size * 0.045) ($Size * 0.023)
  $underlineBrush = [SolidBrush]::new($script:Palette.Accent)
  $graphics.FillPath($underlineBrush, $underlinePath)

  Save-Png -Bitmap $bitmap -Path $Path

  $underlineBrush.Dispose()
  $underlinePath.Dispose()
  $shadowBrush.Dispose()
  $plateBrush.Dispose()
  $platePath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function New-AdaptiveForeground {
  param(
    [int]$Size,
    [string]$Path
  )

  # Android adaptive icon: safe zone is inner 66%; keep mark smaller.
  $bitmap = New-Bitmap -Width $Size -Height $Size
  $graphics = New-Graphics -Bitmap $bitmap
  $graphics.Clear([Color]::Transparent)

  Draw-EvimosMark `
    -Graphics $graphics `
    -Bounds ([RectangleF]::new($Size * 0.22, $Size * 0.20, $Size * 0.56, $Size * 0.56)) `
    -IncludeUnderline $false

  $underlinePath = New-RoundedPath ($Size * 0.32) ($Size * 0.78) ($Size * 0.36) ($Size * 0.042) ($Size * 0.021)
  $underlineBrush = [SolidBrush]::new($script:Palette.Accent)
  $graphics.FillPath($underlineBrush, $underlinePath)

  Save-Png -Bitmap $bitmap -Path $Path

  $underlineBrush.Dispose()
  $underlinePath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function New-SplashAsset {
  param(
    [int]$Size,
    [string]$Path
  )

  $bitmap = New-Bitmap -Width $Size -Height $Size
  $graphics = New-Graphics -Bitmap $bitmap
  $graphics.Clear([Color]::Transparent)

  Draw-EvimosMark `
    -Graphics $graphics `
    -Bounds ([RectangleF]::new($Size * 0.18, $Size * 0.14, $Size * 0.64, $Size * 0.64)) `
    -IncludeUnderline $false

  $underlinePath = New-RoundedPath ($Size * 0.28) ($Size * 0.82) ($Size * 0.44) ($Size * 0.05) ($Size * 0.025)
  $underlineBrush = [SolidBrush]::new($script:Palette.Accent)
  $graphics.FillPath($underlineBrush, $underlinePath)

  Save-Png -Bitmap $bitmap -Path $Path

  $underlineBrush.Dispose()
  $underlinePath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function New-MarkAsset {
  param(
    [int]$Size,
    [string]$Path
  )

  $bitmap = New-Bitmap -Width $Size -Height $Size
  $graphics = New-Graphics -Bitmap $bitmap
  $graphics.Clear([Color]::Transparent)

  Draw-EvimosMark `
    -Graphics $graphics `
    -Bounds ([RectangleF]::new($Size * 0.14, $Size * 0.10, $Size * 0.72, $Size * 0.72)) `
    -IncludeUnderline $false

  $underlinePath = New-RoundedPath ($Size * 0.24) ($Size * 0.86) ($Size * 0.52) ($Size * 0.05) ($Size * 0.025)
  $underlineBrush = [SolidBrush]::new($script:Palette.Accent)
  $graphics.FillPath($underlineBrush, $underlinePath)

  Save-Png -Bitmap $bitmap -Path $Path

  $underlineBrush.Dispose()
  $underlinePath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function New-WordmarkAsset {
  param(
    [int]$Width,
    [int]$Height,
    [string]$Path
  )

  $bitmap = New-Bitmap -Width $Width -Height $Height
  $graphics = New-Graphics -Bitmap $bitmap
  $graphics.Clear([Color]::Transparent)

  $markSize = $Height * 0.78
  Draw-EvimosMark `
    -Graphics $graphics `
    -Bounds ([RectangleF]::new($Height * 0.08, $Height * 0.11, $markSize, $markSize)) `
    -IncludeUnderline $false

  $markUnderlinePath = New-RoundedPath `
    ($Height * 0.18) `
    ($Height * 0.92) `
    ($markSize * 0.72) `
    ($Height * 0.05) `
    ($Height * 0.025)
  $markUnderlineBrush = [SolidBrush]::new($script:Palette.Accent)
  $graphics.FillPath($markUnderlineBrush, $markUnderlinePath)

  $nameFont = [Font]::new('Segoe UI Semibold', $Height * 0.34, [FontStyle]::Bold, [GraphicsUnit]::Pixel)
  $subFont = [Font]::new('Segoe UI Semibold', $Height * 0.13, [FontStyle]::Regular, [GraphicsUnit]::Pixel)
  $nameBrush = [SolidBrush]::new($script:Palette.Primary)
  $subBrush = [SolidBrush]::new($script:Palette.Ink)

  $textX = $Height * 1.02
  $graphics.DrawString('Evimos', $nameFont, $nameBrush, [PointF]::new($textX, $Height * 0.10))

  $pillPath = New-RoundedPath $textX ($Height * 0.60) ($Height * 1.12) ($Height * 0.22) ($Height * 0.11)
  $pillBrush = [SolidBrush]::new($script:Palette.SoftTeal)
  $graphics.FillPath($pillBrush, $pillPath)
  $graphics.DrawString($script:WordmarkSubtitle, $subFont, $subBrush, [PointF]::new($textX + ($Height * 0.10), $Height * 0.625))

  Save-Png -Bitmap $bitmap -Path $Path

  $pillBrush.Dispose()
  $pillPath.Dispose()
  $nameBrush.Dispose()
  $subBrush.Dispose()
  $nameFont.Dispose()
  $subFont.Dispose()
  $markUnderlineBrush.Dispose()
  $markUnderlinePath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function New-AppImage {
  param(
    [int]$Width,
    [int]$Height,
    [string]$Path
  )

  $bitmap = New-Bitmap -Width $Width -Height $Height
  $graphics = New-Graphics -Bitmap $bitmap
  $graphics.Clear($script:Palette.Canvas)

  $panelPath = New-RoundedPath ($Width * 0.07) ($Height * 0.13) ($Width * 0.86) ($Height * 0.74) ($Height * 0.12)
  $panelBrush = [SolidBrush]::new($script:Palette.CanvasStrong)
  $graphics.FillPath($panelBrush, $panelPath)

  Draw-EvimosMark `
    -Graphics $graphics `
    -Bounds ([RectangleF]::new($Width * 0.12, $Height * 0.22, $Height * 0.46, $Height * 0.46)) `
    -IncludeUnderline $false

  $eyebrowFont = [Font]::new('Segoe UI Semibold', $Height * 0.048, [FontStyle]::Regular, [GraphicsUnit]::Pixel)
  $titleFont = [Font]::new('Segoe UI Semibold', $Height * 0.080, [FontStyle]::Bold, [GraphicsUnit]::Pixel)
  $bodyFont = [Font]::new('Segoe UI', $Height * 0.042, [FontStyle]::Regular, [GraphicsUnit]::Pixel)
  $eyebrowBrush = [SolidBrush]::new($script:Palette.Accent)
  $titleBrush = [SolidBrush]::new($script:Palette.Primary)
  $bodyBrush = [SolidBrush]::new($script:Palette.Ink)

  $heroLineOne = 'Evimos - M' + [char]0x00FC + 'lk Y' + [char]0x00F6 + 'netim'
  $heroLineTwo = 'Kira, bak' + [char]0x0131 + 'm ve belge ak' + [char]0x0131 + 's' + [char]0x0131 + ' tek merkezde.'
  $heroLineThree = 'Ofis ekibi, ev sahibi ve kirac' + [char]0x0131 + ' i' + [char]0x00E7 + 'in sakin bir operasyon y' + [char]0x00FC + 'zeyi.'

  $textX = $Width * 0.44
  $graphics.DrawString($heroLineOne, $eyebrowFont, $eyebrowBrush, [PointF]::new($textX, $Height * 0.23))
  $graphics.DrawString($heroLineTwo, $titleFont, $titleBrush, [RectangleF]::new($textX, $Height * 0.32, $Width * 0.42, $Height * 0.24))
  $graphics.DrawString($heroLineThree, $bodyFont, $bodyBrush, [RectangleF]::new($textX, $Height * 0.60, $Width * 0.42, $Height * 0.20))

  Save-Png -Bitmap $bitmap -Path $Path

  $bodyBrush.Dispose()
  $titleBrush.Dispose()
  $eyebrowBrush.Dispose()
  $bodyFont.Dispose()
  $titleFont.Dispose()
  $eyebrowFont.Dispose()
  $panelBrush.Dispose()
  $panelPath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$imageDir = Join-Path $root 'assets\images'

New-IconAsset -Size 1024 -Path (Join-Path $imageDir 'icon.png')
New-AdaptiveForeground -Size 1024 -Path (Join-Path $imageDir 'adaptive-icon.png')
New-IconAsset -Size 256 -Path (Join-Path $imageDir 'favicon.png')
New-SplashAsset -Size 768 -Path (Join-Path $imageDir 'splash-image.png')
New-MarkAsset -Size 1024 -Path (Join-Path $imageDir 'evimos-mark.png')
New-WordmarkAsset -Width 1400 -Height 420 -Path (Join-Path $imageDir 'logo.png')
New-AppImage -Width 1200 -Height 630 -Path (Join-Path $imageDir 'app-image.png')

Write-Output "Generated Evimos brand assets in $imageDir"
