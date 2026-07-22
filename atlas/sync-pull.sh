#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOSTNAME="$(hostname)"

echo "=== Pulling changes from Atlas-WorksHUB to $HOSTNAME ==="

cd "$REPO_DIR"
git pull

# ── Detect machine ──
if [ -d "$REPO_DIR/$HOSTNAME" ]; then
  MACHINE_DIR="$REPO_DIR/$HOSTNAME"
elif [ "$HOSTNAME" = "Kravent-Platform" ]; then
  MACHINE_DIR="$REPO_DIR/kravent-platform"
elif [ "$HOSTNAME" = "WorkHub2" ]; then
  MACHINE_DIR="$REPO_DIR/laptop"
else
  MACHINE_DIR=""
fi

# ── Install new packages ──
install_pkgs() {
  local file="$1"
  [ -f "$file" ] || return 0
  local new=()
  while IFS= read -r pkg; do
    [ -z "$pkg" ] && continue
    [[ "$pkg" == "#"* ]] && continue
    pacman -Q "$pkg" &>/dev/null || new+=("$pkg")
  done < "$file"
  [ ${#new[@]} -gt 0 ] && sudo pacman -S --needed --noconfirm "${new[@]}" || true
}

install_pkgs "$REPO_DIR/common/packages-common.txt"
[ -n "$MACHINE_DIR" ] && install_pkgs "$MACHINE_DIR/packages-extras.txt"

# ── Copy configs ──
echo "Updating configs..."
cp -r "$REPO_DIR/common/config/hypr/"* "$HOME/.config/hypr/"
cp -r "$REPO_DIR/common/config/waybar/"* "$HOME/.config/waybar/"
cp "$REPO_DIR/common/scripts/"* "$HOME/.local/bin/" 2>/dev/null || true
chmod +x "$HOME/.local/bin/hyde-"* 2>/dev/null || true

if [ -n "$MACHINE_DIR" ]; then
  [ -f "$MACHINE_DIR/monitors.conf" ] && cp "$MACHINE_DIR/monitors.conf" "$HOME/.config/hypr/monitors.conf"
  [ -f "$MACHINE_DIR/hypridle.conf" ] && cp "$MACHINE_DIR/hypridle.conf" "$HOME/.config/hypr/hypridle.conf"
fi

# ── Reload ──
hyprctl reload 2>/dev/null || true

echo "=== Pull complete ==="
