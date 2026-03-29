#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$(mktemp -d)"
trap 'rm -rf "$STAGE_DIR"' EXIT

cd "$ROOT_DIR"

if ! command -v zip >/dev/null 2>&1; then
  echo "zip command is required to create the Chrome Web Store package"
  exit 1
fi

echo "==> Running validation before packaging"
"$ROOT_DIR/scripts/validate-extension.sh"

VERSION="$(
  node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')).version)"
)"
ARCHIVE_NAME="my-toolbox-crx-${VERSION}.zip"
ARCHIVE_PATH="$DIST_DIR/$ARCHIVE_NAME"

echo "==> Preparing staging directory"
mkdir -p "$DIST_DIR"

copy_entry() {
  local source_path="$1"
  local target_path="$STAGE_DIR/$source_path"

  mkdir -p "$(dirname "$target_path")"
  cp -R "$source_path" "$target_path"
}

copy_entry manifest.json
copy_entry _locales
copy_entry background
copy_entry core
copy_entry data
copy_entry favicon
copy_entry features
copy_entry fonts
copy_entry img
copy_entry libs
copy_entry options
copy_entry popup

find "$STAGE_DIR" \( -name '.DS_Store' -o -name '._*' \) -delete

echo "==> Creating $ARCHIVE_NAME"
rm -f "$ARCHIVE_PATH"
(
  cd "$STAGE_DIR"
  zip -qr "$ARCHIVE_PATH" .
)

echo "Package created: $ARCHIVE_PATH"
