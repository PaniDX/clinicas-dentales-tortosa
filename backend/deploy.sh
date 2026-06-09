#!/usr/bin/env bash
set -euo pipefail

# deploy.sh — Despliega la API en el VPS via rsync + docker-compose
# Uso: ./deploy.sh <usuario>@<vps-ip>

REMOTE="$1"
REMOTE_DIR="${2:-/opt/clinicas-api}"

echo "🔨 Construyendo imágenes locales..."
docker compose -f backend/docker-compose.yml build

echo "📦 Guardando imagen en archivo tar..."
docker save clinicas-api:latest -o /tmp/clinicas-api.tar

echo "⬆️  Subiendo archivos a $REMOTE:$REMOTE_DIR..."
rsync -az --delete \
  backend/docker-compose.yml \
  backend/.env.example \
  /tmp/clinicas-api.tar \
  "$REMOTE:$REMOTE_DIR/"

echo "🖥️  Desplegando en el servidor..."
ssh "$REMOTE" <<'SSH_EOF'
  set -euo pipefail
  cd /opt/clinicas-api

  # Cargar imagen
  docker load -i clinicas-api.tar && rm clinicas-api.tar

  # Copiar .env.example a .env si no existe (nunca sobreescribe secretos)
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Creado .env — edítalo con tus secretos reales antes de reiniciar"
  fi

  # Levantar servicio
  docker compose up -d

  echo "✅ Servicio actualizado"
SSH_EOF

echo "🎉 Deploy completado en $REMOTE:$REMOTE_DIR"
