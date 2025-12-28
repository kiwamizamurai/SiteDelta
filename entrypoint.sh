#!/bin/sh
set -e

CONFIG_INPUT="$1"
WORKSPACE="${GITHUB_WORKSPACE:-/workspace}"

if [ -z "$CONFIG_INPUT" ]; then
  echo "Error: config input is required"
  exit 1
fi

CONFIG_PATHS=""
IFS=','
for config in $CONFIG_INPUT; do
  config=$(echo "$config" | xargs)
  case "$config" in
    /*) path="$config" ;;
    *) path="${WORKSPACE}/${config}" ;;
  esac
  CONFIG_PATHS="${CONFIG_PATHS}${CONFIG_PATHS:+,}${path}"
done

node /app/dist/index.js "$CONFIG_PATHS"
