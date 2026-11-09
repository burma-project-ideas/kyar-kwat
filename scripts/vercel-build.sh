#!/usr/bin/env bash
set -euo pipefail

export DOTNET_ROOT="$PWD/.vercel/cache/dotnet"
export PATH="$DOTNET_ROOT:$PATH"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1
mkdir -p "$DOTNET_ROOT"
curl --fail --location --retry 3 --silent --show-error \
  https://dot.net/v1/dotnet-install.sh -o .vercel/cache/dotnet-install.sh
bash .vercel/cache/dotnet-install.sh --jsonfile global.json --install-dir "$DOTNET_ROOT" --no-path
dotnet publish BlazorWasm.KyarKwat -c Release -o artifacts/vercel-publish
test -f artifacts/vercel-publish/wwwroot/_framework/blazor.webassembly.js
