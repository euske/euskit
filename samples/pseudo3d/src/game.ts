/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/sprite.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />

//  Pseudo3d
//
//  A advanced example that extends Entity class to handle
//  pseudo-3d objects.
//

//  Initialize the resources.
let FONT: Font;
let SPRITES: SpriteSheet;
let TILES: SpriteSheet;
function main() {
    APP = new App(320, 240);
    FONT = new ShadowFont(APP.images['font'], 'white'),
    SPRITES = new ImageSpriteSheet(
	APP.images['sprites'], new Vec2(32,32), new Vec2(16,16));
    TILES = new ImageSpriteSheet(
	APP.images['tiles'], new Vec2(48,48), new Vec2(0,8));
    APP.init(new Game());
}

// Define constants.
enum T {
    NONE = 0,
    BLOCK = 1,
    WALL = 2,
    THINGY = 3,
}
enum S {
    PLAYER = 0,
    SHADOW = 1,
    THINGY = 2,
    YAY = 3,
}
let isBlock = (c:number) => { return c == T.BLOCK; };
let isWall = (c:number) => { return c == T.WALL; };

// getContact3: performs collision detection for given Boxes.
const GROUND = new AAPlane(
    new Vec3(-Infinity, -Infinity, 0),
    new Vec3(+Infinity, +Infinity, 0));
function getContact3(hitbox: Box, v: Vec3, obstacles: Box[])
{
    for (let box of obstacles) {
	v = box.contactBox(v, hitbox);
    }
    return GROUND.contactBox(v, hitbox);
}


//  ShadowSprite3
//
class ShadowSprite3 implements Sprite {

    shadow: ImageSprite;
    dz: number = 0;

    constructor() {
	this.shadow = SPRITES.get(S.SHADOW) as ImageSprite;
    }

    getBounds(): Rect {
        return this.shadow.getBounds();
    }

    render(ctx: CanvasRenderingContext2D) {
	let shadow = this.shadow;
	let srcRect = shadow.srcRect;
	let dstRect = shadow.getBounds();
	let d = this.dz/4;
	if (d*2 <= dstRect.width && d*2 <= dstRect.height) {
	    ctx.drawImage(
		shadow.image,
		srcRect.x, srcRect.y, srcRect.width, srcRect.height,
		dstRect.x+d,
		dstRect.y+d+this.dz/2,
		dstRect.width-d*2, dstRect.height-d*2);
	}
    }
}


//  Entity3d
//
class Entity3d extends Entity {

    world3: World3 = null;
    shadow3: ShadowSprite3 = null;

    z: number = 0;
    depth: number = 0;

    velocity3: Vec3 = new Vec3();
    maxspeed3: Vec3 = new Vec3();

    getPos3() {
	return new Vec3(this.pos.x, this.pos.y, this.z);
    }

    isFloating(): boolean {
	// [OVERRIDE]
	return false;
    }

    movePos3(v: Vec3) {
	this.pos = this.pos.move(v.x, v.y);
	this.z += v.z;
    }

    getCollider3(pos3: Vec3) {
	let pos = (pos3 !== null)? new Vec2(pos3.x, pos3.y) : this.pos;
	let z = (pos3 !== null)? pos3.z : this.z;
	let bounds = this.getCollider(pos).getAABB();
	return new Box(
	    new Vec3(bounds.x, bounds.y, z),
	    new Vec3(bounds.width, bounds.height, this.depth));
    }

    canMove3(v0: Vec3, context=null as string) {
	let v1 = this.getMove3(this.getPos3(), v0, context);
	return v1.equals(v0);
    }

