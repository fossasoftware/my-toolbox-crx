#!/usr/bin/env bash

is_usable_my_toolbox_node() {
  local node_path="$1"
  local node_version=""

  if [[ ! -x "$node_path" ]]; then
    return 1
  fi

  node_version="$(
    "$node_path" -p "process.versions.node" 2>/dev/null
  )" || return 1

  [[ "$node_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]
}

resolve_my_toolbox_node() {
  local requested_node="${MY_TOOLBOX_NODE:-}"
  local candidate=""
  local -a candidates=(
    "/opt/homebrew/bin/node"
    "/usr/local/bin/node"
  )

  if [[ -n "$requested_node" ]]; then
    if [[ ! -x "$requested_node" ]]; then
      echo "MY_TOOLBOX_NODE is not executable: $requested_node" >&2
      return 1
    fi
    if ! is_usable_my_toolbox_node "$requested_node"; then
      echo "MY_TOOLBOX_NODE is not a usable Node.js executable: $requested_node" >&2
      return 1
    fi
    printf '%s\n' "$requested_node"
    return 0
  fi

  if candidate="$(type -P node 2>/dev/null)" &&
    is_usable_my_toolbox_node "$candidate"; then
    printf '%s\n' "$candidate"
    return 0
  fi

  if [[ -n "${HOME:-}" ]]; then
    candidates+=(
      "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
      "$HOME/.volta/bin/node"
    )
  fi

  candidates+=(
    "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node"
  )

  for candidate in "${candidates[@]}"; do
    if is_usable_my_toolbox_node "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  echo "Node.js executable was not found." >&2
  echo "Install Node.js or set MY_TOOLBOX_NODE=/absolute/path/to/node." >&2
  return 1
}
