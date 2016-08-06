# Makefile for src

RM=rm -f
LN=ln
TSC=tsc

TSFLAGS=--noEmitOnError \
	--noFallthroughCasesInSwitch \
	--noImplicitAny \
	--noImplicitReturns

BASEDIR=../base
OUTDIR=../js
OUTFILE=$(OUTDIR)/game.js

all: base $(OUTFILE)

clean:
	-$(RM) -r $(OUTDIR)
	-$(RM) base

base:
	$(LN) -s $(BASEDIR) base

$(OUTFILE): game.ts
	$(TSC) $(TSFLAGS) --out $@ $^
