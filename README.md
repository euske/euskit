Euskit
======

Euskit is a game engine designed for game jams.
It is suitable for quick prototyping of 2D games.

When participating a jam, you don't wanna spend the first three hours
for basic plumbing stuff, and your finished game gotta be lean and
playable with a minimal requirement. With Euskit, you can get a simple
game up and running with just 200 lines of code. And it's pretty darn
lightweight. Everyone can play it on a browser. Plus it's written in
TypeScript, so you don't have to sweat in the last minutes while
you're making a tiny change which has a typo and causes the entire
program flooded with `NaN` or `undefined`.  It only supports old-timey
2D games, but hey, I can be opinionated, right?

By the way, there's no special editor or metadata needed.  You only
need Emacs (or vim) for writing a game (other than `tsc` of course).
Everything is simple and straightforward and transparent, and there's
absolutely no magic OH GOD I HATE MAGIC. The library is standalone,
i.e. there's no external dependency, no `node_modules` hell or webpack
crap either. A compiled game is just one `.js` file and one `.html`
file (and pngs and mp3s when you need them).  I've created more than
50 games with this thing, so this isn't entirely a pipe dream. And you
can do it too.

This engine was named by Mr. Rat King.

 * HTML5 + TypeScript.
 * Good for old-school pixel art games.
 * <a href="https://euske.github.io/euskit/quickref.html">Simple and straightforward API</a>.

Samples
-------

These games are actually playable.
Click the "(Code)" to see the actual source code.
Be amazed at how it's simple and straightforward.

 * <a href="https://euske.github.io/euskit/samples/pong/index.html"><img src="https://euske.github.io/euskit/samples/pong/gameplay.gif" width="160" height="120" alt="Pong"> Pong</a> <a href="https://github.com/euske/euskit/blob/master/samples/pong/src/game.ts">(Code)</a>
 * <a href="https://euske.github.io/euskit/samples/shooter/index.html"><img src="https://euske.github.io/euskit/samples/shooter/gameplay.gif" width="160" height="120" alt="Shoter"> Shooter</a> <a href="https://github.com/euske/euskit/blob/master/samples/shooter/src/game.ts">(Code)</a>
 * <a href="https://euske.github.io/euskit/samples/racing/index.html"><img src="https://euske.github.io/euskit/samples/racing/gameplay.gif" width="128" height="160" alt="Racing"> Racing</a> <a href="https://github.com/euske/euskit/blob/master/samples/racing/src/game.ts">(Code)</a>
 * <a href="https://euske.github.io/euskit/samples/maze/index.html"><img src="https://euske.github.io/euskit/samples/maze/gameplay.gif" width="160" height="120" alt="Maze"> Maze</a> <a href="https://github.com/euske/euskit/blob/master/samples/maze/src/game.ts">(Code)</a>
 * <a href="https://euske.github.io/euskit/samples/platformer/index.html"><img src="https://euske.github.io/euskit/samples/platformer/gameplay.gif" width="160" height="120" alt="Platformer"> Platformer</a> <a href="https://github.com/euske/euskit/blob/master/samples/platformer/src/game.ts">(Code)</a>
 * <a href="https://euske.github.io/euskit/samples/pseudo3d/index.html"><img src="https://euske.github.io/euskit/samples/pseudo3d/gameplay.gif" width="160" height="120" alt="Pseudo3d"> Pseudo3d</a> <a href="https://github.com/euske/euskit/blob/master/samples/pseudo3d/src/game.ts">(Code)</a>
 * <a href="https://euske.github.io/euskit/samples/adventure/index.html"><img src="https://euske.github.io/euskit/samples/adventure/gameplay.gif" width="160" height="120" alt="Adventure"> Adventure</a> <a href="https://github.com/euske/euskit/blob/master/samples/adventure/src/game.ts">(Code)</a>
 * <a href="https://euske.github.io/euskit/samples/scramble/index.html"><img src="https://euske.github.io/euskit/samples/scramble/gameplay.gif" width="160" height="120" alt="Scramble"> Scramble</a> <a href="https://github.com/euske/euskit/blob/master/samples/scramble/src/game.ts">(Code)</a>

Documents
---------
Still work in progress...

 * <a href="https://euske.github.io/euskit/userguide.html">User Guide</a>
 * <a href="https://euske.github.io/euskit/quickref.html">Quick Reference</a>
 * <a href="https://euske.github.io/euskit/cheatsheet.html">Cheat Sheet</a>

Prerequisites
-------------
 * TypeScript
 * (Optional) GNU Make
 * (Optional) TypeDoc http://typedoc.org/
