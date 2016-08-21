Euskit
======

A minimalistic HTML5 framework for 2D games written in TypeScript.
(The name was suggested by Mr. Rat King)

Features
--------
 * Suitable for old-school pixel art games.
 * Simple and straightforward API.

Prerequisites
-------------
 * TypeScript compiler
 * Unix system (GNU Make) to build.

API Documentation
-----------------

Here are the <a href="http://euske.github.io/euskit/docs/api.html">API docs</a>.

Example: Pong
--------------

Here's a sample code for <a href="http://euske.github.io/euskit/samples/pong/index.html">Pong</a>:

```typescript
class Paddle extends Entity {

    screen: Rect;               // Screen bounds.
    vx: number;                 // Moving direction.

    constructor(screen: Rect) {
        // Initializes the position and shape.
        super(screen.anchor(0,-1).move(0,-20));
        let bounds = new Rect(-20,-5,40,10);
        this.imgsrc = new DummyImageSource('green', bounds);
        this.collider = bounds;
        this.screen = screen;
        this.vx = 0;
    }

    update() {
        // Updates the position.
        let pos = this.pos.move(this.vx*4, 0);
        let bounds = this.getBounds(pos);
        if (0 <= bounds.x && bounds.right() <= this.screen.right()) {
            this.pos = pos;
        }
    }
}

class Ball extends Entity {

    screen: Rect;               // Screen bounds.
    v: Vec2;                    // Moving direction.

    constructor(screen: Rect) {
        // Initializes the position and shape.
        super(screen.center());
        let bounds = new Rect(-5,-5,10,10);
        this.imgsrc = new DummyImageSource('white', bounds);
        this.collider = bounds;
        this.screen = screen;
        this.v = new Vec2(rnd(2)*8-4, -4);
    }

    update() {
        // Updates the position.
        let pos = this.pos.add(this.v);
        let bounds = this.getBounds(pos);
        if (bounds.x < 0 || this.screen.right() < bounds.right()) {
            this.v.x = -this.v.x;
        }
        if (bounds.y < 0) {
            this.v.y = -this.v.y;
        }
        this.pos = this.pos.add(this.v);
    }

    collide(entity: Entity) {
        // Bounces when hit the paddle.
        if (entity instanceof Paddle) {
            this.v.y = -4;
        }
    }
}

class Pong extends GameScene {

    paddle: Paddle;
    ball: Ball;

    init() {
        super.init();
        // Places the objects.
        this.paddle = new Paddle(this.screen);
        this.add(this.paddle);
        this.ball = new Ball(this.screen);
        this.add(this.ball);
    }

    tick(t: number) {
        super.tick(t);
        // Restarts when the ball goes out of screen.
        if (this.screen.height < this.ball.pos.y) {
            this.init();
        }
    }

    setDir(v: Vec2) {
        // Changes the paddle direction.
        this.paddle.vx = v.x;
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
        // Paints the background.
        ctx.fillStyle = 'rgb(0,0,64)';
        ctx.fillRect(bx, by, this.screen.width, this.screen.height);
        // Paints everything else.
        super.render(ctx, bx, by);
    }
}
```

Here's the HTML for it:

```html
<!DOCTYPE html>
<html><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Pong</title>
<script language="javascript" src="js/game.js"></script>
<body bgcolor="black" text="white" onload="main(Pong);">
<h1 align=center>Pong</h1>
<div style="margin: 1em;" align=center>
  <div style="position:relative; width:640px; height:480px;">
    <canvas id="game" 
            style="position:absolute; top:0; left:0; background:gray;"
            width="640" height="480"></canvas>
  </div>
</div>
<div style="display:none;">
  <img id="font" src="assets/font.png">
</div>
</body>
```

Terms and Conditions
--------------------

(This is so-called MIT/X License)

Copyright (c) 2015-2016  Yusuke Shinyama

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
