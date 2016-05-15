#!/bin/bash
# init.sh - project initialization script.

# "strict mode"
set -euo pipefail
IFS=$'\n\t'

# destdir.
dst="$1"
# dirname of the script.
src=${0%/*}/..
# basename of the destdir.
name=${dst##*/}
[ -d "$dst" ] || ( echo "usage: $0 dst" && exit 1 )

echo "src: $src"
echo "dst: $dst"

# create .rsyn
cat > "$dst/.rsyn" <<EOF
opts='--exclude *.wav --exclude *.md --exclude src --exclude tmp --exclude tools --exclude Makefile'
remote='tabesugi:public/file/ludumdare.tabesugi.net/$name'
EOF
mkdir "$dst"/src || :  # ignore errors
mkdir "$dst"/assets || :  # ignore errors
cp "$src"/.gitignore "$dst"
cp "$src"/samples/skel/Makefile "$dst"
cp "$src"/samples/skel/src/*.ts "$dst"/src
cp "$src"/src/*.ts "$dst"/src
cp "$src"/samples/skel/assets/* "$dst"/assets
sed -e "s/@@NAME@@/$name/g" "$src"/samples/skel/index.html > "$dst"/index.html
sed -e "s/@@NAME@@/$name/g" "$src"/samples/skel/src/Makefile > "$dst"/src/Makefile
