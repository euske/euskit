#!/bin/bash
# init.sh - project initialization script.

# "strict mode"
set -euo pipefail
IFS=$'\n\t'

# show the usage.
[ 2 = $# ] || ( echo "usage: $0 name destdir" && exit 111 )

# name
name="$1"
# destdir.
dst="$2"
# dirname of the script.
src=${0%/*}
[ -d "$dst" ] || ( echo "directory not exist: $dst" && exit 1 )

echo "src: $src"
echo "dst: $dst"

# create .rsyn
cat > "$dst/.rsyn" <<EOF
opts='--exclude *.wav --exclude *.md --exclude src --exclude tmp --exclude tools --exclude Makefile'
remote='tabesugi:public/file/ludumdare.tabesugi.net/$name'
EOF
mkdir "$dst"/base || :  # ignore errors
mkdir "$dst"/src || :  # ignore errors
mkdir "$dst"/assets || :  # ignore errors
cp "$src"/../../.gitignore "$dst"
cp "$src"/../../base/*.ts "$dst"/base
cp "$src"/Makefile "$dst"
cp "$src"/src/game.ts "$dst"/src/"$name".ts
cp "$src"/assets/* "$dst"/assets
sed -e "s/@@NAME@@/$name/g" "$src"/index.html > "$dst"/index.html
sed -e "s/@@NAME@@/$name/g" "$src"/src/Makefile > "$dst"/src/Makefile
