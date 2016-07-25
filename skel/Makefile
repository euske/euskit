# Makefile

all: src/base
	cd src; $(MAKE) $@
	cd assets; $(MAKE) $@

clean:
	-cd src; $(MAKE) $@
#	-cd assets; $(MAKE) $@

src/base:
	cp -a ../../base src
