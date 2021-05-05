/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/sprite.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />

//  Pong
//
//  A very basic example of using Euskit.
//
//  Some parts are made intentionally simplistic to
//  facilitate the understanding.
//


//  Paddle
//
class Paddle extends Entity {

    bounds = new Rect(-20,-5,40,10);
    screen: Rect;               // Screen bounds.
    vx: number;                 // Moving direction.

    constructor(screen: Rect) {
        // Initializes the position and shape.
        super(screen.anchor('s').move(0,-20));
        this.sprites = [new RectSprite('green', this.bounds)];
        this.collider = this.bounds;
        this.screen = screen;
        this.vx = 0;
    }

    onTick() {
        super.onTick();
        // Updates the position.
        let pos = this.pos.move(this.vx*4, 0);
        let bounds = this.bounds.add(pos);
        if (0 <= bounds.x && bounds.x1() <= this.screen.x1()) {
            this.pos = pos;
        }
    }
}


//  Ball
//
class Ball extends Entity {

    bounds = new Rect(-5,-5,10,10);
    screen: Rect;               // Screen bounds.
    v: Vec2;                    // Moving direction.

    constructor(screen: Rect) {
        // Initializes the position and shape.
        super(screen.center());
        this.sprites = [new OvalSprite('white', this.bounds)];
        this.collider = this.bounds;
        this.screen = screen;
        this.v = new Vec2(rnd(2)*8-4, -4);
    }

    onTick() {
        super.onTick();
        // Updates the position.
        let pos = this.pos.add(this.v);
        let bounds = this.bounds.add(pos);
        if (bounds.x < 0 || this.screen.x1() < bounds.x1()) {
            APP.playSound('beep');
            this.v.x = -this.v.x;
        }
        if (bounds.y < 0) {
            APP.playSound('beep');
            this.v.y = -this.v.y;
        }
        this.pos = this.pos.add(this.v);
    }

    onCollided(entity: Entity) {
        // Bounces when hit the paddle.
        if (entity instanceof Paddle) {
            APP.playSound('beep');
            this.v.y = -4;
        }
    }
}


//  Pong
//
class Pong extends GameScene {

    paddle: Paddle;
    ball: Ball;

    onStart() {
        super.onStart();
        console.info("pong.start");
        // Places the objects.
        this.paddle = new Paddle(this.screen);
        this.add(this.paddle);
        this.ball = new Ball(this.screen);
        this.add(this.ball);
    }

    onTick() {
        super.onTick();
        // Restarts when the ball goes out of screen.
        if (this.screen.height < this.ball.pos.y) {
            this.reset();
        }
    }

    onDirChanged(v: Vec2) {
        // Changes the paddle direction.
        this.paddle.vx = v.x;
    }

    render(ctx: CanvasRenderingContext2D) {
        // Paints the background.
        ctx.fillStyle = 'rgb(0,0,64)';
        fillRect(ctx, this.screen);
        // Paints everything else.
        super.render(ctx);
    }
}


// main: sets up the browser interaction.
function main() {
    APP = new App(320, 240);
    APP.init(new Pong());
}
