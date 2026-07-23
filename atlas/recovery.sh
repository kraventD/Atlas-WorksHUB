#!/bin/bash
# Recovery total para la laptop WorkHub2
# Corre desde TTY (Ctrl+Alt+F2 si no tenés GUI)
set -e

echo "=== RECOVERY WorkHub2 ==="
echo "Esto va a limpiar TODO lo de HyDE e instalar un entorno limpio."
sleep 3

# ── 1. Eliminar todo rastro de HyDE ──
echo "[1/6] Limpiando HyDE..."
rm -rf "$HOME/HyDE"
rm -rf "$HOME/.config/hypr" "$HOME/.config/waybar" "$HOME/.config/ags"
rm -rf "$HOME/.config/rofi" "$HOME/.config/dunst" "$HOME/.config/wlogout"
rm -rf "$HOME/.config/gtk-3.0" "$HOME/.config/gtk-4.0"
rm -rf "$HOME/.config/qt5ct" "$HOME/.config/qt6ct"
rm -rf "$HOME/.config/Kvantum" "$HOME/.config/starship.toml"
rm -rf "$HOME/.config/fastfetch" "$HOME/.config/kitty"
rm -rf "$HOME/.config/btop" "$HOME/.config/cava" "$HOME/.config/mpv"
rm -rf "$HOME/.config/swappy" "$HOME/.config/lsd"
rm -rf "$HOME/.local/bin/hyde"* "$HOME/.local/lib/hyde" "$HOME/.local/share/hyde"
rm -f "$HOME/.local/bin/hyde-close-soft" "$HOME/.local/bin/hyde-close-hard"
rm -f "$HOME/.local/bin/hyde-music" "$HOME/.local/bin/hyde-clip-last"
rm -rf "$HOME/.local/share/fonts/Hyde*"
systemctl --user disable --now hyde-Hyprland-* 2>/dev/null || true
rm -f "$HOME/.config/systemd/user/hyde-"* 2>/dev/null

# ── 2. Reparar pacman ──
echo "[2/6] Reparando pacman..."
sudo rm -f /var/lib/pacman/db.lck
sudo pacman-key --init 2>/dev/null || true
sudo pacman -Sy --noconfirm archlinux-keyring 2>/dev/null || true

# ── 3. Instalar solo lo mínimo necesario ──
echo "[3/6] Instalando paquetes base..."
sudo pacman -S --needed --noconfirm \
  hyprland hyprpaper hyprlock hypridle \
  kitty dolphin firefox waybar \
  sddm pipewire pipewire-pulse wireplumber \
  networkmanager git wget curl \
  noto-fonts-emoji ttf-jetbrains-mono-nerd \
  polkit-kde-agent xdg-desktop-portal-hyprland \
  xdg-desktop-portal-gtk qt5-wayland qt6-wayland \
  qt5ct qt6ct kvantum \
  grim slurp satty cliphist wl-clipboard \
  dunst rofi wlogout \
  fzf fastfetch jq imagemagick \
  pamixer brightnessctl playerctl \
  unzip zip vim nano || true

# ── 4. Reinstalar configs básicas ──
echo "[4/6] Restaurando configs..."
mkdir -p "$HOME/.config/hypr/config" "$HOME/.config/waybar"
cp -r /home/workhub2/Atlas-WorksHUB/common/config/hypr/* "$HOME/.config/hypr/" 2>/dev/null || true
cp -r /home/workhub2/Atlas-WorksHUB/common/config/waybar/* "$HOME/.config/waybar/" 2>/dev/null || true
cp /home/workhub2/Atlas-WorksHUB/laptop/monitors.conf "$HOME/.config/hypr/monitors.conf" 2>/dev/null || true

# ── 5. SDDM auto-login ──
echo "[5/6] SDDM auto-login..."
sudo mkdir -p /etc/sddm.conf.d
sudo cp /home/workhub2/Atlas-WorksHUB/common/config/sddm/sddm.conf /etc/sddm.conf 2>/dev/null || true
sudo cp /home/workhub2/Atlas-WorksHUB/common/config/sddm/the_hyde_project.conf /etc/sddm.conf.d/ 2>/dev/null || true

# ── 6. Optimizar memoria ──
echo "[6/6] Optimizando 4GB RAM..."
bash /home/workhub2/Atlas-WorksHUB/atlas/optimize-laptop.sh 2>/dev/null || true

echo ""
echo "=== RECOVERY COMPLETADO ==="
echo "Reiniciá con: systemctl reboot"
