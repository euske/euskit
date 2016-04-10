#!/usr/bin/env python

# image manipulation

import sys
import pygame

def main(argv):
    import getopt
    def usage():
        print ('usage: %s [-d] [-o output] [file ...]' % argv[0])
        return 100
    try:
        (opts, args) = getopt.getopt(argv[1:], 'do:')
    except getopt.GetoptError:
        return usage()
    debug = 0
    output = 'out.png'
    for (k, v) in opts:
        if k == '-d': debug += 1
        elif k == '-o': output = v
    #
    path = args.pop(0)
    img = pygame.image.load(path)
    (width,height) = img.get_size()
    for y in xrange(height):
        for x in xrange(width):
            c = img.get_at((x,y))
            if c == (0,0,0):
                c = (255,255,255)
            img.set_at((x,y), c)
    pygame.image.save(img, output)
    return 0

if __name__ == '__main__': sys.exit(main(sys.argv))
