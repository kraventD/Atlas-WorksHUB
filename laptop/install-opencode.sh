#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Installing OpenCode Desktop on laptop ==="

# ── Download and install OpenCode Desktop ──
OPENCODE_URL="https://dl.opencode.ai/opencode-desktop-bin"
OPENCODE_DIR="/opt/OpenCode"

if [ ! -f "$OPENCODE_DIR/opencode-desktop-bin" ]; then
  echo "Downloading OpenCode Desktop..."
  sudo mkdir -p "$OPENCODE_DIR"
  sudo curl -fsSL "$OPENCODE_URL" -o "$OPENCODE_DIR/opencode-desktop-bin"
  sudo chmod +x "$OPENCODE_DIR/opencode-desktop-bin"
fi

# ── Create wrapper script ──
sudo tee "$OPENCODE_DIR/opencode-desktop" > /dev/null << 'SCRIPT'
#!/bin/bash
exec /opt/OpenCode/opencode-desktop-bin "$@"
SCRIPT
sudo chmod +x "$OPENCODE_DIR/opencode-desktop"

# ── Desktop entry ──
sudo tee /usr/share/applications/opencode-desktop.desktop > /dev/null << 'DESKTOP'
[Desktop Entry]
Name=OpenCode Desktop
Comment=OpenCode AI Coding Assistant
Exec=/opt/OpenCode/opencode-desktop %F
Icon=opencode-desktop
Terminal=false
Type=Application
Categories=Development;IDE;
MimeType=text/plain;
StartupWMClass=opencode-desktop
DESKTOP

# ── Symlink ──
sudo ln -sf "$OPENCODE_DIR/opencode-desktop" /usr/local/bin/opencode-desktop

echo "=== OpenCode Desktop installation complete ==="
echo "Check the version and fix Plan Mode toggle if needed:"
echo "  Settings → Show agent → true (showCustomAgents: true)"
