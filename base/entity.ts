/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="tilemap.ts" />

function getContact(collider0: Shape, v: Vec2, colliders: Shape[], bounds: Rect[])
{
    if (colliders !== null) {
	for (let collider1 of colliders) {
	    v = collider0.contact(v, collider1);
	}
    }
    if (bounds !== null) {
	for (let rect of bounds) {
	    v = collider0.contactBounds(v, rect);
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
    lifetime: number = Infinity;
    time0: number = 0;
    time: number = 0;
    died: Slot;

    constructor(lifetime=Infinity) {
	this.lifetime = lifetime;
	this.died = new Slot(this);
    }

    toString() {
	return '<Task: time='+this.time+'>';
    }
  
    start(layer: Layer) {
	this.layer = layer;
	this.time0 = layer.time;
	this.time = 0;
    }

    tick(t: number) {
	this.update();
	this.time = t - this.time0;
	if (this.alive && this.lifetime <= this.time) {
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

    pos: Vec2;
    bounds: Rect;
    imgsrc: ImageSource;
    visible: boolean = true;
    zOrder: number = 0;
    scale: Vec2 = new Vec2(1, 1);
    rotation: number = 0;

    constructor(pos: Vec2=null, bounds: Rect=null, imgsrc: ImageSource=null) {
	super();
	this.pos = (pos !== null)? pos.copy() : null;
	this.bounds = bounds;
	this.imgsrc = imgsrc;
    }
    
    toString() {
	return '<Sprite: '+this.pos+'>';
    }
  
    movePos(v: Vec2) {
	// [OVERRIDE]
	if (this.pos !== null) {
	    this.pos = this.pos.add(v);
	}
    }

    getBounds() {
	return this.bounds.add(this.pos);
    }
  
    update() {
	// [OVERRIDE]
	super.update();
    }
  
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	// [OVERRIDE]
	if (this.pos === null) return;
	if (this.bounds === null) return;
	ctx.save();
	ctx.translate(bx+this.pos.x, by+this.pos.y);
	if (this.rotation) {
	    ctx.rotate(this.rotation);
	}
	if (this.imgsrc instanceof DummyImageSource) {
	    ctx.fillStyle = (this.imgsrc as DummyImageSource).color;
	    ctx.fillRect(this.bounds.x, this.bounds.y,
			 this.bounds.width, this.bounds.height);
	} else if (this.imgsrc instanceof HTMLImageSource) {
	    let src = (this.imgsrc as HTMLImageSource).bounds;
	    let offset = (this.imgsrc as HTMLImageSource).offset;
	    drawImageScaled(
		ctx, (this.imgsrc as HTMLImageSource).image,
		src.x, src.y, src.width, src.height,
		this.bounds.x-offset.x, this.bounds.y-offset.y,
		this.bounds.width*this.scale.x,
		this.bounds.height*this.scale.y);
	}
	ctx.restore();
    }

}


//  TiledSprite
//  Displays a tiled image repeatedly.
//
class TiledSprite extends Sprite {

    offset: Vec2 = new Vec2();
    
    constructor(bounds: Rect, imgsrc: ImageSource) {
	super(null, bounds, imgsrc);
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
		ctx.drawImage(
		    imgsrc.image, imgsrc.bounds.x,
		    imgsrc.bounds.y, w, h,
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
	super(null, bounds, imgsrc);
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
	for (let star of this._stars) {
	    star.p.x += this.velocity.x/star.z;
	    star.p.y += this.velocity.y/star.z;
	    let rect = star.p.expand(star.s, star.s);
	    if (!this.bounds.overlapsRect(rect)) {
		star.init(this.maxdepth);
		star.p = this.bounds.modpt(star.p);
	    }
	}
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	bx += this.bounds.x;
	by += this.bounds.y;
	for (let star of this._stars) {
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

    collider: Shape;

    constructor(pos: Vec2=null, bounds: Rect=null,
		imgsrc: ImageSource=null, collider: Shape=null) {
	super(pos, bounds, imgsrc);
	this.collider = collider;
    }

    toString() {
	return '<Entity: '+this.collider+'>';
    }

    collide(entity: Entity) {
	// [OVERRIDE]
    }

    getCollider() {
	return this.collider.add(this.pos);
    }
  
    moveIfPossible(v: Vec2, force: boolean) {
	this.movePos(this.getMove(this.pos, v, force));
    }
    
    isMovable(v0: Vec2) {
	if (this.collider !== null) {
	    let v1 = this.getMove(this.pos, v0, true);
	    return v1.equals(v0);
	} else {
	    return true;
	}
    }

    getMove(pos: Vec2, v: Vec2, force: boolean) {
	if (this.collider === null) return v;
	let collider = this.collider.add(pos);
	let hitbox0 = collider.getAABB();
	let range = hitbox0.union(hitbox0.add(v));
	let obstacles = this.getObstaclesFor(range, force);
	let fences = this.getFencesFor(range, force);
	let d = getContact(collider, v, obstacles, fences);
	v = v.sub(d);
	collider = collider.add(d);
	if (v.x != 0) {
	    d = getContact(collider, new Vec2(v.x, 0), obstacles, fences);
	    v = v.sub(d);
	    collider = collider.add(d);
	}
	if (v.y != 0) {
	    d = getContact(collider, new Vec2(0, v.y), obstacles, fences);
	    v = v.sub(d);
	    collider = collider.add(d);
	}
	let hitbox1 = collider.getAABB();
	return new Vec2(hitbox1.x-hitbox0.x,
			hitbox1.y-hitbox0.y);
    }
  
    getObstaclesFor(range: Rect, force: boolean): Shape[] {
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

    constructor(pos: Vec2, bounds: Rect, imgsrc: ImageSource,
		collider: Shape=null, movement: Vec2=null, frame: Rect=null) {
	super(pos, bounds, imgsrc, collider);
	this.movement = movement;
	this.frame = frame;
    }

    update() {
	super.update();
	if (this.movement !== null) {
	    this.movePos(this.movement);
	    if (this.frame !== null &&
		!this.getCollider().overlaps(this.frame)) {
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
    
    constructor(pos: Vec2, bounds: Rect,
		imgsrc: ImageSource=null, collider: Shape=null) {
	super(pos, bounds, imgsrc, collider);
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
	    let v = new Vec2(this.velocity.x, vy);
	    this.velocity = this.getMove(this.pos, v, false);
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

    constructor(tilemap: TileMap, pos: Vec2, bounds: Rect,
		imgsrc: ImageSource=null, collider: Shape=null) {
	super(pos, bounds, imgsrc, collider);
	this.tilemap = tilemap;
    }
    
    isHolding() {
	let range = this.getCollider().getAABB();
	return (this.tilemap.findTile(this.tilemap.isGrabbable, range) !== null);
    }

    getObstaclesFor(range: Rect, force: boolean): Rect[] {
	let f = ((force || this.isHolding())?
		 this.tilemap.isObstacle :
		 this.tilemap.isStoppable);
	return this.tilemap.getTileRects(f, range);
    }
  
}
