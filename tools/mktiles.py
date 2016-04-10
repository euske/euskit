#!/usr/bin/env python2

# usage: mktiles.py [-o output] gridsize w h

import sys
import pygame

def main(argv):
    import getopt
    def usage():
        print ('usage: %s [-o output] gridsize width [height]' % argv[0])
        return 100
    try:
        (opts, args) = getopt.getopt(argv[1:], 'o:')
    except getopt.GetoptError:
        return usage()
    output = 'out.png'
    for (k, v) in opts:
        if k == '-o': output = v
    #
    if len(args) < 2: return usage()
    gridsize = int(args.pop(0))
    width = int(args.pop(0))
    height = 1
    if args:
        height = int(args.pop(0))
    color1 = (255,255,255)
    color2 = (200,200,200)
    img = pygame.Surface((width*gridsize, height*gridsize), 24)
    for y in xrange(height):
        for x in xrange(width):
            if (x+y)%2 == 0:
                c = color1
            else:
                c = color2
            img.fill(c, (x*gridsize, y*gridsize, gridsize, gridsize))
    pygame.image.save(img, output)
    return 0

if __name__ == '__main__': sys.exit(main(sys.argv))
