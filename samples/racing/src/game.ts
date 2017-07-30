/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/tilemap.ts" />
/// <reference path="../../../base/animation.ts" />
/// <reference path="../../../base/app.ts" />

//  Racing
//
//  A simple racing game with a circular map.
//


//  Initialize the resources.
let FONT: Font;
let SPRITES:ImageSpriteSheet;
addInitHook(() => {
    FONT = new Font(APP.images['font'], 'white');
    SPRITES = new ImageSpriteSheet(
	APP.images['sprites'], new Vec2(16,32), new Vec2(0,0));
});


//  Player
//
class Player extends Entity {

    scene: Racing;
    usermove: Vec2 = new Vec2();
    alive: boolean = true;

    constructor(scene: Racing, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.imgsrc = SPRITES.get(0, 0, 1, 1, new Vec2(8,8));
	this.collider = this.imgsrc.getBounds();
    }

    update() {
	super.update();
	if (this.alive) {
	    this.moveIfPossible(this.usermove);
	}
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(4);
    }
    
    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	// Restrict its position within the screen.
	return [this.scene.screen];
    }
}


//  Track
//  Random generated track with a bridge.
//
const FLOOR = 1;
const WATER = 2;
const GREEN = 3;
class Track extends TileMap {
    
    offset: number;
    brx: number;		// Bridge position
    brw: number;		// Bridge width
    brmw: number;		// Bridge maximum width
    bre: number;		// Bridge background

    constructor(width: number, height: number) {
	let map = [] as Int32Array[];
	for (let y = 0; y < height; y++) {
	    map.push(new Int32Array(width).fill(FLOOR));
	}
	super(16, width, height, map);
	this.offset = 0;
	this.brx = 1;
	this.brw = width-2;
	this.brmw = width;
	this.bre = WATER;
    }

    // isFloor: returns true if there's a floor below the car.
    isFloor(rect: Rect) {
	return this.findTileByCoord((c:number) => { return c == FLOOR; }, rect);
    }
    
    proceed(speed: number) {
	this.offset += speed;
	if (16 <= this.offset) {
	    let dy = (this.offset % 16);
	    let dh = int((this.offset-dy)/16);
	    this.shift(0, dh);
	    // Generate new tiles.
	    for (let y = 0; y < dh; y++) {
		for (let x = 0; x < this.width; x++) {
		    this.set(x, y, this.bre);
		}
		for (let dx = 0; dx < this.brw; dx++) {
		    this.set(this.brx+dx, y, FLOOR);
		}
		if (4 <= this.brw) {
		    this.set(rnd(this.width), y, this.bre);
		}
		if (rnd(10) == 0) {
		    this.bre = (this.bre == WATER)? GREEN : WATER;
		}
		if (rnd(10) == 0) {
		    this.brw += rnd(3)-1;
		    this.brw = clamp(2, this.brw, this.brmw);
		    this.brx = clamp(0, this.brx, this.brmw-this.brw);
		} else {
		    this.brx += rnd(3)-1;
		    this.brx = clamp(0, this.brx, this.brmw-this.brw);
		}
	    }
	    this.offset = dy;
	}
    }

    render(ctx: CanvasRenderingContext2D) {
	// Render the background.
	ctx.save();
	ctx.translate(0, -32+this.offset);
	this.renderFromTopRight(
	    ctx, (x,y,c) => { return (c == FLOOR)? null : SPRITES.get(c); });
	// Render the bridge.
	this.renderFromTopRight(
	    ctx, (x,y,c) => { return (c != FLOOR)? null : SPRITES.get(c); });
	ctx.restore();
    }
}


//  Racing
// 
class Racing extends GameScene {

    player: Player;
    track: Track;
    
    score: number;
    scoreBox: TextBox;
    highScore: number;
    highScoreBox: TextBox;

    constructor() {
	super();
	this.scoreBox = new TextBox(this.screen.inflate(-2,-2), FONT);
	this.highScoreBox = new TextBox(this.screen.inflate(-2,-2), FONT);
	this.highScore = -1;
    }
    
    init() {
	super.init();
	
	this.player = new Player(this, this.screen.center());
	this.add(this.player);

	this.track = new Track(int(this.screen.width/16),
			       int(this.screen.height/16)+2);

	this.score = 0;
	this.updateScore();
	APP.setMusic('music', 0, 19.1);
    }

    update() {
	super.update();
	if (this.player.alive) {
	    let b = this.player.getCollider().move(0, this.track.offset) as Rect;
	    if (this.track.isFloor(b)) {
		let speed = int((1.0-this.player.pos.y/this.screen.height)*16);
		this.track.proceed(speed);
		this.score += int(lowerbound(0, Math.sqrt(speed)-2));
		this.updateScore();
	    } else {
		this.player.alive = false;
		let blinker = new Blinker(this.player.sprite);
		blinker.interval = 0.2;
		blinker.lifetime = 1.0;
		blinker.stopped.subscribe(() => { this.init(); });
		this.add(blinker);
		APP.setMusic();
		APP.playSound('plunge');
	    }
	}
    }

    onDirChanged(v: Vec2) {
	this.player.setMove(v);
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(this.screen.x, this.screen.y,
		     this.screen.width, this.screen.height);
	this.track.render(ctx);
	super.render(ctx);
	this.scoreBox.render(ctx);
	this.highScoreBox.render(ctx);
    }

    updateScore() {
	this.scoreBox.clear();
	this.scoreBox.putText([this.score.toString()]);
	if (this.highScore < this.score) {
	    this.highScore = this.score;
	    this.highScoreBox.clear();
	    this.highScoreBox.putText([this.highScore.toString()], 'right');
	}
    }
}
