/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
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

    screen: Rect;		// Screen bounds.
    vx: number;			// Moving direction.

    constructor(screen: Rect) {
	// Initializes the position and shape.
	super(screen.anchor(0,-1).move(0,-20));
	let bounds = new Rect(-20,-5,40,10);
	this.imgsrc = new FillImageSource('green', bounds);
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


//  Ball
//
class Ball extends Entity {

    screen: Rect;		// Screen bounds.
    v: Vec2;			// Moving direction.

    constructor(screen: Rect) {
	// Initializes the position and shape.
	super(screen.center());
	let bounds = new Rect(-5,-5,10,10);
	this.imgsrc = new FillImageSource('white', bounds);
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

    collidedWith(entity: Entity) {
	// Bounces when hit the paddle.
	if (entity instanceof Paddle) {
	    this.v.y = -4;
	}
    }
}


//  Pong
//
class Pong extends GameScene {

    paddle: Paddle;
    ball: Ball;

    init() {
	super.init();
	// Places the objects.
	this.paddle = new Paddle(this.screen);
	this.addObject(this.paddle);
	this.ball = new Ball(this.screen);
	this.addObject(this.ball);
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
