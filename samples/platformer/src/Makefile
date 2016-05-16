# Makefile for src

RM=rm -f
TSC=tsc

TSFLAGS=--noEmitOnError \
	--noFallthroughCasesInSwitch \
	--noImplicitAny \
	--noImplicitReturns

BASEDIR=../../../base
SRCS=$(BASEDIR)/utils.ts \
       $(BASEDIR)/geom.ts \
       $(BASEDIR)/entity.ts \
       $(BASEDIR)/text.ts \
       $(BASEDIR)/layer.ts \
       $(BASEDIR)/scene.ts \
       $(BASEDIR)/app.ts \
       $(BASEDIR)/planmap.ts \
       $(BASEDIR)/planrunner.ts

OUTDIR=../js
OUTFILE=$(OUTDIR)/platformer.js

all: $(OUTFILE)

clean:
	-$(RM) -r $(OUTDIR)

$(OUTFILE): $(SRCS) platformer.ts
	$(TSC) $(TSFLAGS) --out $@ $^
