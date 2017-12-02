/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="sprite.ts" />
/// <reference path="layer.ts" />
/// <reference path="tilemap.ts" />


//  Widget
//
class Widget extends Task {

    layer: SpriteLayer = null;
    
    chain(task: Task, signal: Signal=null): Task {
	if (task instanceof Widget) {
	    task.layer = this.layer;
	}
	return super.chain(task, signal);
    }

    start() {
	super.start();
	this.layer.addWidget(this);
    }

    stop() {
	this.layer.removeWidget(this);
	super.stop();
    }

    getSprites(): Sprite[] {
	return [];
    }
}


//  EntityField
// 
class EntityField {

    entities: Entity[] = [];
    
    toString() {
	return ('<EntityField: entities='+this.entities+'>');
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
	    if (!entity.isRunning()) continue;
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
	    if (entity0.isRunning()) {
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
	    if (entity1.isRunning() && f(entity1)) {
		a.push(entity1);
	    }
	}
	return a;
    }
    
    hasEntity(f: (e:Entity)=>boolean, collider0: Collider) {
	for (let entity1 of this.entities) {
	    if (entity1.isRunning() && f(entity1)) {
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

    field: EntityField = null;
    
    pos: Vec2;
    sprite: Sprite;
    skin: ImageSource = null;
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
	    task.field = this.field;
	}
	return super.chain(task, signal);
    }

    start() {
	super.start();
	this.field.addEntity(this);
    }

    stop() {
	this.field.removeEntity(this);
	super.stop();
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
    
    renderExtra(ctx: CanvasRenderingContext2D) {
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


//  PhysicsConfig
//
interface JumpFunc {
    (vy:number, t:number): number;
}
class PhysicsConfig {
    
    jumpfunc: JumpFunc = ((vy:number, t:number) => {
	return (0 <= t && t <= 5)? -4 : vy+1;
    });
    maxspeed: Vec2 = new Vec2(6,6);
    
    isObstacle: TileFunc = ((c:number) => { return false; });
    isGrabbable: TileFunc = ((c:number) => { return false; });
    isStoppable: TileFunc = ((c:number) => { return false; });
}


//  PhysicalEntity
//
class PhysicalEntity extends Entity {

    physics: PhysicsConfig;
    jumped: Signal;
    landed: Signal;
    velocity: Vec2 = new Vec2();
    
    protected _jumpt: number = Infinity;
    protected _jumpend: number = 0;
    protected _landed: boolean = false;
    
    constructor(physics: PhysicsConfig, pos: Vec2) {
	super(pos);
	this.physics = physics;
	this.jumped = new Signal(this);
	this.landed = new Signal(this);
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
	    let vy = this.physics.jumpfunc(this.velocity.y, t);
	    let v = new Vec2(this.velocity.x, vy);
	    v = this.moveIfPossible(v, 'fall');
	    this.velocity = v.clamp(this.physics.maxspeed);
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

    constructor(tilemap: TileMap, physics: PhysicsConfig, pos: Vec2) {
	super(physics, pos);
	this.tilemap = tilemap;
    }
    
    hasTile(f: TileFunc, pos: Vec2=null) {
	let range = this.getCollider(pos).getAABB();
	return (this.tilemap.findTileByCoord(f, range) !== null);
    }

    getObstaclesFor(range: Rect, v: Vec2, context=null as string): Rect[] {
	let f = ((context == 'fall')?
		 this.physics.isStoppable :
		 this.physics.isObstacle);
	return this.tilemap.getTileRects(f, range);
    }
}
