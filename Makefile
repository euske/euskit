# Makefile

all:
	cd src; $(MAKE) all
	cd assets; $(MAKE) all

clean:
	cd src; $(MAKE) clean
	cd assets; $(MAKE) clean
