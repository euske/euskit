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
    imgsrc: ImageSource = null;
    visible: boolean = true;
    zOrder: number = 0;
    scale: Vec2 = new Vec2(1, 1);
    rotation: number = 0;

    constructor(pos: Vec2) {
	super();
	this.pos = pos.copy();
    }
    
    toString() {
	return '<Sprite: '+this.pos+'>';
    }
  
    getBounds(pos: Vec2=null) {
	pos = (pos !== null)? pos : this.pos;
	if (pos !== null && this.imgsrc !== null) {
	    return this.imgsrc.dstRect.add(pos);
	} else {
	    return null;
	}
    }
  
    movePos(v: Vec2) {
	// [OVERRIDE]
	this.pos = this.pos.add(v);
    }

    update() {
	// [OVERRIDE]
	super.update();
    }
  
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	// [OVERRIDE]
	let imgsrc = this.imgsrc
	if (imgsrc !== null) {
	    ctx.save();
	    ctx.translate(bx+this.pos.x, by+this.pos.y);
	    if (this.rotation) {
		ctx.rotate(this.rotation);
	    }
	    let dstRect = imgsrc.dstRect;
	    if (imgsrc instanceof FillImageSource) {
		ctx.fillStyle = imgsrc.color;
		ctx.fillRect(
		    dstRect.x, dstRect.y, dstRect.width, dstRect.height);
	    } else if (imgsrc instanceof HTMLImageSource) {
		let srcRect = imgsrc.srcRect;
		drawImageScaled(
		    ctx, imgsrc.image,
		    srcRect.x, srcRect.y, srcRect.width, srcRect.height,
		    dstRect.x, dstRect.y,
		    dstRect.width*this.scale.x,
		    dstRect.height*this.scale.y);
	    }
	    ctx.restore();
	}
    }

}


//  TiledSprite
//  Displays a tiled image repeatedly.
//
class TiledSprite extends Sprite {

    bounds: Rect;
    offset: Vec2 = new Vec2();
    
    constructor(bounds: Rect) {
	super(new Vec2());
	this.bounds = bounds
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	let imgsrc = this.imgsrc as HTMLImageSource;
	if (imgsrc !== null) {
	    ctx.save();
	    ctx.translate(bx+this.bounds.x, by+this.bounds.y);
	    ctx.beginPath();
	    ctx.rect(0, 0, this.bounds.width, this.bounds.height);
	    ctx.clip();
	    let srcRect = imgsrc.srcRect;
	    let w = imgsrc.dstRect.width;
	    let h = imgsrc.dstRect.height;
	    let dx0 = int(Math.floor(this.offset.x/w)*w - this.offset.x);
	    let dy0 = int(Math.floor(this.offset.y/h)*h - this.offset.y);
	    for (let dy = dy0; dy < this.bounds.height; dy += h) {
		for (let dx = dx0; dx < this.bounds.width; dx += w) {
		    ctx.drawImage(
			imgsrc.image,
			srcRect.x, srcRect.y, srcRect.width, srcRect.height,
			dx, dy, w, h);
		}
	    }
	    ctx.restore();
	}
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
    
    bounds: Rect;
    maxdepth: number;
    velocity: Vec2 = new Vec2();
    
    private _stars: Star[] = [];

    constructor(bounds: Rect, nstars: number, maxdepth=3) {
	super(new Vec2());
	this.bounds = bounds
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
	let imgsrc = this.imgsrc
	if (imgsrc !== null) {
	    ctx.save();
	    ctx.translate(bx+this.bounds.x, by+this.bounds.y);
	    for (let star of this._stars) {
		let dstRect = star.p.expand(star.s, star.s);
		if (imgsrc instanceof FillImageSource) {
		    ctx.fillStyle = imgsrc.color;
		    ctx.fillRect(dstRect.x, dstRect.y, dstRect.width, dstRect.height);
		} else if (imgsrc instanceof HTMLImageSource) {
		    let srcRect = imgsrc.srcRect;
		    drawImageScaled(
			ctx, imgsrc.image,
			srcRect.x, srcRect.y, srcRect.width, srcRect.height,
			dstRect.x, dstRect.y,
			dstRect.width*this.scale.x,
			dstRect.height*this.scale.y);
		}
	    }
	    ctx.restore();
	}
    }
}


//  Entity
//  A character that can interact with other characters.
//
class Entity extends Sprite {

    collider: Shape = null;

    toString() {
	return '<Entity: '+this.pos+'>';
    }

    getCollider(pos: Vec2=null) {
	pos = (pos !== null)? pos : this.pos;
	if (pos !== null && this.collider !== null) {
	    return this.collider.add(pos);
	} else {
	    return null;
	}
    }
  
    isMovable(v0: Vec2) {
	let v1 = this.getMove(this.pos, v0, true);
	return v1.equals(v0);
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

    collide(entity: Entity) {
	// [OVERRIDE]
    }

    moveIfPossible(v: Vec2, force: boolean) {
	v = this.getMove(this.pos, v, force);
	this.movePos(v);
	return v;
    }
    
}


//  Projectile
// 
class Projectile extends Entity {
    
    movement: Vec2 = new Vec2();
    frame: Rect = null;

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
    jumpfunc: JumpFunc = (vy:number, t:number) => { return (0 <= t && t <= 5)? -4 : vy+1; };
    
    protected _jumpt: number = Infinity;
    protected _jumpend: number = 0;
    protected _landed: boolean = false;
    
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
	    this.velocity = this.moveIfPossible(v, false);
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

    constructor(tilemap: TileMap, pos: Vec2) {
	super(pos);
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
