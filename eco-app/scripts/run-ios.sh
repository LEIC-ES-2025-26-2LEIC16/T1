#!/bin/bash
set -e

# Detecta o dispositivo iOS ligado
echo "📱 A procurar dispositivo iOS..."
DEVICE_UDID=$(xcrun xctrace list devices 2>&1 \
  | awk '/== Devices ==/{f=1;next} /== Simulators ==/{f=0} f' \
  | grep -v "Mac\|==" \
  | grep "(" \
  | head -1 \
  | rev | cut -d'(' -f1 | rev | tr -d ')')

if [ -z "$DEVICE_UDID" ]; then
  echo "❌ Nenhum dispositivo encontrado. Liga o iPhone e volta a tentar."
  exit 1
fi

echo "✅ Dispositivo: $DEVICE_UDID"
echo "🔨 A compilar (pode demorar alguns minutos)..."

xcodebuild \
  -workspace ios/MyImpact.xcworkspace \
  -scheme MyImpact \
  -configuration Debug \
  -destination "id=$DEVICE_UDID" \
  -allowProvisioningUpdates \
  build 2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED" || true

echo ""
echo "🚀 A iniciar Metro bundler..."
npx expo start --dev-client
