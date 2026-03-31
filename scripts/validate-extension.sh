#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Validating manifest.json"
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')); console.log('manifest ok')"

echo "==> Checking JavaScript syntax"
while IFS= read -r file; do
  node --check "$file"
done < <(find background core features options popup -type f \( -name '*.js' -o -name '*.mjs' \) | sort)

echo "==> Running unit tests"
test_files=()
while IFS= read -r file; do
  test_files+=("$file")
done < <(find tests -type f -name '*.test.mjs' | sort)
if ((${#test_files[@]} > 0)); then
  node --test "${test_files[@]}"
fi

echo "==> Import smoke test for board entry"
node --input-type=module -e "
globalThis.document = {
  documentElement: {},
  body: {},
  hidden: false,
  getElementById() { return null; },
  querySelectorAll() { return []; },
  activeElement: null,
  addEventListener() {},
};
globalThis.getComputedStyle = () => ({
  getPropertyValue() { return ''; },
  fontFamily: 'sans-serif',
});
globalThis.window = {
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.ResizeObserver = class {
  observe() {}
  disconnect() {}
};
Object.defineProperty(globalThis, 'navigator', {
  value: { platform: 'MacIntel' },
  configurable: true,
});
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
await import('./features/board/board.js');
console.log('board.js import ok');
"

echo "==> Checking trailing whitespace"
if rg -n "[ \t]+$" background core features options popup manifest.json README.md CHANGELOG.md; then
  echo "Trailing whitespace detected"
  exit 1
fi

echo "==> Checking patch formatting"
git diff --check -- . >/dev/null

echo "Validation passed"
