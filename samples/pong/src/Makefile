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
       $(BASEDIR)/app.ts

OUTDIR=../js
OUTFILE=$(OUTDIR)/pong.js

all: $(OUTFILE)

clean:
	-$(RM) -r $(OUTDIR)

$(OUTFILE): $(SRCS) pong.ts
	$(TSC) $(TSFLAGS) --out $@ $^
