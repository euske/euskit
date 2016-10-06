# Makefile
RM=rm -f
TSC=tsc
BASEDIR=../../base
BASES= \
	$(BASEDIR)/animation.ts \
	$(BASEDIR)/app.ts \
	$(BASEDIR)/entity.ts \
	$(BASEDIR)/geom.ts \
	$(BASEDIR)/layer.ts \
	$(BASEDIR)/planmap.ts \
	$(BASEDIR)/planrunner.ts \
	$(BASEDIR)/scene.ts \
	$(BASEDIR)/sprite.ts \
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
