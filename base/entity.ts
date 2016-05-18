/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="tilemap.ts" />

function getContact(hitbox: Rect, v: Vec2, rects: Rect[], rectsWithin: Rect[])
{
    if (rects !== null) {
	for (let i = 0; i < rects.length; i++) {
	    v = hitbox.contact(v, rects[i]);
	}
    }
    if (rectsWithin !== null) {
	for (let i = 0; i < rectsWithin.length; i++) {
	    v = hitbox.contactWithin(v, rectsWithin[i]);
	}
    }
    return v;
}


//  Task
//  A single procedure that runs at each frame.
//
class Task {

    alive: boolean = true;
    layer: Layer = null;
    ticks: number = 0;
    lifetime: number = Infinity;
    died: Slot;

    constructor() {
	this.died = new Slot(this);
    }

    toString() {
	return '<Task: ticks='+this.ticks+'>';
    }
  
    start(layer: Layer) {
	this.layer = layer;
	this.ticks = 0;
    }

    tick() {
	this.ticks++;
	this.update();
	if (this.alive && this.lifetime < this.ticks) {
	    this.die();
	}
    }
  
    die() {
	this.alive = false;
	this.died.signal();
    }
  
    update() {
	// [OVERRIDE]
    }

}


//  Sprite
//  A moving object that doesn't interact.
//
class Sprite extends Task {

    bounds: Rect;
    imgsrc: ImageSource;
    visible: boolean = true;
    zOrder: number = 0;
    scale: Vec2 = new Vec2(1, 1);

    constructor(bounds: Rect, imgsrc: ImageSource=null) {
	super();
	this.bounds = (bounds)? bounds.copy() : null;
	this.imgsrc = imgsrc;
    }
    
    toString() {
	return '<Sprite: '+this.bounds+'>';
    }
  
    movePos(v: Vec2) {
	// [OVERRIDE]
	this.bounds = this.bounds.add(v);
    }
  
    update() {
	// [OVERRIDE]
	super.update();
    }
  
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	// [OVERRIDE]
	let w = this.bounds.width;
	let h = this.bounds.height;
	if (this.imgsrc instanceof DummyImageSource) {
	    ctx.fillStyle = (this.imgsrc as DummyImageSource).color;
	    ctx.fillRect(bx+this.bounds.x, by+this.bounds.y, w, h);
	} else if (this.imgsrc instanceof HTMLImageSource) {
	    let rect = (this.imgsrc as HTMLImageSource).bounds;
	    let offset = (this.imgsrc as HTMLImageSource).offset;
	    drawImageScaled(ctx, (this.imgsrc as HTMLImageSource).image,
			    rect.x, rect.y, rect.width, rect.height,
			    bx+this.bounds.x-offset.x, by+this.bounds.y-offset.y,
			    w*this.scale.x, h*this.scale.y);
	}
    }

}


//  TiledSprite
//  Displays a tiled image repeatedly.
//
class TiledSprite extends Sprite {

    offset: Vec2 = new Vec2();
    
    constructor(bounds: Rect, imgsrc: ImageSource) {
	super(bounds, imgsrc);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	bx += this.bounds.x;
	by += this.bounds.y;
	ctx.save();
	ctx.beginPath();
	ctx.rect(bx, by, this.bounds.width, this.bounds.height);
	ctx.clip();
	let imgsrc = this.imgsrc as HTMLImageSource;
	let w = imgsrc.bounds.width;
	let h = imgsrc.bounds.height;
	let dx0 = int(Math.floor(this.offset.x/w)*w - this.offset.x);
	let dy0 = int(Math.floor(this.offset.y/h)*h - this.offset.y);
	for (let dy = dy0; dy < this.bounds.height; dy += h) {
	    for (let dx = dx0; dx < this.bounds.width; dx += w) {
		ctx.drawImage(imgsrc.image, imgsrc.bounds.x, imgsrc.bounds.y, w, h,
			      bx+dx, by+dy, w, h);
	    }
	}
	ctx.restore();
    }

}


