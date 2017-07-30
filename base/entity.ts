/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="sprite.ts" />
/// <reference path="layer.ts" />
/// <reference path="tilemap.ts" />


//  EntityWorld
// 
class EntityWorld {

    entities: Entity[] = [];
    
    toString() {
	return ('<EntityWorld: entities='+this.entities+'>');
    }
  
    init() {
	this.entities = [];
    }
  
    tick() {
	this.checkEntityCollisions();
    }

    addEntity(entity: Entity) {
	this.entities.push(entity);
    }

    removeEntity(entity: Entity) {
	removeElement(this.entities, entity);
    }

    moveAll(v: Vec2) {
	for (let entity of this.entities) {
	    if (!entity.running) continue;
	    entity.movePos(v);
	}
    }

    checkEntityCollisions() {
	this.checkEntityPairs(
	    (e0:Entity, e1:Entity) => {
		e0.collidedWith(e1);
		e1.collidedWith(e0);
	    });
    }

    checkEntityPairs(f: (e0:Entity, e1:Entity)=>void) {
	for (let i = 0; i < this.entities.length; i++) {
	    let entity0 = this.entities[i];
	    if (entity0.running) {
		let collider0 = entity0.getCollider();
		if (collider0 !== null) {
		    let a = this.findEntities(
			(e:Entity) => {
			    let collider1 = e.getCollider();
			    return (entity0 !== e &&
				    collider1 !== null &&
				    collider0.overlaps(collider1));
			},
			this.entities.slice(i+1));
		    for (let e of a) {
			f(entity0, e);
		    }
		}
	    }
	}
    }

    findEntities(f: (e:Entity)=>boolean, entities: Entity[]=null) {
	if (entities === null) {
	    entities = this.entities;
	}
	let a:Entity[] = [];
	for (let entity1 of entities) {
	    if (entity1.running && f(entity1)) {
		a.push(entity1);
	    }
	}
	return a;
    }
    
    hasEntity(f: (e:Entity)=>boolean, collider0: Collider) {
	for (let entity1 of this.entities) {
	    if (entity1.running && f(entity1)) {
		let collider1 = entity1.getCollider();
		if (collider1 !== null && collider0.overlaps(collider1)) {
		    return true;
		}
	    }
	}
	return false;
    }
}


//  Entity
//  A character that can interact with other characters.
//
class Entity extends Widget {

    world: EntityWorld = null;
    
    pos: Vec2;
    sprite: Sprite;
    imgsrc: ImageSource = null;
    collider: Collider = null;

    constructor(pos: Vec2) {
	super();
	this.pos = (pos !== null)? pos.copy() : pos;
	this.sprite = new EntitySprite(this);
    }

    toString() {
	return '<Entity: '+this.pos+'>';
    }

    chain(task: Task, signal: Signal=null): Task {
	if (task instanceof Entity) {
	    task.world = this.world;
	}
	return super.chain(task, signal);
    }

    init() {
	super.init();
	this.world.addEntity(this);
    }

    stop() {
	this.world.removeEntity(this);
	super.stop();
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

    movePos(v: Vec2) {
	this.pos = this.pos.add(v);
    }
    
    moveIfPossible(v: Vec2, context=null as string) {
	v = this.getMove(this.pos, v, context);
	this.movePos(v);
	return v;
    }

    getSprites(): Sprite[] {
	let sprites = super.getSprites();
	if (this.sprite !== null) {
	    sprites.push(this.sprite);
	}
	return sprites;
    }

    renderExtra(ctx: CanvasRenderingContext2D) {
    }
    
    getObstaclesFor(range: Rect, v: Vec2, context: string): Collider[] {
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
	    if (this.frame !== null) {
		let collider = this.getCollider();
		if (collider !== null && !collider.overlaps(this.frame)) {
		    this.stop();
		}
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
	this.fall(this._jumpt);
	if (this.isJumping()) {
	    this._jumpt++;
	} else {
	    this._jumpt = Infinity;
	}
    }
  
    fall(t: number) {
	if (this.canFall()) {
	    let vy = this.jumpfunc(this.velocity.y, t);
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
