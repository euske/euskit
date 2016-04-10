# Makefile for src

RM=rm -f
TSC=tsc

TSFLAGS=--noEmitOnError \
	--noFallthroughCasesInSwitch \
	--noImplicitAny \
	--noImplicitReturns

SRCDIR=.
SRCS=$(SRCDIR)/utils.ts \
	$(SRCDIR)/geom.ts \
	$(SRCDIR)/entity.ts \
	$(SRCDIR)/tilemap.ts \
	$(SRCDIR)/text.ts \
	$(SRCDIR)/layer.ts \
	$(SRCDIR)/scene.ts \
	$(SRCDIR)/app.ts \
	$(SRCDIR)/main.ts \
	$(SRCDIR)/game.ts

OUTDIR=../js
OUTFILE=$(OUTDIR)/out.js

all: $(OUTFILE)

clean:
	-$(RM) -r $(OUTDIR)

$(OUTFILE): $(SRCS)
	$(TSC) $(TSFLAGS) --out $@ $^
