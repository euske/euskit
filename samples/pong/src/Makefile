# Makefile for src

RM=rm -f
TSC=tsc

TSFLAGS=--noEmitOnError \
	--noFallthroughCasesInSwitch \
	--noImplicitAny \
	--noImplicitReturns

OUTDIR=../js

all: $(OUTDIR)/pong.js

clean:
	-$(RM) -r $(OUTDIR)

$(OUTDIR)/pong.js: pong.ts
	$(TSC) $(TSFLAGS) --out $@ $^
