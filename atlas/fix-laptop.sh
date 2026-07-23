#!/bin/bash
# Fix completo para laptop WorkHub2 - borra TODO y deja un Hyprland limpio
set -e

echo "=== Fix laptop WorkHub2 ==="
echo "Borrando configs viejas..."

# Nuke everything
rm -rf /home/workhub2/.config/hypr
rm -rf /home/workhub2/.config/waybar
rm -rf /home/workhub2/.config/rofi
rm -rf /home/workhub2/.config/dunst
rm -rf /home/workhub2/.config/wlogout
rm -rf /home/workhub2/.config/Kvantum
rm -rf /home/workhub2/.config/qt5ct
rm -rf /home/workhub2/.config/qt6ct
rm -rf /home/workhub2/.config/starship.toml
rm -rf /home/workhub2/.config/gtk-3.0
rm -rf /home/workhub2/.config/gtk-4.0
rm -rf /home/workhub2/.config/fastfetch
rm -rf /home/workhub2/.local/share/hyde
rm -rf /home/workhub2/.local/lib/hyde
rm -rf /home/workhub2/.local/bin/hyde-*

echo "Creando config limpia..."

mkdir -p /home/workhub2/.config/hypr
mkdir -p /home/workhub2/.config/hypr/shaders
mkdir -p /home/workhub2/screenshots

# Poner config minimal DIRECTO (sin copiar archivos)
cat > /home/workhub2/.config/hypr/hyprland.conf << 'HYPRLANDEOF'
# Minimal Hyprland config for WorkHub2

monitor=,1920x1080@60,0x0,1

input {
    kb_layout = latam
    follow_mouse = 1
    touchpad {
        natural_scroll = true
        tap-to-click = true
        disable_while_typing = true
    }
}

general {
    gaps_in = 4
    gaps_out = 8
    border_size = 2
    col.active_border = rgba(89b4faff) rgba(89b4faff)
    col.inactive_border = rgba(45475aff)
    layout = dwindle
}

decoration {
    rounding = 8
    blur {
        enabled = true
        size = 3
        passes = 1
    }
    shadow {
        enabled = true
        range = 4
        render_power = 3
    }
}

windowrulev2 = float, title:^(Open As) (.*)$
windowrulev2 = float, title:^(Save As) (.*)$
windowrulev2 = float, title:^(Open File)$
windowrulev2 = float, class:^(file_progress)$
windowrulev2 = float, class:^(confirm)$
windowrulev2 = float, class:^(dialog)$
windowrulev2 = float, class:^(download)$
windowrulev2 = float, class:^(notification)$
windowrulev2 = float, class:^(error)$
windowrulev2 = float, class:^(confirmreset)$
windowrulev2 = float, class:^(floating)$
windowrulev2 = opacity 0.8, class:^(Code)$
windowrulev2 = opacity 0.8, class:^(kitty)$
windowrulev2 = opacity 0.9, class:^(firefox)$

exec-once = /usr/lib/polkit-kde-authentication-agent-1
exec-once = waybar
exec-once = dunst
exec-once = cliphist
exec-once = /usr/lib/xdg-desktop-portal-hyprland
exec-once = sleep 2 && hyprpaper
exec-once = nm-applet --indicator

$mainMod = SUPER

bind = $mainMod, Q, killactive
bind = $mainMod, T, exec, kitty
bind = $mainMod, W, exec, firefox
bind = $mainMod, D, exec, rofi -show drun
bind = $mainMod, F, fullscreen
bind = $mainMod, L, exec, hyprlock
bind = $mainMod, Space, togglefloating
bind = $mainMod, left, movefocus, l
bind = $mainMod, right, movefocus, r
bind = $mainMod, up, movefocus, u
bind = $mainMod, down, movefocus, d
bind = $mainMod SHIFT, left, movewindow, l
bind = $mainMod SHIFT, right, movewindow, r
bind = $mainMod SHIFT, up, movewindow, u
bind = $mainMod SHIFT, down, movewindow, d
bind = $mainMod, Print, exec, grim /home/workhub2/screenshots/$(date +%Y%m%d-%H%M%S).png
bind = , Print, exec, grim -g "$(slurp)" /home/workhub2/screenshots/$(date +%Y%m%d-%H%M%S).png
bind = ALT, F4, exec, pkill -9 -f $(hyprctl activewindow -j | jq -r '.class')

bind = $mainMod, 1, workspace, 1
bind = $mainMod, 2, workspace, 2
bind = $mainMod, 3, workspace, 3
bind = $mainMod, 4, workspace, 4
bind = $mainMod, 5, workspace, 5
bind = $mainMod, 6, workspace, 6
bind = $mainMod, 7, workspace, 7
bind = $mainMod, 8, workspace, 8
bind = $mainMod, 9, workspace, 9
bind = $mainMod SHIFT, 1, movetoworkspace, 1
bind = $mainMod SHIFT, 2, movetoworkspace, 2
bind = $mainMod SHIFT, 3, movetoworkspace, 3
bind = $mainMod SHIFT, 4, movetoworkspace, 4
bind = $mainMod SHIFT, 5, movetoworkspace, 5
bind = $mainMod SHIFT, 6, movetoworkspace, 6
bind = $mainMod SHIFT, 7, movetoworkspace, 7
bind = $mainMod SHIFT, 8, movetoworkspace, 8
bind = $mainMod SHIFT, 9, movetoworkspace, 9

exec-once = mkdir -p /home/workhub2/screenshots
HYPRLANDEOF

# Crear shader vacio
echo "// disable" > /home/workhub2/.config/hypr/shaders/disable.frag

# Asegurar permisos
chown -R workhub2:workhub2 /home/workhub2/.config/hypr
chown -R workhub2:workhub2 /home/workhub2/screenshots

echo "=== Listo! Reiniciando SDDM ==="
sudo systemctl restart sddm