//  StarSprite
//
class Star {
    z: number;
    s: number;
    p: Vec2;
    init(maxdepth: number) {
	this.z = Math.random()*maxdepth+1;
	this.s = (Math.random()*2+1) / this.z;
    }
}
class StarSprite extends Sprite {
    
    velocity: Vec2;
    maxdepth: number;
    
    private _stars: Star[] = [];

    constructor(bounds: Rect, imgsrc: ImageSource, nstars: number,
		velocity=new Vec2(-1,0), maxdepth=3) {
	super(bounds, imgsrc);
	this.velocity = velocity;
	this.maxdepth = maxdepth;
	for (let i = 0; i < nstars; i++) {
	    let star = new Star();
	    star.init(this.maxdepth);
	    star.p = this.bounds.rndpt();
	    this._stars.push(star);
	}
    }

    update() {
	super.update();
	for (let i = 0; i < this._stars.length; i++) {
	    let star = this._stars[i];
	    star.p.x += this.velocity.x/star.z;
	    star.p.y += this.velocity.y/star.z;
	    let rect = star.p.expand(star.s, star.s);
	    if (!this.bounds.overlaps(rect)) {
		star.init(this.maxdepth);
		star.p = this.bounds.modpt(star.p);
	    }
	}
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	bx += this.bounds.x;
	by += this.bounds.y;
	for (let i = 0; i < this._stars.length; i++) {
	    let star = this._stars[i];
	    let dst = star.p.expand(star.s, star.s);
	    if (this.imgsrc instanceof DummyImageSource) {
		ctx.fillStyle = (this.imgsrc as DummyImageSource).color;
		ctx.fillRect(bx+dst.x, by+dst.y, dst.width, dst.height);
	    } else if (this.imgsrc instanceof HTMLImageSource) {
		let rect = (this.imgsrc as HTMLImageSource).bounds;
		let offset = (this.imgsrc as HTMLImageSource).offset;
		drawImageScaled(ctx, (this.imgsrc as HTMLImageSource).image,
				rect.x, rect.y, rect.width, rect.height,
				bx+dst.x-offset.x, by+dst.y-offset.y,
				dst.width*this.scale.x, dst.height*this.scale.y);
	    }
	}
    }
}


//  Entity
//  A character that can interact with other characters.
//
class Entity extends Sprite {

    hitbox: Rect;

    constructor(bounds: Rect, imgsrc: ImageSource=null, hitbox: Rect=null) {
	super(bounds, imgsrc);
	this.hitbox = (hitbox)? hitbox.copy() : null;
    }

    toString() {
	return '<Entity: '+this.hitbox+'>';
    }

    collide(entity: Entity) {
	// [OVERRIDE]
    }

    moveIfPossible(v: Vec2, force: boolean) {
	this.movePos(this.getMove(v, this.hitbox, force));
    }
    
    movePos(v: Vec2) {
	super.movePos(v);
	if (this.hitbox !== null) {
	    this.hitbox = this.hitbox.add(v);
	}
    }

    isMovable(v0: Vec2) {
	if (this.hitbox !== null) {
	    let v1 = this.getMove(v0, this.hitbox, true);
	    return v1.equals(v0);
	} else {
	    return true;
	}
    }

    getMove(v: Vec2, hitbox: Rect, force: boolean) {
	if (hitbox === null) return v;
	let range = hitbox.union(hitbox.add(v));
	let obstacles = this.getObstaclesFor(range, force);
	let fences = this.getFencesFor(range, force);
	let d = getContact(hitbox, v, obstacles, fences);
	v = v.sub(d);
	hitbox = hitbox.add(d);
	if (v.x != 0) {
	    d = getContact(hitbox, new Vec2(v.x, 0), obstacles, fences);
	    v = v.sub(d);
	    hitbox = hitbox.add(d);
	}
	if (v.y != 0) {
	    d = getContact(hitbox, new Vec2(0, v.y), obstacles, fences);
	    v = v.sub(d);
	    hitbox = hitbox.add(d);
	}
	return new Vec2(hitbox.x-this.hitbox.x,
			hitbox.y-this.hitbox.y);
    }
  