    getMove3(pos: Vec3, v: Vec3, context=null as string) {
	let collider0 = this.getCollider3(pos);
	let collider1 = collider0;
	let range = collider1.union(collider1.add(v));
	let obstacles = this.getObstaclesFor3(range, v, context);
	let d = getContact3(collider1, v, obstacles);
	v = v.sub(d);
	collider1 = collider1.add(d);
	if (v.x != 0) {
	    d = getContact3(collider1, new Vec3(v.x,0,0), obstacles);
	    v = v.sub(d);
	    collider1 = collider1.add(d);
	}
	if (v.y != 0) {
	    d = getContact3(collider1, new Vec3(0,v.y,0), obstacles);
	    v = v.sub(d);
	    collider1 = collider1.add(d);
	}
	if (v.z != 0) {
	    d = getContact3(collider1, new Vec3(0,0,v.z), obstacles);
	    v = v.sub(d);
	    collider1 = collider1.add(d);
	}
	return collider1.origin.sub(collider0.origin);
    }

    getObstaclesFor3(range: Box, v: Vec3, context: string): Box[] {
	return null;
    }

    moveIfPossible3(v: Vec3, context=null as string) {
	v = this.getMove3(this.getPos3(), v, context);
	this.movePos3(v);
	return v;
    }

    render(ctx: CanvasRenderingContext2D) {
        // [DISABLED]
    }

    render3(ctx: CanvasRenderingContext2D, floating: boolean) {
	if (this.isFloating() != floating) return;
        ctx.save();
	ctx.translate(this.pos.x, this.pos.y-this.z/2);
        if (this.shadow3 !== null) {
            this.shadow3.render(ctx);
        }
        for (let sprite of this.sprites) {
            sprite.render(ctx);
        }
        ctx.restore();
    }
}


//  World3
//
class World3 extends World {

    tilemap: TileMap = null;
    tiles: SpriteSheet = null;
    entities3: Entity3d[];

    reset() {
        super.reset();
	this.entities3 = [];
    }

    add(task: Task) {
	super.add(task);
	if (task instanceof Entity3d) {
	    task.world3 = this;
            this.entities3.push(task);
	}
    }

    remove(task: Task) {
	if (task instanceof Entity) {
	    removeElement(this.entities3, task);
        }
	super.remove(task);
    }

    render(ctx: CanvasRenderingContext2D) {
	let ts = this.tilemap.tilesize;
	let window = this.window;

	// Set the drawing order.
	let ents: { [index:string]: Entity3d[] } = {};
	for (let entity3 of this.entities3) {
	    if (!entity3.isVisible()) continue;
	    let pos = entity3.pos;
	    if (pos !== null) {
		let x = int(pos.x/ts);
		let y = int(pos.y/ts);
		let k = x+','+y;
		if (!ents.hasOwnProperty(k)) {
		    ents[k] = [];
		}
		ents[k].push(entity3);
            }
	}

	ctx.save();
	ctx.translate(-ts, 0);
        // Render the background tiles.
	this.tilemap.renderWindowFromTopRight(
	    ctx, window,
	    (x,y,c) => { return (c == 0)? this.tiles.get(c) : null; });
        // Render the tiles and landed objects.
	this.tilemap.renderWindowFromTopRight(
	    ctx, window,
	    (x,y,c) => {
		let k = x+','+y;
		if (ents.hasOwnProperty(k)) {
		    for (let entity3 of ents[k]) {
			entity3.render3(ctx, false);
		    }
		}
		return (c == 0)? null : this.tiles.get(c);
	    });
        // Render the floating objects.
	this.tilemap.renderWindowFromTopRight(
	    ctx, window,
	    (x,y,c) => {
		let k = x+','+y;
		if (ents.hasOwnProperty(k)) {
		    for (let entity3 of ents[k]) {
			entity3.render3(ctx, true);
		    }
		}
		return null;
	    });
        ctx.restore();

	// Draw ordinary 2D objects.
        super.render(ctx);
    }
}


//  Thingy
//
class Thingy extends Entity3d {

    bounds: Rect;

    constructor(pos: Vec2) {
	super(pos);
        let sprite = SPRITES.get(S.THINGY);
	this.sprites = [sprite];
	this.bounds = sprite.getBounds().inflate(-4, -4);
        this.shadow3 = new ShadowSprite3();
	this.z = 4;
    }

