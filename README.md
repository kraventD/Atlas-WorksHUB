# Atlas WorksHUB

Configuraciones sincronizadas entre Kravent-Platform (PC fija) y WorkHub2 (laptop).

## Estructura

```
atlas/                  # Scripts de sincronización y setup
  setup.sh              # Instalación completa (detecta hostname)
  sync-push.sh          # Sube cambios locales al repo
  sync-pull.sh          # Baja cambios del repo a la máquina
  optimize-laptop.sh    # Optimizaciones para laptop (zram, swap)
common/                 # Compartido entre todas las máquinas
  packages-common.txt   # Paquetes comunes
  config/
    hypr/               # Config de Hyprland
    waybar/             # Config de Waybar
    sddm/               # Config de SDDM (auto-login)
  scripts/              # Scripts comunes (~/.local/bin/)
kravent-platform/       # PC fija (NVIDIA 1050 Ti)
  monitors.conf         # Monitores específicos
  packages-extras.txt   # Paquetes extra (nvidia, cuda)
laptop/                 # Laptop (WorkHub2, 4GB RAM)
  monitors.conf         # Monitores específicos
  packages-extras.txt   # Paquetes extra (tlp, powertop)
  install-opencode.sh   # Instala OpenCode Desktop en laptop
projects/               # Proyectos (copia compartida)
```

## Uso inicial

En cada máquina:

```bash
git clone https://github.com/kraventD/Atlas-WorksHUB.git
cd Atlas-WorksHUB
./atlas/setup.sh
```

## Sincronización

```bash
# Después de cambiar configs
./atlas/sync-push.sh

# Para aplicar cambios desde otra máquina
./atlas/sync-pull.sh
```
