#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOSTNAME="$(hostname)"
HOSTNAME_LOWER="$(echo "$HOSTNAME" | tr '[:upper:]' '[:lower:]')"
RAM_GB=$(awk '/MemTotal/ {printf "%d", $2/1024/1024}' /proc/meminfo)

echo "=== Atlas WorksHUB Setup ==="
echo "Hostname: $HOSTNAME"
echo "RAM: ${RAM_GB}GB"
echo "Repo: $REPO_DIR"

# Detect machine (case-insensitive)
MACHINE=""
case "$HOSTNAME_LOWER" in
  kravent-platform)
    MACHINE="desktop"
    echo "Detected: PC Fija (Kravent-Platform)"
    ;;
  workhub*)
    MACHINE="laptop"
    echo "Detected: Laptop (WorkHub2)"
    ;;
esac

if [ -z "$MACHINE" ]; then
  MACHINE="laptop"
  echo "Hostname '$HOSTNAME' no reconocido. Usando perfil laptop por defecto."
fi

MACHINE_DIR="$REPO_DIR/$MACHINE"
HOSTNAME_DIR="$REPO_DIR/$HOSTNAME"
[ -d "$HOSTNAME_DIR" ] && MACHINE_DIR="$HOSTNAME_DIR"

# Create machine dir if needed
if [ ! -d "$MACHINE_DIR" ]; then
  mkdir -p "$MACHINE_DIR"
  echo "# monitors.conf generado para $HOSTNAME" > "$MACHINE_DIR/monitors.conf"
  echo "Creado $MACHINE_DIR con monitors.conf por defecto"
fi

# ── Helper ──
install_packages() {
  local file="$1"
  [ -f "$file" ] || return 0
  local pkgs=()
  while IFS= read -r pkg; do
    [ -z "$pkg" ] && continue
    [[ "$pkg" == "#"* ]] && continue
    pkgs+=("$pkg")
  done < "$file"
  [ ${#pkgs[@]} -eq 0 ] && return 0
  echo "Installing ${#pkgs[@]} packages from $(basename $file)..."
  sudo pacman -S --needed --noconfirm "${pkgs[@]}" 2>/dev/null || yay -S --needed --noconfirm "${pkgs[@]}" 2>/dev/null || true
}

# ── 1. System packages ──
echo "=== Installing common packages ==="
install_packages "$REPO_DIR/common/packages-common.txt"

if [ -f "$MACHINE_DIR/packages-extras.txt" ]; then
  echo "=== Installing $MACHINE-specific packages ==="
  install_packages "$MACHINE_DIR/packages-extras.txt"
fi

# ── 2. Install HyDE ──
if ! command -v hyde-shell &>/dev/null; then
  echo "=== Installing HyDE ==="
  bash <(curl -fsSL https://github.com/HyDE-Project/HyDE/install.sh)
fi

# ── 3. Optimize laptop ──
if [ "$MACHINE" = "laptop" ]; then
  echo "=== Optimizing laptop ==="
  bash "$REPO_DIR/atlas/optimize-laptop.sh"
fi

# ── 4. SDDM auto-login ──
echo "=== Configuring SDDM auto-login ==="
sudo mkdir -p /etc/sddm.conf.d
sudo cp "$REPO_DIR/common/config/sddm/sddm.conf" /etc/sddm.conf 2>/dev/null || true
sudo cp "$REPO_DIR/common/config/sddm/the_hyde_project.conf" /etc/sddm.conf.d/ 2>/dev/null || true

# ── 5. Hyprland configs ──
echo "=== Copying Hyprland configs ==="
mkdir -p "$HOME/.config/hypr/config" "$HOME/.config/waybar"
cp -r "$REPO_DIR/common/config/hypr/"* "$HOME/.config/hypr/"
cp -r "$REPO_DIR/common/config/waybar/"* "$HOME/.config/waybar/"

# Machine-specific overrides
if [ -f "$MACHINE_DIR/monitors.conf" ]; then
  cp "$MACHINE_DIR/monitors.conf" "$HOME/.config/hypr/monitors.conf"
fi

if [ -f "$MACHINE_DIR/waybar-gpu.jsonc" ]; then
  module_name=$(basename "$MACHINE_DIR/waybar-gpu.jsonc" .jsonc)
  cp "$MACHINE_DIR/waybar-gpu.jsonc" "$HOME/.config/waybar/includes/$module_name.jsonc" 2>/dev/null || true
fi

# ── 6. Scripts ──
echo "=== Installing scripts ==="
mkdir -p "$HOME/.local/bin"
cp "$REPO_DIR/common/scripts/"* "$HOME/.local/bin/"
chmod +x "$HOME/.local/bin/hyde-"*

# ── 7. Clipboard services ──
echo "=== Starting clipboard watchers ==="
systemctl --user enable --now hyde-Hyprland-text-clipboard.service 2>/dev/null || true
systemctl --user enable --now hyde-Hyprland-image-clipboard.service 2>/dev/null || true

# ── 8. hypridle (no lock) ──
echo "=== Configuring hypridle ==="
if [ -f "$MACHINE_DIR/hypridle.conf" ]; then
  cp "$MACHINE_DIR/hypridle.conf" "$HOME/.config/hypr/hypridle.conf"
fi

# ── 9. Projects ──
if [ -d "$REPO_DIR/projects/oribius-discovery" ]; then
  echo "=== Setting up oribius-discovery ==="
  mkdir -p "$HOME/projects"
  cp -r "$REPO_DIR/projects/oribius-discovery" "$HOME/projects/" 2>/dev/null
  if [ -f "$HOME/projects/oribius-discovery/package.json" ]; then
    cd "$HOME/projects/oribius-discovery"
    npm install 2>/dev/null || true
  fi
fi

# ── 10. Reload ──
echo "=== Reloading config ==="
hyprctl reload 2>/dev/null || true

echo ""
echo "=== Setup complete! ==="
echo "Reboot or log out and back in for all changes to take effect."
