/// <reference path="base/utils.ts" />
/// <reference path="base/geom.ts" />
/// <reference path="base/entity.ts" />
/// <reference path="base/text.ts" />
/// <reference path="base/scene.ts" />
/// <reference path="base/app.ts" />
// pong.ts

class Paddle extends Entity {

    screen: Rect;		// Screen bounds.
    vx: number;			// Moving direction.

    constructor(screen: Rect) {
	// Initializes the position and color.
	let pos = screen.anchor(0,-1).move(0,-20);
	let bounds = new Rect(-20,-5,40,10);
	super(pos, bounds, new DummyImageSource('green'), bounds);
	this.screen = screen;
	this.vx = 0;
    }

    update() {
	// Updates the position.
	let pos = this.pos.move(this.vx*4, 0);
	let bounds = this.bounds.add(pos);
	if (0 <= bounds.x && bounds.right() <= this.screen.right()) {
	    this.pos = pos;
	}
    }
}

class Ball extends Entity {

    screen: Rect;		// Screen bounds.
    v: Vec2;			// Moving direction.

    constructor(screen: Rect) {
	// Initializes the position and color.
	let bounds = new Rect(-5,-5,10,10);
	super(screen.center(), bounds, new DummyImageSource('white'), bounds);
	this.screen = screen;
	this.v = new Vec2(4,4);
    }

    update() {
	// Updates the position.
	let pos = this.pos.add(this.v);
	let bounds = this.bounds.add(pos);
	if (bounds.x < 0 || this.screen.right() < bounds.right()) {
	    this.v.x = -this.v.x;
	}
	if (bounds.y < 0) {
	    this.v.y = -this.v.y;
	}
	this.pos = this.pos.add(this.v);
    }

    collide(entity: Entity) {
	// Bounces at the paddle.
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
	this.addObject(this.paddle);
	this.ball = new Ball(this.screen);
	this.addObject(this.ball);
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
