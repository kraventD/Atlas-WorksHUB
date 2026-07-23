#!/bin/bash
# Bootstrap: descarga el repo y ejecuta el setup
# Pega esto en kitty: bash -c "$(curl -fsSL https://raw.githubusercontent.com/kraventD/Atlas-WorksHUB/main/atlas/bootstrap.sh)"

set -e

REPO_URL="https://github.com/kraventD/Atlas-WorksHUB.git"
DEST="$HOME/Atlas-WorksHUB"

echo "=== Bootstrap Atlas-WorksHUB ==="

# Instalar git si no existe
if ! command -v git &>/dev/null; then
  echo "Instalando git..."
  sudo pacman -S --noconfirm git
fi

# Clonar o actualizar repo
if [ -d "$DEST" ]; then
  echo "Actualizando repo existente en $DEST..."
  cd "$DEST" && git pull
else
  echo "Clonando repo en $DEST..."
  git clone "$REPO_URL" "$DEST"
fi

# Ejecutar setup
echo "Ejecutando setup.sh..."
bash "$DEST/atlas/setup.sh"

echo "=== Bootstrap completado ==="
echo "El sistema se reiniciara en 5 segundos..."
sleep 5
systemctl reboot
