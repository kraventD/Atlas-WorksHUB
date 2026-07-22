#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOSTNAME="$(hostname)"

echo "=== Pushing changes from $HOSTNAME to Atlas-WorksHUB ==="

# ── Export package lists ──
echo "Exporting package lists..."
pacman -Qqen > "$REPO_DIR/common/packages-common.txt"

# ── Export machine-specific packages ──
MACHINE_DIR="$REPO_DIR/$HOSTNAME"
if [ -d "$MACHINE_DIR" ]; then
  comm -23 <(pacman -Qqen | sort) <(sort "$REPO_DIR/common/packages-common.txt") > "$MACHINE_DIR/packages-extras.txt" 2>/dev/null || true
fi

# ── Copy configs ──
echo "Copying Hyprland configs..."
cp -r "$HOME/.config/hypr/"* "$REPO_DIR/common/config/hypr/"
cp -r "$HOME/.config/waybar/"* "$REPO_DIR/common/config/waybar/"

echo "Copying scripts..."
cp "$HOME/.local/bin/hyde-close-soft" "$REPO_DIR/common/scripts/" 2>/dev/null || true
cp "$HOME/.local/bin/hyde-close-hard" "$REPO_DIR/common/scripts/" 2>/dev/null || true
cp "$HOME/.local/bin/hyde-music" "$REPO_DIR/common/scripts/" 2>/dev/null || true
cp "$HOME/.local/bin/hyde-clip-last" "$REPO_DIR/common/scripts/" 2>/dev/null || true
cp "$HOME/.local/bin/hyde-screen-save" "$REPO_DIR/common/scripts/" 2>/dev/null || true

# ── Copy SDDM config ──
sudo cp /etc/sddm.conf "$REPO_DIR/common/config/sddm/" 2>/dev/null || true
sudo cp /etc/sddm.conf.d/the_hyde_project.conf "$REPO_DIR/common/config/sddm/" 2>/dev/null || true

# ── Commit and push ──
cd "$REPO_DIR"
git add -A
git commit -m "Sync from $HOSTNAME on $(date '+%Y-%m-%d %H:%M')"
git push

echo "=== Push complete ==="