    getCollider(pos: Vec2) {
        return this.bounds.add(pos);
    }
}


//  Player
//
class Player extends Entity3d {

    bounds: Rect;
    tilemap: TileMap;
    picked: Signal;

    jumpfunc3: (vz:number, t:number) => number;
    usermove3: Vec3;

    _jumpt: number;
    _jumpend: number;

    constructor(tilemap: TileMap, pos: Vec2) {
	super(pos);
	this.tilemap = tilemap;
	this.picked = new Signal(this);
	let sprite = SPRITES.get(S.PLAYER);
	this.sprites = [sprite];
	this.bounds = sprite.getBounds().inflate(-4, -4);
	this.depth = this.tilemap.tilesize;
        this.shadow3 = new ShadowSprite3();
	this.maxspeed3 = new Vec3(16, 16, 16);
	this.jumpfunc3 = (vz:number,t:number) => {
	    return (0<=t && t<=7)? 8 : vz-2;
	};
	this.usermove3 = new Vec3();
    }

    getCollider(pos: Vec2) {
        return this.bounds.add(pos);
    }

    isFloating(): boolean {
	return (this.tilemap.tilesize/2 < this.z);
    }

    getObstaclesFor3(range: Box, v: Vec3, context: string) {
	let window = this.world3.window;
	let ts = this.tilemap.tilesize;
	let bs = new Vec3(ts, ts, ts);
	let ws = new Vec3(ts, ts, Infinity);
	let boxes = [new Box(new Vec3(window.x1()-ts,0,0),
			     new Vec3(ts, window.height, Infinity))];
	let f = (x:number, y:number, c:number) => {
	    if (isBlock(c)) {
		boxes.push(new Box(new Vec3(x*ts, y*ts, 0), bs));
	    } else if (isWall(c)) {
		boxes.push(new Box(new Vec3(x*ts, y*ts, 0), ws));
	    }
	    return false;
	}
	let area = new Rect(range.origin.x, range.origin.y,
			    range.size.x, range.size.y);
	this.tilemap.apply(f, this.tilemap.coord2map(area));
	return boxes;
    }

    canJump3() {
	return (0 <= this.velocity3.z && !this.canMove3(new Vec3(0,0,-1)));
    }

    canFall3() {
	return true;
    }

    setMove(v: Vec2) {
	this.usermove3 = new Vec3(v.x*4, v.y*4, 0);
    }

    setJump(jumpend: number) {
	if (0 < jumpend) {
	    if (this.canJump3()) {
		this._jumpt = 0;
		APP.playSound('jump');
	    }
	}
	this._jumpend = jumpend;
    }

    onTick() {
	super.onTick();
	this.moveIfPossible3(this.usermove3);
	this.fall();
	if (this._jumpt < this._jumpend) {
	    this._jumpt++;
	} else {
	    this._jumpt = Infinity;
	}
        let z0 = 0;
	if (this.isFloating() &&
	    this.tilemap.findTileByCoord(isBlock, this.getCollider(this.pos).getAABB())) {
            z0 = this.tilemap.tilesize/2;
        }
	this.shadow3.dz = this.z - z0;
	let window = this.world3.window;
	if (!window.overlaps(this.getCollider(this.pos))) {
	    this.stop();
	}
    }

    fall() {
	if (this.canFall3()) {
	    let vz = this.jumpfunc3(this.velocity3.z, this._jumpt);
	    let v = new Vec3(this.velocity3.x, this.velocity3.y, vz);
	    this.velocity3 = this.moveIfPossible3(v, 'fall').clamp(this.maxspeed3);
	}
    }

    onCollided(entity: Entity) {
	if (entity instanceof Thingy) {
	    APP.playSound('pick');
	    entity.stop();
	    this.picked.fire(entity);
	}
    }
}


//  Game
//
class Game extends GameScene {

    tilemap: TileMap;
    world3: World3;
    player: Player;
    score: number;
    speed: Vec2;

