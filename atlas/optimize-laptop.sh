#!/bin/bash
set -e

echo "=== Optimizing laptop for 4GB RAM ==="

# ── Zram ──
if ! systemctl is-active --quiet zram-generator 2>/dev/null; then
  echo "Configuring zram..."
  sudo tee /etc/systemd/zram-generator.conf > /dev/null << 'EOF'
[zram0]
zram-size = ram / 2
compression-algorithm = zstd
EOF
  sudo systemctl daemon-reload
  sudo systemctl start systemd-zram-setup@zram0.service || true
fi

# ── Swappiness ──
echo "Setting swappiness=10..."
sudo tee /etc/sysctl.d/99-swappiness.conf > /dev/null << 'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=50

# ── Disable unnecessary services ──
echo "Disabling unused services..."
sudo systemctl disable --now bluetooth.service 2>/dev/null || true
sudo systemctl disable --now cups.service 2>/dev/null || true

# ── Trim ──
sudo systemctl enable --now fstrim.timer 2>/dev/null || true

echo "=== Optimization complete ==="
