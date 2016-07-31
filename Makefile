# Makefile

all:
	cd samples; $(MAKE) $@ BASEDIR=$(PWD)/base
	cd skel; $(MAKE) $@ BASEDIR=$(PWD)/base

clean:
	-cd samples; $(MAKE) $@
	-cd skel; $(MAKE) $@

