# Makefile for src

RM=rm -f
TSC=tsc

TSFLAGS=--noEmitOnError \
	--noFallthroughCasesInSwitch \
	--noImplicitAny \
	--noImplicitReturns

OUTDIR=../js
OUTFILE=$(OUTDIR)/game.js

all: $(OUTFILE)

clean:
	-$(RM) -r $(OUTDIR)

$(OUTFILE): game.ts
	$(TSC) $(TSFLAGS) --out $@ $^
