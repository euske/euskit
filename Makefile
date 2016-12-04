# Makefile

all:
	cd skel; $(MAKE) $@
	cd samples; $(MAKE) $@
	-cd docs; $(MAKE) $@

clean:
	-cd skel; $(MAKE) $@
	-cd samples; $(MAKE) $@
	-cd docs; $(MAKE) $@
