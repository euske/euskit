Euskit
======

A minimalistic HTML5 framework for 2D games written in TypeScript.

API Documentation
-----------------

Here are the <a href="http://euske.github.io/euskit/docs/api.html">API docs</a>.

Example: Pong
--------------

Here's a sample code for <a href="http://euske.github.io/euskit/samples/pong.html">Pong</a>:

```typescript
class Paddle extends Entity {

    screen: Rect;               // Screen bounds.
    vx: number;                 // Moving direction.

    constructor(screen: Rect) {
        // Initializes the position and color.
        let bounds = screen.anchor(0,-1).move(0,-20).expand(30,10);
        super(bounds, new DummyImageSource('green'), bounds);
        this.screen = screen;
        this.vx = 0;
    }

    update() {
        // Updates the position.
        this.bounds = this.bounds.move(this.vx*4, 0).clamp(this.screen);
        this.hitbox = this.bounds;
    }
}

class Ball extends Entity {

    screen: Rect;               // Screen bounds.
    v: Vec2;                    // Moving direction.

    constructor(screen: Rect) {
        // Initializes the position and color.
        let bounds = screen.center().expand(10,10);
        super(bounds, new DummyImageSource('white'), bounds);
        this.screen = screen;
        this.v = new Vec2(1,1);
    }

    update() {
        // Updates the position.
        let bounds = this.bounds.add(this.v);
        if (bounds.x < 0 || this.screen.right() < bounds.right()) {
            this.v.x = -this.v.x;
        }
        if (bounds.y < 0 || this.screen.bottom() < bounds.bottom()) {
            this.v.y = -this.v.y;
        }
        this.bounds = this.bounds.add(this.v);
        this.hitbox = this.bounds;
    }

    collide(entity: Entity) {
        // Bounces at the paddle.
        if (entity instanceof Paddle) {
            this.v.y = -1;
        }
    }
}

class Pong extends GameScene {

    paddle: Paddle;
    ball: Ball;

    init() {
        // Initializes the objects.
        super.init();
        this.paddle = new Paddle(this.screen);
        this.addObject(this.paddle);
        this.ball = new Ball(this.screen);
        this.addObject(this.ball);
    }

    set_dir(v: Vec2) {
        // Change the paddle direction.
        this.paddle.vx = v.x;
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
        // Paint the background.
        ctx.fillStyle = 'rgb(0,0,64)';
        ctx.fillRect(bx, by, this.screen.width, this.screen.height);
        super.render(ctx, bx, by);
    }
}
```

And the corresponding HTML:

```html
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Pong</title>
<script language="javascript" src="js/pong.js"></script>
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
