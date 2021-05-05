/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="sprite.ts" />
/// <reference path="tilemap.ts" />


// limitMotion: returns a motion vector that satisfies the given constraints.
function limitMotion(
    collider: Collider, v0: Vec2,
    fences: Rect[]=null,
    obstacles: Collider[]=null,
    checkxy=true): Vec2
{
    let bounds = collider.getAABB();
    let d = v0;
    if (fences !== null) {
        for (let fence of fences) {
            d = fence.boundRect(d, bounds);
        }
    }
    if (obstacles !== null) {
        for (let obstacle of obstacles) {
            d = obstacle.contact(d, collider);
        }
    }
    let v = d;
    if (checkxy && d !== v0) {
        v0 = v0.sub(d);
        bounds = bounds.add(d);
        collider = collider.add(d);
        if (v0.x != 0) {
            d = new Vec2(v0.x, 0);
            if (fences !== null) {
                for (let fence of fences) {
                    d = fence.boundRect(d, bounds);
                }
            }
            if (obstacles !== null) {
                for (let obstacle of obstacles) {
                    d = obstacle.contact(d, collider);
                }
            }
            v = v.add(d);
            v0 = v0.sub(d);
            bounds = bounds.add(d);
            collider = collider.add(d);
        }
        if (v0.y != 0) {
            d = new Vec2(0, v0.y);
            if (fences !== null) {
                for (let fence of fences) {
                    d = fence.boundRect(d, bounds);
                }
            }
            if (obstacles !== null) {
                for (let obstacle of obstacles) {
                    d = obstacle.contact(d, collider);
                }
            }
            v = v.add(d);
            //v0 = v0.sub(d);
            //bounds = bounds.add(d);
            //collider = collider.add(d);
        }
    }
    return v;
}


/** Entity: a thing that can interact with other things.
 */
class Entity extends Task {

    world: World = null;

    pos: Vec2;
    collider: Collider = null;
    sprites: Sprite[] = null;
    fences: Rect[] = null;
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
        if (this.sprites !== null && this.pos !== null) {
            renderSprites(
                ctx, this.sprites, this.pos,
                this.rotation, this.scale, this.alpha);
        }
    }

    getCollider(): Collider {
        if (this.pos === null || this.collider === null) return null;
        return this.collider.add(this.pos);
    }

    onCollided(entity: Entity) {
        // [OVERRIDE]
    }

    getMove(v: Vec2) {
        let collider = this.getCollider();
        return limitMotion(collider, v, this.fences);
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
                let collider = this.getCollider();
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
    isObstacle: (c:number)=>boolean = ((c:number) => { return false; });

    constructor(tilemap: TileMap, pos: Vec2) {
        super(pos);
        this.tilemap = tilemap;
    }

    getMove(v: Vec2) {
        let collider = this.getCollider();
        let hitbox = collider.getAABB();
        let range = hitbox.union(hitbox.add(v));
        let obstacles = this.tilemap.getTileRects(this.isObstacle, range);
        return limitMotion(collider, v, this.fences, obstacles);
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


//  PlatformerEntity
//
class PlatformerEntity extends TileMapEntity {

    physics: PhysicsConfig;
    velocity: Vec2 = new Vec2();

    protected _jumpt: number = Infinity;
    protected _jumpend: number = 0;
    protected _landed: boolean = false;

    constructor(physics: PhysicsConfig, tilemap: TileMap, pos: Vec2) {
        super(tilemap, pos);
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

    getMove(v0: Vec2, context=null as string) {
        let collider = this.getCollider();
        let hitbox = collider.getAABB();
        let range = hitbox.union(hitbox.add(v0));
        let obstacles = this.getObstaclesFor(range, v0, context);
        return limitMotion(collider, v0, this.fences, obstacles);
    }

    getObstaclesFor(range: Rect, v: Vec2, context: string): Rect[] {
        let f = ((context == 'fall')?
                 this.physics.isStoppable :
                 this.physics.isObstacle);
        return this.tilemap.getTileRects(f, range);
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
            v = this.getMove(v, 'fall');
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
        return v === this.getMove(v);
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
