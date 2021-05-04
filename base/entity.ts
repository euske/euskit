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
        renderSprites(
            ctx, this.sprites, this.pos,
            this.rotation, this.scale, this.alpha);
    }

    getCollider(pos: Vec2): Collider {
        return null;
    }

    onCollided(entity: Entity) {
	// [OVERRIDE]
    }

    getMove(pos: Vec2, v0: Vec2, context=null as string) {
        let collider = this.getCollider(pos);
	if (collider === null) return v0;
	let hitbox = collider.getAABB();
	let range = hitbox.union(hitbox.add(v0));
	let obstacles = this.getObstaclesFor(range, v0, context);
	let fences = this.getFencesFor(range, v0, context);
	let v = getContact(collider, v0, obstacles, fences);
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
}


//  Particle
//
class Particle extends Entity {

    movement: Vec2 = null;

    onTick() {
	super.onTick();
	if (this.movement !== null) {
            this.pos = this.pos.add(this.movement);
            let frame = this.getFrame();
	    if (frame !== null) {
		let collider = this.getCollider(this.pos);
		if (collider !== null && !collider.overlapsRect(frame)) {
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

    hasTile(f: (c:number)=>boolean, pos: Vec2) {
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
            v = this.getMove(this.pos, v, 'fall');
            this.pos = this.pos.add(v);
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

    canMove(v: Vec2) {
	return v === this.getMove(this.pos, v);
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

    hasTile(f: (c:number)=>boolean, pos: Vec2) {
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
