# Makefile

all:
	cd platformer; $(MAKE) $@
	cd pong; $(MAKE) $@
	cd shooter; $(MAKE) $@
	cd skel; $(MAKE) BASEDIR=$(PWD)/../base $@

clean:
	-cd platformer; $(MAKE) $@
	-cd pong; $(MAKE) $@
	-cd shooter; $(MAKE) $@
	-cd skel; $(MAKE) BASEDIR=$(PWD)/../base $@
