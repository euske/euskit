# Makefile for src

RM=rm -f
TSC=tsc

TSFLAGS=--noEmitOnError \
	--noFallthroughCasesInSwitch \
	--noImplicitAny \
	--noImplicitReturns

SRCDIR=../base
SRCS=$(SRCDIR)/utils.ts \
       $(SRCDIR)/geom.ts \
       $(SRCDIR)/entity.ts \
       $(SRCDIR)/text.ts \
       $(SRCDIR)/layer.ts \
       $(SRCDIR)/scene.ts \
       $(SRCDIR)/app.ts

OUTDIR=../js
OUTFILE=$(OUTDIR)/@@NAME@@.js

all: $(OUTFILE)

clean:
	-$(RM) -r $(OUTDIR)

$(OUTFILE): $(SRCS) @@NAME@@.ts
	$(TSC) $(TSFLAGS) --out $@ $^
