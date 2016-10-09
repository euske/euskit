#!/usr/bin/env python
import sys
import time
import stat
import os.path
import subprocess

def ansi(code, s):
    return ('\033[%dm' % code)+s+'\033[m'

class Watcher:

    def __init__(self, cmd, args):
        self.cmd = cmd
        paths = []
        for arg in args:
            if os.path.isdir(arg):
                for (root,dirs,files) in os.walk(arg):
                    paths.extend( os.path.join(root,name) for name in files )
            elif os.path.isfile(arg):
                paths.append(arg)
            else:
                raise OSError('file not found: %r' % arg)
        self._lastmod = { path:0 for path in paths }
        return

    def run(self, debug=0):
        while True:
            updated = []
            for (path,mtime0) in self._lastmod.items():
                try:
                    mtime1 = os.stat(path)[stat.ST_MTIME]
                    if mtime0 < mtime1:
                        self._lastmod[path] = mtime1
                        updated.append(path)
                except OSError:
                    raise
            if updated:
                if debug:
                    print(self._lastmod, file=sys.stderr)
                print()
                print(ansi(93, '*** updated: %r' % updated))
                self.invoke(updated)
            time.sleep(1)
        return

    def invoke(self, paths):
        popen = subprocess.Popen(self.cmd, shell=True)
        status = popen.wait()
        if status == 0:
            print(ansi(92, '*** succeeded ***'))
        else:
            print(ansi(91, '*** failed (status=%r) ***' % status)+chr(7))
        return

def main(argv):
    import getopt
    def usage():
        print('usage: %s [-d] [-c cmd] [path ...]' % argv[0])
        return 100
    try:
        (opts, args) = getopt.getopt(argv[1:], 'dc:')
    except getopt.GetoptError:
        return usage()
    debug = 0
    cmd = 'make'
    for (k, v) in opts:
        if k == '-d': debug += 1
        elif k == '-c': cmd = v
    watcher = Watcher(cmd, args)
    return watcher.run(debug=debug)

if __name__ == '__main__': sys.exit(main(sys.argv))
