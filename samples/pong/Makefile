# Makefile
RM=rm -f
TSC=tsc
BASEDIR=../../base
BASES= \
	$(BASEDIR)/animation.ts \
	$(BASEDIR)/app.ts \
	$(BASEDIR)/entity.ts \
	$(BASEDIR)/geom.ts \
	$(BASEDIR)/imgsrc.ts \
	$(BASEDIR)/layer.ts \
	$(BASEDIR)/pathfind.ts \
	$(BASEDIR)/planplat.ts \
	$(BASEDIR)/scene.ts \
	$(BASEDIR)/task.ts \
	$(BASEDIR)/text.ts \
	$(BASEDIR)/tilemap.ts \
	$(BASEDIR)/utils.ts

all: js/game.js
	cd assets; $(MAKE) $@

clean:
#	-cd assets; $(MAKE) $@
	-$(RM) -r js

js/game.js: $(BASES) src/game.ts
	$(TSC)
