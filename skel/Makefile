# Makefile
RM=rm -f
TSC=tsc
PYTHON=python
RSYNC=rsync -auvz
WATCHER=$(PYTHON) tools/watcher.py

BASEDIR=../base
BASES= \
	$(BASEDIR)/animation.ts \
	$(BASEDIR)/app.ts \
	$(BASEDIR)/entity.ts \
	$(BASEDIR)/geom.ts \
	$(BASEDIR)/sprite.ts \
	$(BASEDIR)/pathfind.ts \
	$(BASEDIR)/planplat.ts \
	$(BASEDIR)/scene.ts \
	$(BASEDIR)/task.ts \
	$(BASEDIR)/text.ts \
	$(BASEDIR)/tilemap.ts \
	$(BASEDIR)/utils.ts

REMOTE_DIR=yourhost.example.com:public_html/game

all: js/game.js
	cd assets; $(MAKE) $@

clean:
#	-cd assets; $(MAKE) $@
	-$(RM) -r js

watch:
	$(WATCHER) $(BASES) src/game.ts

upload: all
	$(RSYNC) --exclude '.*' --exclude '*.wav' --exclude Makefile index.html js assets $(REMOTE_DIR)

js/game.js: $(BASES) src/game.ts
	$(TSC)
