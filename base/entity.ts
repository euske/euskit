/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="sprite.ts" />
/// <reference path="tilemap.ts" />


/** Entity: a thing that can interact with other things.
 */
class Entity extends Task {

    world: World = null;

    pos: Vec2;
    collider: Collider = null;
    sprites: Sprite[] = [];
    order: number = 0;
    rotation: number = 0;
    scale: Vec2 = null;
    alpha: number = 1.0;

    constructor(pos: Vec2) {
	super();
	this.pos = (pos !== null)? pos.copy() : pos;
    }

    toString() {
	return '<Entity: '+this.pos+'>';
    }

    isVisible() {
        return this.isRunning();
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        if (this.pos !== null) {
            ctx.translate(this.pos.x, this.pos.y);
        }
        if (this.rotation) {
	    ctx.rotate(this.rotation);
        }
        if (this.scale !== null) {
	    ctx.scale(this.scale.x, this.scale.y);
        }
	ctx.globalAlpha = this.alpha;
        for (let sprite of this.sprites) {
            sprite.render(ctx);
        }
        ctx.restore();
    }

    movePos(v: Vec2) {
	this.pos = this.pos.add(v);
    }

    getCollider(pos: Vec2=null) {
	if (this.collider === null) return null;
	if (pos === null) {
	    pos = this.pos;
	    if (pos === null) return null;
	}
	return this.collider.add(pos);
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

    moveIfPossible(v: Vec2, context=null as string) {
	v = this.getMove(this.pos, v, context);
	this.movePos(v);
	return v;
    }

    getObstaclesFor(range: Rect, v: Vec2, context: string): Collider[] {
	// [OVERRIDE]
	return null;
    }

    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	// [OVERRIDE]
	return null;
    }

    onCollided(entity: Entity) {
	// [OVERRIDE]
    }
}


//  Particle
//
class Particle extends Entity {

    movement: Vec2 = null;

    onTick() {
	super.onTick();
	if (this.movement !== null) {
	    this.movePos(this.movement);
            let frame = this.getFrame();
	    if (frame !== null) {
		let collider = this.getCollider();
		if (collider !== null && !collider.overlaps(frame)) {
		    this.stop();
		}
	    }
	}
    }

    getFrame(): Rect {
        // [OVERRIDE]
        return null;
    }
}


//  TileMapEntity
//
class TileMapEntity extends Entity {

    tilemap: TileMap;
    isObstacle: (c:number)=>boolean;

    constructor(tilemap: TileMap, isObstacle: (c:number)=>boolean, pos: Vec2) {
	super(pos);
	this.tilemap = tilemap;
	this.isObstacle = isObstacle;
    }

    hasTile(f: (c:number)=>boolean, pos: Vec2=null) {
	let range = this.getCollider(pos).getAABB();
	return (this.tilemap.findTileByCoord(f, range) !== null);
    }

    getObstaclesFor(range: Rect, v: Vec2, context: string): Rect[] {
	return this.tilemap.getTileRects(this.isObstacle, range);
    }
}


//  PhysicsConfig
//
class PhysicsConfig {

    jumpfunc: (vy:number,t:number)=>number =
        ((vy:number, t:number) => {
	    return (0 <= t && t <= 5)? -4 : vy+1;
        });
    maxspeed: Vec2 = new Vec2(6,6);

    isObstacle: (c:number)=>boolean = ((c:number) => { return false; });
    isGrabbable: (c:number)=>boolean = ((c:number) => { return false; });
    isStoppable: (c:number)=>boolean = ((c:number) => { return false; });
}


//  PhysicalEntity
//
class PhysicalEntity extends Entity {

    physics: PhysicsConfig;
    velocity: Vec2 = new Vec2();

    protected _jumpt: number = Infinity;
    protected _jumpend: number = 0;
    protected _landed: boolean = false;

    constructor(physics: PhysicsConfig, pos: Vec2) {
	super(pos);
	this.physics = physics;
    }

    onTick() {
	super.onTick();
	this.fall(this._jumpt);
	if (this.isJumping()) {
	    this._jumpt++;
	} else {
	    this._jumpt = Infinity;
	}
    }

    setJump(jumpend: number) {
	if (0 < jumpend) {
	    if (this.canJump()) {
		this._jumpt = 0;
		this.onJumped();
	    }
	}
	this._jumpend = jumpend;
    }

    fall(t: number) {
	if (this.canFall()) {
	    let vy = this.physics.jumpfunc(this.velocity.y, t);
	    let v = new Vec2(this.velocity.x, vy);
	    v = this.moveIfPossible(v, 'fall');
	    this.velocity = v.clamp(this.physics.maxspeed);
	    let landed = (0 < vy && this.velocity.y == 0);
	    if (!this._landed && landed) {
		this.onLanded();
	    }
	    this._landed = landed;
	} else {
	    this.velocity = new Vec2();
	    if (!this._landed) {
		this.onLanded();
	    }
	    this._landed = true;
	}
    }

    canJump() {
	return this.isLanded();
    }

    canFall() {
	return true;
    }

    isJumping() {
	return (this._jumpt < this._jumpend);
    }

    isLanded() {
	return this._landed;
    }

    onJumped() {
	// [OVERRIDE]
    }

    onLanded() {
	// [OVERRIDE]
    }
}


//  PlatformerEntity
//
class PlatformerEntity extends PhysicalEntity {

    tilemap: TileMap;

    constructor(tilemap: TileMap, physics: PhysicsConfig, pos: Vec2) {
	super(physics, pos);
	this.tilemap = tilemap;
    }

    hasTile(f: (c:number)=>boolean, pos: Vec2=null) {
	let range = this.getCollider(pos).getAABB();
	return (this.tilemap.findTileByCoord(f, range) !== null);
    }

    getObstaclesFor(range: Rect, v: Vec2, context: string): Rect[] {
	let f = ((context == 'fall')?
		 this.physics.isStoppable :
		 this.physics.isObstacle);
	return this.tilemap.getTileRects(f, range);
    }
}
