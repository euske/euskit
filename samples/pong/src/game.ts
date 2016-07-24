// pong.ts

class Paddle extends Entity {

    screen: Rect;		// Screen bounds.
    vx: number;			// Moving direction.

    constructor(screen: Rect) {
	// Initializes the position and color.
	let bounds = screen.anchor(0,-1).move(0,-20).expand(40,10);
	super(bounds, new DummyImageSource('green'), bounds);
	this.screen = screen;
	this.vx = 0;
    }

    update() {
	// Updates the position.
	this.bounds = this.bounds.move(this.vx*4, 0).clamp(this.screen);
	this.collider = this.bounds;
    }
}

class Ball extends Entity {

    screen: Rect;		// Screen bounds.
    v: Vec2;			// Moving direction.

    constructor(screen: Rect) {
	// Initializes the position and color.
	let bounds = screen.center().expand(10,10);
	super(bounds, new DummyImageSource('white'), bounds);
	this.screen = screen;
	this.v = new Vec2(4,4);
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
	this.collider = this.bounds;
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
	// Initializes the objects.
	super.init();
	this.paddle = new Paddle(this.screen);
	this.addObject(this.paddle);
	this.ball = new Ball(this.screen);
	this.addObject(this.ball);
    }

    setDir(v: Vec2) {
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
