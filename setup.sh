#!/bin/bash
# setup.sh - project initialization script.

# "strict mode"
set -euo pipefail
IFS=$'\n\t'

# show the usage.
[ 1 = $# ] || ( echo "usage: $0 destdir" && exit 111 )

# destdir.
dst="$1"
# dirname of the script.
src=${0%/*}
mkdir "$dst" || :  # ignore errors
[ -d "$dst" ] || ( echo "directory not exist: $dst" && exit 1 )

echo "src: $src"
echo "dst: $dst"

# create .rsyn
mkdir "$dst"/src || :  # ignore errors
mkdir "$dst"/base || :  # ignore errors
mkdir "$dst"/assets || :  # ignore errors
cp "$src"/base/*.ts "$dst"/base
cp "$src"/skel/.gitignore "$dst"
cp "$src"/skel/Makefile "$dst"
cp "$src"/skel/index.html "$dst"
cp "$src"/skel/src/.gitignore "$dst"/src
cp "$src"/skel/src/Makefile "$dst"/src
cp "$src"/skel/assets/.gitignore "$dst"/assets
cp "$src"/skel/assets/* "$dst"/assets
sed 's+^/// <reference path="../../base+/// <reference path="../base+' \
    "$src"/skel/src/game.ts > "$dst"/src/game.ts
