# Makefile
RM=rm -f
TYPEDOC=typedoc

BASEDIR=../base
BASES= \
	$(BASEDIR)/animation.ts \
	$(BASEDIR)/app.ts \
	$(BASEDIR)/entity.ts \
	$(BASEDIR)/geom.ts \
	$(BASEDIR)/imgsrc.ts \
	$(BASEDIR)/pathfind.ts \
	$(BASEDIR)/planplat.ts \
	$(BASEDIR)/scene.ts \
	$(BASEDIR)/sprite.ts \
	$(BASEDIR)/text.ts \
	$(BASEDIR)/tilemap.ts \
	$(BASEDIR)/utils.ts
OUTDIR=api

all: $(OUTDIR)

clean:
	-$(RM) -r $(OUTDIR)

$(OUTDIR): $(BASES)
	$(TYPEDOC) --out $(OUTDIR) $(BASES)
