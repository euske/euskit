# Makefile
RM=rm -f
TYPEDOC=typedoc

BASEDIR=../base
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
OUTDIR=api

all: $(OUTDIR)

clean:
	-$(RM) -r $(OUTDIR)

$(OUTDIR):
	$(TYPEDOC) --out $(OUTDIR) $(BASES)