    onStart() {
	super.onStart();
	let ROWS = [T.WALL,0,0,0,0,0,T.WALL];
	this.tilemap = new TileMap(32, 12, 7, ROWS.map(
	    (c:number) => { return new Int32Array(12).fill(c); }
	));
	this.world3 = new World3(this.tilemap.bounds);
	this.world3.tilemap = this.tilemap;
	this.world3.tiles = TILES;
	this.score = 0;
	this.speed = new Vec2(2, 0);
	this.player = new Player(this.tilemap, this.world3.area.center());
	this.player.picked.subscribe((player:Entity, entity:Entity) => {
	    this.onPicked(entity);
	});
	this.player.stopped.subscribe(() => {
	    APP.lockKeys();
	    APP.playSound('bomb');
	    this.changeScene(new GameOver(this.score));
	});
	this.add(this.player);

	// show a banner.
	let banner = new BannerBox(
	    this.screen, FONT,
	    ['GET ALL TEH DAMN THINGIES!']);
	banner.lifetime = 2.0;
	banner.interval = 0.5;
	this.world.add(banner);
    }

    add(task: Task) {
        this.world3.add(task);
    }

    onTick() {
	super.onTick();
	this.world3.onTick();
	this.moveAll(this.speed);
    }

    onDirChanged(v: Vec2) {
	this.player.setMove(v);
    }
    onButtonPressed(keysym: KeySym) {
	this.player.setJump(Infinity);
    }
    onButtonReleased(keysym: KeySym) {
	this.player.setJump(0);
    }

    onPicked(entity: Entity) {
	this.score += 1;
	this.speed.x += 1;
	let yay = new Particle(this.player.pos.move(-32,-16));
	yay.sprites = [SPRITES.get(S.YAY)];
	yay.movement = new Vec2(0,-4);
	yay.lifetime = 0.5;
	this.world.add(yay);
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,128,224)';
	fillRect(ctx, this.screen);
	ctx.save();
	ctx.translate(0, (this.screen.height-this.world3.window.height)/2);
	this.world3.render(ctx);
	ctx.restore();
	super.render(ctx);
    }

    moveAll(v: Vec2) {
	this.world3.moveCenter(v);
	let ts = this.tilemap.tilesize;
	let window = this.world3.window;
	let x0 = int(window.x/ts);
	let y0 = int(window.y/ts);
	if (x0 !== 0 || y0 !== 0) {
	    // warp all the tiles and characters.
	    this.shiftTiles(x0, y0);
	    let vw = new Vec2(-x0*ts, -y0*ts);
	    this.world3.moveCenter(vw);
	    this.world3.moveAll(vw);
	}
	if (this.player.isRunning()) {
	    this.player.moveIfPossible3(new Vec3(v.x, v.y, 0), 'fall');
	}
    }

    shiftTiles(vx: number, vy: number) {
	// Generate tiles for horizontal scrolling.
	// Leftmost objects are scrolled out and rotated from right.
	for (let x = 0; x < vx; x++) {
	    for (let y = 1; y < this.tilemap.height-1; y++) {
		this.tilemap.set(x, y, T.NONE);
	    }
	    if (rnd(3) === 0) {
		let y = rnd(1, this.tilemap.height-1);
		this.tilemap.set(x, y, T.BLOCK);
	    }
	    if (rnd(10) === 0) {
		let y = rnd(1, this.tilemap.height-1);
		this.tilemap.set(x, y, T.WALL);
	    }
	    if (rnd(3) === 0) {
		let y = rnd(1, this.tilemap.height-1);
		let p = new Vec2(x+this.tilemap.width, y);
		let rect = this.tilemap.map2coord(p);
		this.add(new Thingy(rect.center()));
		this.tilemap.set(x, y, T.NONE);
	    }
	}
	this.tilemap.shift(-vx, -vy);
    }

}


//  GameOver
//
class GameOver extends HTMLScene {

    constructor(score: number) {
	let html = `<strong>Game Over!</strong><p>Score: ${score}`;
	super(html);
    }

    change() {
	this.changeScene(new Game());
    }
}
