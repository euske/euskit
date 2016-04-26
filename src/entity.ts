/// <reference path="utils.ts" />
/// <reference path="geom.ts" />


//  Task
//  A single procedure that runs at each frame.
//
class Task {

    alive: boolean = true;
    layer: Layer = null;
    ticks: number = 0;
    duration: number = 0;
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

    die() {
	this.alive = false;
	this.died.signal();
    }
  
    tick() {
	this.ticks++;
	this.update();
	if (this.alive && 0 < this.duration &&
	    this.duration < this.ticks) {
	    this.die();
	}
    }
  
    update() {
	// [OVERRIDE]
    }

}


//  Queue
//  A list of Tasks that runs sequentially.
//
class Queue extends Task {

    tasks: [Task];

    constructor(tasks: [Task]) {
	super();
	this.tasks = tasks;
    }

    tick() {
	while (0 < this.tasks.length) {
	    let task = this.tasks[0];
	    if (task.layer === null) {
		task.start(this.layer);
	    }
	    task.tick();
	    if (task.alive) return;
	    this.tasks.shift();
	}
	this.die();
    }
  
    add(task: Task) {
	this.tasks.push(task);
    }
  
    remove(task: Task) {
	removeElement(this.tasks, task);
    }
  
}


//  Sprite
//  A moving object that doesn't interact.
//
class Sprite extends Task {

    bounds: Rect;
    src: ImageSource;
    visible: boolean = true;
    zorder: number = 0;
    scale: Vec2 = new Vec2(1, 1);

    constructor(bounds: Rect, src: ImageSource=null) {
	super();
	this.bounds = (bounds)? bounds.copy() : null;
	this.src = src;
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
	if (this.src instanceof DummyImageSource) {
	    ctx.fillStyle = (this.src as DummyImageSource).color;
	    ctx.fillRect(bx+this.bounds.x, by+this.bounds.y, w, h);
	} else if (this.src instanceof HTMLImageSource) {
	    let rect = (this.src as HTMLImageSource).bounds;
	    let offset = (this.src as HTMLImageSource).offset;
	    drawImageScaled(ctx, (this.src as HTMLImageSource).image,
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
    
    constructor(bounds: Rect, src: ImageSource) {
	super(bounds, src);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	bx += this.bounds.x;
	by += this.bounds.y;
	ctx.save();
	ctx.beginPath();
	ctx.rect(bx, by, this.bounds.width, this.bounds.height);
	ctx.clip();
	let src = this.src as HTMLImageSource;
	let w = src.bounds.width;
	let h = src.bounds.height;
	let dx0 = int(Math.floor(this.offset.x/w)*w - this.offset.x);
	let dy0 = int(Math.floor(this.offset.y/h)*h - this.offset.y);
	for (let dy = dy0; dy < this.bounds.height; dy += h) {
	    for (let dx = dx0; dx < this.bounds.width; dx += w) {
		ctx.drawImage(src.image, src.bounds.x, src.bounds.y, w, h,
			      bx+dx, by+dy, w, h);
	    }
	}
	ctx.restore();
    }

}


//  Entity
//  A character that can interact with other characters.
//
class Entity extends Sprite {

    hitbox: Rect;

    constructor(bounds: Rect, src: ImageSource=null, hitbox: Rect=null) {
	super(bounds, src);
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
	let d0 = this.getContactFor(v, hitbox, force, range);
	v = v.sub(d0);
	hitbox = hitbox.add(d0);
	if (v.x != 0) {
	    let d1 = this.getContactFor(new Vec2(v.x, 0), hitbox, force, range);
	    v = v.sub(d1);
	    hitbox = hitbox.add(d1);
	}
	if (v.y != 0) {
	    let d2 = this.getContactFor(new Vec2(0, v.y), hitbox, force, range);
	    v = v.sub(d2);
	    hitbox = hitbox.add(d2);
	}
	let bounds = this.getConstraintsFor(hitbox, force);
	if (bounds !== null) {
	    hitbox = hitbox.clamp(bounds);
	}
	return hitbox.diff(this.hitbox);
    }
  
    getContactFor(v: Vec2, hitbox: Rect, force: boolean, range: Rect): Vec2 {
	// [OVERRIDE]
	return v;
    }
  
    getConstraintsFor(hitbox: Rect, force: boolean): Rect {
	// [OVERRIDE]
	return null;
    }

}


//  Projectile
// 
class Projectile extends Entity {
    
    frame: Rect;
    movement: Vec2 = new Vec2();

    constructor(frame: Rect, bounds: Rect,
		src: ImageSource, hitbox: Rect,
		movement: Vec2) {
	super(bounds, src, hitbox);
	this.frame = frame;
	this.movement = movement;
    }

    update() {
	super.update();
	this.moveIfPossible(this.movement, true);
	if (!this.hitbox.overlap(this.frame)) {
	    this.die();
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

    static jumpfunc: JumpFunc = (
	(vy:number, t:number) => { return (0 <= t && t <= 5)? -4 : vy+1; }
    );
    
    constructor(bounds: Rect, src: ImageSource=null, hitbox: Rect=null) {
	super(bounds, src, hitbox);
	this._jumpt = Infinity;
	this._jumpend = 0;
	this._landed = false;
	this.jumpfunc = PhysicalEntity.jumpfunc;
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
		src: ImageSource=null, hitbox: Rect=null) {
	super(bounds, src, hitbox);
	this.tilemap = tilemap;
    }
    
    isHolding() {
	return (this.tilemap.findTile(this.tilemap.isGrabbable, this.hitbox) !== null);
    }

    getContactFor(v: Vec2, hitbox: Rect, force: boolean, range: Rect): Vec2 {
	let f = ((force || this.isHolding())?
		 this.tilemap.isObstacle :
		 this.tilemap.isStoppable);
	return this.tilemap.contactTile(hitbox, f, v, range);
    }
  
}
