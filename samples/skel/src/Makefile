# Makefile for src

RM=rm -f
TSC=tsc

TSFLAGS=--noEmitOnError \
	--noFallthroughCasesInSwitch \
	--noImplicitAny \
	--noImplicitReturns

SRCDIR=../../../src
SRCS=$(SRCDIR)/utils.ts \
       $(SRCDIR)/geom.ts \
       $(SRCDIR)/entity.ts \
       $(SRCDIR)/text.ts \
       $(SRCDIR)/layer.ts \
       $(SRCDIR)/scene.ts \
       $(SRCDIR)/app.ts \
       $(SRCDIR)/planmap.ts \
       $(SRCDIR)/planrunner.ts

OUTDIR=../js
OUTFILE=$(OUTDIR)/game.js

all: $(OUTFILE)

clean:
	-$(RM) -r $(OUTDIR)

$(OUTFILE): $(SRCS) game.ts
	$(TSC) $(TSFLAGS) --out $@ $^