    getObstaclesFor(range: Rect, force: boolean): Rect[] {
	// [OVERRIDE]
	return null;
    }
  
    getFencesFor(range: Rect, force: boolean): Rect[] {
	// [OVERRIDE]
	return null;
    }

}


//  Projectile
// 
class Projectile extends Entity {
    
    movement: Vec2 = new Vec2();
    frame: Rect;

    constructor(bounds: Rect, imgsrc: ImageSource, hitbox: Rect=null,
		movement: Vec2=null, frame: Rect=null) {
	super(bounds, imgsrc, hitbox);
	this.movement = movement;
	this.frame = frame;
    }

    update() {
	super.update();
	if (this.movement !== null) {
	    this.moveIfPossible(this.movement, true);
	    if (this.frame !== null &&
		!this.hitbox.overlaps(this.frame)) {
		this.die();
	    }
	}
    }
}


//  PhysicalEntity
//
interface JumpFunc {
    (vy:number, t:number): number;
}
class PhysicalEntity extends Entity {

    velocity: Vec2 = new Vec2();
    maxspeed: Vec2 = new Vec2(6,6);
    jumpfunc: JumpFunc;
    
    protected _jumpt: number;
    protected _jumpend: number;
    protected _landed: boolean;
    
    constructor(bounds: Rect, imgsrc: ImageSource=null, hitbox: Rect=null) {
	super(bounds, imgsrc, hitbox);
	this._jumpt = Infinity;
	this._jumpend = 0;
	this._landed = false;
	this.jumpfunc = (
	    (vy:number, t:number) => { return (0 <= t && t <= 5)? -4 : vy+1; }
	);
    }

    setJumpFunc(jumpfunc: JumpFunc) {
	this.jumpfunc = jumpfunc;
    }

    setJump(jumpend: number) {
	if (0 < jumpend) {
	    if (this.isLanded()) {
		this.jump();
		this._jumpt = 0;
	    }
	}
	this._jumpend = jumpend;
    }

    update() {
	super.update();
	this.fall();
	if (this._jumpt < this._jumpend) {
	    this._jumpt++;
	} else {
	    this._jumpt = Infinity;
	}
    }
  
    fall() {
	if (!this.isHolding()) {
	    let vy = this.jumpfunc(this.velocity.y, this._jumpt);
	    this.velocity = this.getMove(new Vec2(this.velocity.x, vy), this.hitbox, false);
	    this.movePos(this.velocity);
	    let landed = (0 < vy && this.velocity.y == 0);
	    if (!this._landed && landed) {
		this.land();
	    }
	    this._landed = landed;
	}
    }

    land() {
	// [OVERRIDE]
    }

    jump() {
	// [OVERRIDE]
    }

    isLanded() {
	return this._landed;
    }

    isHolding() {
	return false;
    }

}


//  PlatformerEntity
//
class PlatformerEntity extends PhysicalEntity {
    
    tilemap: TileMap;

    constructor(tilemap: TileMap, bounds: Rect,
		imgsrc: ImageSource=null, hitbox: Rect=null) {
	super(bounds, imgsrc, hitbox);
	this.tilemap = tilemap;
    }
    
    isHolding() {
	return (this.tilemap.findTile(this.tilemap.isGrabbable, this.hitbox) !== null);
    }

    getObstaclesFor(range: Rect, force: boolean): Rect[] {
	let f = ((force || this.isHolding())?
		 this.tilemap.isObstacle :
		 this.tilemap.isStoppable);
	return this.tilemap.getTileRects(f, range);
    }
  
}
