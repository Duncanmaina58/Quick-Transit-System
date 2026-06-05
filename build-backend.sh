#!/bin/bash
set -e
echo "=== .NET Version ==="
dotnet --version
echo "=== Restoring packages ==="
dotnet restore
echo "=== Building ==="
dotnet build --configuration Release