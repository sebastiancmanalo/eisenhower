#!/bin/bash

# Snapshot script: backs up src/ directory and config files to backups/ with timestamp

# Get current timestamp in YYYY-MM-DD_HHMMSS format
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")

# Create backups directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Create timestamped backup directory
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

# Copy src/ to backup location
cp -r src/ "$BACKUP_PATH/"

# Copy package files if they exist
[ -f package.json ] && cp package.json "$BACKUP_PATH/"
[ -f package-lock.json ] && cp package-lock.json "$BACKUP_PATH/"

# Copy vite config files if they exist
for config in vite.config.*; do
  [ -f "$config" ] && cp "$config" "$BACKUP_PATH/"
done

# Copy vitest config files if they exist
for config in vitest.config.*; do
  [ -f "$config" ] && cp "$config" "$BACKUP_PATH/"
done

echo "✓ Snapshot created: $BACKUP_PATH"
echo "  Source files and config backed up successfully"

