#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Setup ligero para WorkHub2 (sin HyDE) ==="

# ── Instalar dependencias básicas ──
echo "Instalando paquetes esenciales..."
sudo pacman -S --needed --noconfirm \
  waybar hyprland hyprlock hypridle hyprpaper hyprpicker \
  kitty dolphin firefox \
  dunst rofi wlogout cliphist wl-clipboard grim slurp satty \
  pipewire pipewire-pulse wireplumber \
  networkmanager bluez bluez-utils \
  sddm brightnessctl playerctl pamixer \
  fzf fastfetch starship jq imagemagick \
  noto-fonts-emoji ttf-jetbrains-mono-nerd \
  qt5-wayland qt6-wayland qt5ct qt6ct kvantum \
  pacman-contrib parallel polkit-kde-agent \
  xdg-desktop-portal-hyprland xdg-desktop-portal-gtk \
  unzip p7zip zip vim nano

# ── Instalar yay-bin (AUR helper) ──
if ! command -v yay &>/dev/null; then
  echo "Instalando yay-bin..."
  sudo pacman -S --needed --noconfirm git base-devel
  git clone --depth 1 https://aur.archlinux.org/yay-bin.git /tmp/yay-bin
  cd /tmp/yay-bin && makepkg -si --noconfirm --needed
  cd "$REPO_DIR"
  rm -rf /tmp/yay-bin
fi

# ── Paquetes AUR esenciales ──
yay -S --needed --noconfirm \
  hyprpolkitagent-git wl-clip-persist nwg-displays \
  awww hyprsunset-git hyprland-qt-support 2>/dev/null || true

# ── OpenCode Desktop ──
bash "$REPO_DIR/laptop/install-opencode.sh"

# ── Optimizar para 4GB RAM ──
echo "Optimizando memoria..."
bash "$REPO_DIR/atlas/optimize-laptop.sh"

# ── SDDM auto-login ──
echo "Configurando SDDM..."
sudo mkdir -p /etc/sddm.conf.d
sudo cp "$REPO_DIR/common/config/sddm/sddm.conf" /etc/sddm.conf 2>/dev/null || true
sudo cp "$REPO_DIR/common/config/sddm/the_hyde_project.conf" /etc/sddm.conf.d/ 2>/dev/null || true

# ── Configs Hyprland ──
echo "Copiando configs..."
mkdir -p "$HOME/.config/hypr/config" "$HOME/.config/waybar" "$HOME/.local/bin"
cp -r "$REPO_DIR/common/config/hypr/"* "$HOME/.config/hypr/" 2>/dev/null || true
cp -r "$REPO_DIR/common/config/waybar/"* "$HOME/.config/waybar/" 2>/dev/null || true
cp "$REPO_DIR/common/config/hypr/monitors.conf" "$HOME/.config/hypr/monitors.conf" 2>/dev/null || true
cp "$REPO_DIR/laptop/monitors.conf" "$HOME/.config/hypr/monitors.conf" 2>/dev/null || true

# ── Override hypridle sin lock ──
if [ -f "$REPO_DIR/laptop/hypridle.conf" ]; then
  cp "$REPO_DIR/laptop/hypridle.conf" "$HOME/.config/hypr/hypridle.conf"
else
  sed -i 's/.*lock.*/#$lock disabled/' "$HOME/.config/hypr/hypridle.conf" 2>/dev/null || true
fi

# ── Scripts comunes ──
echo "Instalando scripts..."
cp "$REPO_DIR/common/scripts/"* "$HOME/.local/bin/" 2>/dev/null || true
chmod +x "$HOME/.local/bin/hyde-"* 2>/dev/null || true

# ── Clipboard services ──
echo "Habilitando portapapeles..."
systemctl --user enable --now hyde-Hyprland-text-clipboard.service 2>/dev/null || true
systemctl --user enable --now hyde-Hyprland-image-clipboard.service 2>/dev/null || true

# ── Limpiar ──
rm -rf /tmp/yay-bin || true

echo ""
echo "=== Setup completado ==="
echo "Reinicia el sistema con: systemctl reboot"
