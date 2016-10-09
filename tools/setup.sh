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
dirname=${0%/*}
basedir="$dirname/.."
mkdir "$dst" || :  # ignore errors
[ -d "$dst" ] || ( echo "directory not exist: $dst" && exit 1 )

echo "basedir: $basedir"
echo "setting up for: $dst"

# create .rsyn
mkdir "$dst"/src || :  # ignore errors
mkdir "$dst"/base || :  # ignore errors
mkdir "$dst"/assets || :  # ignore errors
mkdir "$dst"/tools || :  # ignore errors
cp "$basedir"/base/*.ts "$dst"/base
cp "$basedir"/tools/*.py "$dst"/tools
cp "$basedir"/skel/.gitignore "$dst"
sed 's+^BASEDIR=../base+BASEDIR=./base+' \
    "$basedir"/skel/Makefile > "$dst"/Makefile
cp "$basedir"/skel/index.html "$dst"
cp "$basedir"/skel/tsconfig.json "$dst"
cp "$basedir"/skel/assets/.gitignore "$dst"/assets
cp "$basedir"/skel/assets/* "$dst"/assets
sed 's+^/// <reference path="../../base+/// <reference path="../base+' \
    "$basedir"/skel/src/game.ts > "$dst"/src/game.ts

echo "done."
