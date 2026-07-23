#!/bin/bash
# Limpia una instalación fallida de HyDE para poder reintentar
set -e

echo "=== Limpieza de instalacion fallida de HyDE ==="

# 1. Borrar el repo clonado
if [ -d "$HOME/HyDE" ]; then
  echo "Borrando $HOME/HyDE..."
  rm -rf "$HOME/HyDE"
fi

# 2. Borrar configs de Hyprland que HyDE haya dejado
echo "Borrando configs parciales de HyDE..."
rm -rf "$HOME/.config/hypr/" 2>/dev/null
rm -rf "$HOME/.config/waybar/" 2>/dev/null
rm -rf "$HOME/.config/ags/" 2>/dev/null
rm -rf "$HOME/.config/gtk-3.0/" 2>/dev/null
rm -rf "$HOME/.config/gtk-4.0/" 2>/dev/null
rm -rf "$HOME/.config/rofi/" 2>/dev/null
rm -rf "$HOME/.config/dunst/" 2>/dev/null
rm -rf "$HOME/.config/mpv/" 2>/dev/null
rm -rf "$HOME/.config/swappy/" 2>/dev/null
rm -rf "$HOME/.config/btop/" 2>/dev/null
rm -rf "$HOME/.config/cava/" 2>/dev/null
rm -rf "$HOME/.config/kitty/" 2>/dev/null
rm -rf "$HOME/.config/starship.toml" 2>/dev/null
rm -rf "$HOME/.config/wlogout/" 2>/dev/null
rm -rf "$HOME/.config/fastfetch/" 2>/dev/null

# 3. Borrar scripts locales de HyDE
echo "Borrando scripts de HyDE..."
rm -f "$HOME/.local/bin/hyde"* 2>/dev/null
rm -rf "$HOME/.local/lib/hyde/" 2>/dev/null
rm -rf "$HOME/.local/share/hyde/" 2>/dev/null

# 4. Borrar systemd services de HyDE
echo "Deshabilitando servicios de HyDE..."
systemctl --user disable --now hyde-Hyprland-* 2>/dev/null || true
rm -f "$HOME/.config/systemd/user/hyde-"* 2>/dev/null

# 5. Reparar pacman si quedó trabado
echo "Reparando pacman..."
sudo rm -f /var/lib/pacman/db.lck 2>/dev/null
sudo pacman-key --init 2>/dev/null || true
sudo pacman -Sy 2>/dev/null || true

echo "=== Limpieza completa ==="
echo "Ya podes volver a ejecutar: bash atlas/setup.sh"
echo "IMPORTANTE: Elegi la opcion 3 (yay-bin) cuando pregunte."
