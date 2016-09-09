/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="tilemap.ts" />


//  ImageSource
//
class ImageSource {
    dstRect: Rect;
    
    constructor(dstRect: Rect) {
	this.dstRect = dstRect;
    }
}

class HTMLImageSource extends ImageSource {
    image: HTMLImageElement;
    srcRect: Rect;
    
    constructor(image: HTMLImageElement, srcRect: Rect, dstRect: Rect) {
	super(dstRect);
	this.image = image;
	this.srcRect = srcRect;
    }
}

class FillImageSource extends ImageSource {
    color: string;
    
    constructor(color: string, dstRect: Rect) {
	super(dstRect);
	this.color = color;
    }
}


//  SpriteSheet
// 
class SpriteSheet {
    constructor() {
    }
    
    get(x:number, y=0, w=1, h=1, origin: Vec2=null) {
	return null as ImageSource;
    }
}

class ImageSpriteSheet extends SpriteSheet {
    image: HTMLImageElement;
    size: Vec2;
    origin: Vec2;

    constructor(image: HTMLImageElement, size: Vec2, origin: Vec2=null) {
	super();
	this.image = image;
	this.size = size;
	this.origin = origin;
    }

    get(x:number, y=0, w=1, h=1, origin: Vec2=null) {
	if (origin === null) {
	    if (this.origin === null) {
		origin = new Vec2(w*this.size.x/2, h*this.size.y/2);
	    } else {
		origin = this.origin;
	    }
	}
	let srcRect = new Rect(x*this.size.x, y*this.size.y, w*this.size.x, h*this.size.y);
	let dstRect = new Rect(-origin.x, -origin.y, w*this.size.x, h*this.size.y);
	return new HTMLImageSource(this.image, srcRect, dstRect);
    }
}

class SimpleSpriteSheet extends SpriteSheet {
    imgsrcs: FillImageSource[];

    constructor(imgsrcs: FillImageSource[]) {
	super();
	this.imgsrcs = imgsrcs;
    }

    get(x:number, y=0, w=1, h=1, origin: Vec2=null) {
	return this.imgsrcs[x];
    }
}


//  Task
//  A single procedure that runs at each frame.
//
class Task {

    running: boolean = true;
    layer: Layer = null;
    lifetime: number = Infinity;
    time0: number = 0;
    time: number = 0;
    stopped: Signal;

    constructor() {
	this.stopped = new Signal(this);
    }

    toString() {
	return '<Task: time='+this.time+'>';
    }
  
    start(layer: Layer) {
	this.layer = layer;
	this.time0 = layer.time;
	this.time = 0;
    }

    stop() {
	if (this.running) {
	    this.running = false;
	    this.stopped.fire();
	}
    }

    chain(task: Task) {
	if (this.running) {
	    this.stopped.subscribe(() => {
		if (this.layer !== null) {
		    this.layer.addTask(task)
		}
	    });
	} else {
	    if (this.layer !== null) {
		this.layer.addTask(task)
	    }
	}
	return task;
    }
  
    tick(t: number) {
	this.update();
	this.time = t - this.time0;
	if (this.lifetime <= this.time) {
	    this.stop();
	}
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
    mouseSelectable: boolean = false;

    constructor(pos: Vec2) {
	super();
	this.pos = pos.copy();
    }
    
    toString() {
	return '<Sprite: '+this.pos+'>';
    }
  
    start(layer: Layer) {
	super.start(layer);
	this.layer.addSprite(this);
    }

    stop() {
	super.stop();
	this.layer.removeSprite(this);
    }

    isFocused() {
	return (this.layer !== null && this.layer.mouseFocus === this);
    }
    
    isActive() {
	return (this.layer !== null && this.layer.mouseActive === this);
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
	    ctx.translate(bx+int(this.pos.x), by+int(this.pos.y));
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
	    ctx.translate(bx+int(this.bounds.x), by+int(this.bounds.y));
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
	    ctx.translate(bx+int(this.bounds.x), by+int(this.bounds.y));
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

    start(layer: Layer) {
	super.start(layer);
	this.layer.addEntity(this);
    }

    stop() {
	super.stop();
	this.layer.removeEntity(this);
    }
    
    getCollider(pos: Vec2=null) {
	pos = (pos !== null)? pos : this.pos;
	if (pos !== null && this.collider !== null) {
	    return this.collider.add(pos);
	} else {
	    return null;
	}
    }
  
    canMove(v0: Vec2, context=null as string) {
	let v1 = this.getMove(this.pos, v0, context);
	return v1.equals(v0);
    }

    getMove(pos: Vec2, v: Vec2, context=null as string) {
	if (this.collider === null) return v;
	let collider = this.collider.add(pos);
	let hitbox0 = collider.getAABB();
	let range = hitbox0.union(hitbox0.add(v));
	let obstacles = this.getObstaclesFor(range, v, context);
	let fences = this.getFencesFor(range, v, context);
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
  
    getObstaclesFor(range: Rect, v: Vec2, context: string): Shape[] {
	// [OVERRIDE]
	return null;
    }
  
    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	// [OVERRIDE]
	return null;
    }

    collidedWith(entity: Entity) {
	// [OVERRIDE]
    }

    moveIfPossible(v: Vec2, context=null as string) {
	v = this.getMove(this.pos, v, context);
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
		this.stop();
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

    jumped: Signal;
    landed: Signal;
    jumpfunc: JumpFunc;
    velocity: Vec2 = new Vec2();
    maxspeed: Vec2 = new Vec2(6,6);
    
    protected _jumpt: number = Infinity;
    protected _jumpend: number = 0;
    protected _landed: boolean = false;
    
    constructor(pos: Vec2) {
	super(pos);
	this.jumped = new Signal(this);
	this.landed = new Signal(this);
	this.jumpfunc = (vy:number, t:number) => {
	    return (0 <= t && t <= 5)? -4 : vy+1;
	};
    }

    setJump(jumpend: number) {
	if (0 < jumpend) {
	    if (this.canJump()) {
		this.jumped.fire();
		this._jumpt = 0;
	    }
	}
	this._jumpend = jumpend;
    }

    update() {
	super.update();
	this.fall();
	if (this.isJumping()) {
	    this._jumpt++;
	} else {
	    this._jumpt = Infinity;
	}
    }
  
    fall() {
	if (this.canFall()) {
	    let vy = this.jumpfunc(this.velocity.y, this._jumpt);
	    let v = new Vec2(this.velocity.x, vy);
	    v = this.moveIfPossible(v, 'fall');
	    this.velocity = v.clamp(this.maxspeed);
	    let landed = (0 < vy && this.velocity.y == 0);
	    if (!this._landed && landed) {
		this.landed.fire();
	    }
	    this._landed = landed;
	} else {
	    this.velocity = new Vec2();
	}
    }

    isLanded() {
	return this._landed;
    }
    
    isJumping() {
	return (this._jumpt < this._jumpend);
    }

    canJump() {
	return this.isLanded();
    }

    canFall() {
	return true;
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
    
    hasTile(f: TileFunc, pos: Vec2=null) {
	let range = this.getCollider(pos).getAABB();
	return (this.tilemap.findTileByCoord(f, range) !== null);
    }

    getObstaclesFor(range: Rect, v: Vec2, context=null as string): Rect[] {
	let f = ((context == 'fall')?
		 this.tilemap.isStoppable :
		 this.tilemap.isObstacle);
	return this.tilemap.getTileRects(f, range);
    }
}
