# Makefile

all:
	cd samples; $(MAKE) $@
	cd skel; $(MAKE) $@

clean:
	-cd samples; $(MAKE) $@
	-cd skel; $(MAKE) $@

