#!/bin/zsh
# This script removes the credsStore line from ~/.docker/config.json to fix docker-credential-desktop errors
CONFIG_FILE="$HOME/.docker/config.json"
if [ -f "$CONFIG_FILE" ]; then
  echo "[INFO] Fixing Docker config: removing credsStore if present..."
  # Remove the credsStore line (in-place, backup as .bak)
  sed -i.bak '/"credsStore"/d' "$CONFIG_FILE"
  echo "[INFO] Done. Backup saved as $CONFIG_FILE.bak."
else
  echo "[INFO] No Docker config found at $CONFIG_FILE, nothing to fix."
fi
