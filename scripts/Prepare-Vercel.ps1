$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$publish = Join-Path $projectRoot 'artifacts/publish'
$source = Join-Path $publish 'wwwroot'
$output = Join-Path $projectRoot '.vercel/output'

if (Test-Path -LiteralPath $publish) {
    $resolvedPublish = (Resolve-Path -LiteralPath $publish).Path
    if (-not $resolvedPublish.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing to clean publish output outside the project.'
    }
    Remove-Item -LiteralPath $resolvedPublish -Recurse -Force
}
dotnet publish (Join-Path $projectRoot 'BlazorWasm.KyarKwat') -c Release -o $publish
if ($LASTEXITCODE -ne 0) { throw 'The Blazor publish failed.' }

if (Test-Path -LiteralPath $output) {
    $resolvedOutput = (Resolve-Path -LiteralPath $output).Path
    if (-not $resolvedOutput.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing to replace output outside the project.'
    }
    Remove-Item -LiteralPath $resolvedOutput -Recurse -Force
}
New-Item -ItemType Directory -Path $output -Force | Out-Null
Copy-Item -LiteralPath $source -Destination (Join-Path $output 'static') -Recurse
$previewHeaders = @{
    'Cache-Control' = 'no-store, max-age=0'
    'CDN-Cache-Control' = 'no-store'
    'Vercel-CDN-Cache-Control' = 'no-store'
}
$config = @{
    version = 3
    routes = @(
        @{ src = '^/(?:index\.html)?$'; headers = $previewHeaders; continue = $true }
        @{ src = '^/branding/social-card-tiger\.jpg$'; headers = $previewHeaders; continue = $true }
        @{ handle = 'filesystem' }
    )
}
$config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $output 'config.json') -Encoding utf8

$files = @(Get-ChildItem -LiteralPath $source -Recurse -File)
foreach ($file in $files) {
    $relative = [IO.Path]::GetRelativePath($source, $file.FullName)
    $staged = Join-Path (Join-Path $output 'static') $relative
    if (-not (Test-Path -LiteralPath $staged) -or (Get-FileHash -LiteralPath $file.FullName).Hash -ne (Get-FileHash -LiteralPath $staged).Hash) {
        throw "Deployment copy failed validation: $relative"
    }
}
if (-not (Test-Path -LiteralPath (Join-Path $output 'static/_framework/blazor.webassembly.js'))) { throw 'Missing Blazor runtime.' }
Write-Output "Prepared and hash-verified $($files.Count) static files in $output."
