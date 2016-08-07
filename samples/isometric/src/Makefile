# Makefile for src

RM=rm -f
SLN=ln -s
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
	-$(RM) -r base

base: $(BASEDIR)
	$(SLN) $(BASEDIR) ./base

$(OUTFILE): game.ts
	$(TSC) $(TSFLAGS) --out $@ $^
