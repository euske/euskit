/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />

//  Isometric
//
//  A advanced example that extends Entity class to handle
//  pseudo-3d objects.
//

// getContact3: performs collision detection for given Boxes.
function getContact3(hitbox: Box, v: Vec3, boxes: Box[])
{
    for (let box of boxes) {
	v = hitbox.contactBox(v, box);
    }
    return hitbox.contactXYPlane(v, 0, null);
}


//  Entity3d
//
class Entity3d extends Entity {

    shadow: HTMLImageSource = null;
    depth: number = 0;

    z: number = 0;
    shadowz: number = 0;
    velocity3: Vec3 = new Vec3();
    maxspeed3: Vec3 = new Vec3();
    
    getPos3() {
	return new Vec3(this.pos.x, this.pos.y, this.z);
    }
    
    movePos3(v: Vec3) {
	this.pos = this.pos.move(v.x, v.y);
	this.z += v.z;
    }

    render3(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	bx += this.pos.x;
	by += this.pos.y;
	let shadow = this.shadow;
	if (shadow !== null) {
	    // Render the shadow first.
	    let srcRect = shadow.srcRect;
	    let dstRect = shadow.dstRect;
	    let d = (this.z-this.shadowz)/4;
	    if (d*2 <= dstRect.width && d*2 <= dstRect.height) {
		ctx.drawImage(
		    this.shadow.image,
		    srcRect.x, srcRect.y, srcRect.width, srcRect.height,
		    bx+dstRect.x+d, by+dstRect.y+d-this.shadowz/2,
		    dstRect.width-d*2, dstRect.height-d*2);
	    }
	}
	let imgsrc = this.imgsrc;
	if (imgsrc instanceof HTMLImageSource) {
	    let srcRect = imgsrc.srcRect;
	    let dstRect = imgsrc.dstRect;
	    ctx.drawImage(
		imgsrc.image,
		srcRect.x, srcRect.y, srcRect.width, srcRect.height,
		bx+dstRect.x, by+dstRect.y-this.z/2,
		dstRect.width, dstRect.height);
	}
    }
    
    getCollider3(pos3: Vec3=null) {
	let pos = (pos3 !== null)? new Vec2(pos3.x, pos3.y) : this.pos;
	let z = (pos3 !== null)? pos3.z : this.z;
	let bounds = this.getBounds(pos);
	return new Box(
	    new Vec3(bounds.x, bounds.y, z),
	    new Vec3(bounds.width, bounds.height, this.depth));
    }

    isMovable3(v0: Vec3, context=null as string) {
	let v1 = this.getMove3(this.getPos3(), v0, context);
	return v1.equals(v0);
    }

    getMove3(pos: Vec3, v: Vec3, context=null as string) {
	let collider0 = this.getCollider3(pos);
	let collider1 = collider0;
	let range = collider1.union(collider1.add(v));
	let obstacles = this.getObstaclesFor3(range, context);
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
    
    isFloating() {
	return false;
    }
    
    getObstaclesFor3(range: Box, context: string): Box[] {
	return null;
    }

    moveIfPossible3(v: Vec3, context=null as string) {
	v = this.getMove3(this.getPos3(), v, context);
	this.movePos3(v);
	return v;
    }
}


//  ScrollLayer3
// 
interface SpriteDictionary {
    [index: string]: Sprite[];
}
class ScrollLayer3 extends ScrollLayer {

    tilemap: TileMap = null;
    tiles: SpriteSheet = null;

    render3(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	let ts = this.tilemap.tilesize;
	let window = this.window;
	let dx = -ts;
	let dy = 0;
	let tx = bx+dx-window.x;
	let ty = by+dy-window.y;

	// Set the drawing order.
	let objs = {} as SpriteDictionary;
	for (let obj of this.sprites) {
	    if (obj.alive && obj.visible) {
		let bounds = obj.getBounds();
		if (bounds !== null && bounds.overlapsRect(window)) {
		    let x = int((bounds.x+bounds.width/2)/ts);
		    let y = int((bounds.y+bounds.height/2)/ts);
		    let k = x+','+y;
		    if (!objs.hasOwnProperty(k)) {
			objs[k] = [];
		    }
		    objs[k].push(obj);
		}
	    }
	}

	// Draw the tilemap.
	function f(x:number, y:number, c:number) {
	    let k = x+','+y;
	    if (objs.hasOwnProperty(k)) {
		for (let obj of objs[k]) {
		    if (obj instanceof Entity3d) {
			if (!obj.isFloating()) {
			    obj.render3(ctx, tx, ty);
			}
		    } else {
			obj.render(ctx, tx, ty);
		    }
		}
	    }
	    return (c == 0)? -1 : c;
	}
	this.tilemap.renderWindowFromTopRight(
	    ctx, bx+dx, by+dy, window, this.tiles,
	    (x,y,c) => { return (c == 0)? 0 : -1; });
	this.tilemap.renderWindowFromTopRight(
	    ctx, bx+dx, by+dy, window, this.tiles, f);
	
	// Draw floating objects.
	for (let obj of this.sprites) {
	    if (obj.alive && obj.visible) {
		let bounds = obj.getBounds();
		if (bounds === null) {
		    obj.render(ctx, bx, by);
		} else if (bounds.overlaps(window)) {
		    if (obj instanceof Entity3d) {
			if (obj.isFloating()) {
			    obj.render3(ctx, tx, ty);
			}
		    } else {
			obj.render(ctx, tx, ty);
		    }
		}
	    }
	}
    }
}


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
let SPRITES: SpriteSheet = null;
let TILES: SpriteSheet = null;
let isBlock = (c:number) => { return c == T.BLOCK; };
let isWall = (c:number) => { return c == T.WALL; };


//  Thingy
//
class Thingy extends Entity3d {
    
    shadow: HTMLImageSource;

    constructor(scene: Game, pos: Vec2) {
	super(pos);
	this.imgsrc = SPRITES.get(S.THINGY);
	this.shadow = SPRITES.get(S.SHADOW) as HTMLImageSource;
	this.collider = this.imgsrc.dstRect.inflate(-4, -4);
	this.zOrder = 0;
	this.z = 4;
    }
}


//  Player
//
class Player extends Entity3d {
    
    scene: Game;
    scored: Signal;
    
    jumpfunc3: (vz:number, t:number) => number;
    usermove3: Vec3;

    _jumpt: number;
    _jumpend: number;
    
    constructor(scene: Game, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.scored = new Signal(this);
	this.imgsrc = SPRITES.get(S.PLAYER)
	this.shadow = SPRITES.get(S.SHADOW) as HTMLImageSource;
	this.collider = this.imgsrc.dstRect.inflate(-4, -4);
	this.zOrder = 1;
	this.depth = scene.tilemap.tilesize;
	this.maxspeed3 = new Vec3(16, 16, 16);
	this.jumpfunc3 = (vz:number,t:number) => { return (0<=t && t<=7)? 8 : vz-2; };
	this.usermove3 = new Vec3();
    }
    
    getObstaclesFor3(range: Box, context: string) {
	let window = this.scene.layer.window;
	let tilemap = this.scene.tilemap;
	let ts = tilemap.tilesize;
	let bs = new Vec3(ts, ts, ts);
	let ws = new Vec3(ts, ts, Infinity);
	let boxes = [new Box(new Vec3(window.right()-ts,0,0),
			     new Vec3(ts, window.height, Infinity))];
	function f(x:number, y:number, c:number) {
	    if (isBlock(c)) {
		boxes.push(new Box(new Vec3(x*ts, y*ts, 0), bs));
	    } else if (isWall(c)) {
		boxes.push(new Box(new Vec3(x*ts, y*ts, 0), ws));
	    }
	    return false;
	}
	let area = new Rect(range.origin.x, range.origin.y, range.size.x, range.size.y);
	tilemap.apply(f, tilemap.coord2map(area));
	return boxes;
    }
    
    isFloating() {
	let tilemap = this.scene.tilemap;
	return (tilemap.tilesize/2 < this.z);
    }
    
    isLanded3() {
	return (0 <= this.velocity3.z && !this.isMovable3(new Vec3(0,0,-1)));
    }

    setMove(v: Vec2) {
	this.usermove3 = new Vec3(v.x*4, v.y*4, 0);
    }
    
    setJump(jumpend: number) {
	if (0 < jumpend) {
	    if (this.isLanded3()) {
		this._jumpt = 0;
	    }
	}
	this._jumpend = jumpend;
    }

    update() {
	super.update();
	this.moveIfPossible3(this.usermove3);
	this.fall();
	if (this._jumpt < this._jumpend) {
	    this._jumpt++;
	} else {
	    this._jumpt = Infinity;
	}
	let tilemap = this.scene.tilemap;
	if (this.isFloating() &&
	    tilemap.findTile(isBlock, this.getBounds())) {
	    this.shadowz = tilemap.tilesize;
	} else {
	    this.shadowz = 0;
	}
	let window = this.scene.layer.window;
	if (!window.overlaps(this.getCollider())) {
	    this.die();
	}
    }
  
    fall() {
	let vz = this.jumpfunc3(this.velocity3.z, this._jumpt);
	let v = new Vec3(this.velocity3.x, this.velocity3.y, vz);
	this.velocity3 = this.moveIfPossible3(v, 'fall').clamp(this.maxspeed3);
    }

    collidedWith(entity: Entity) {
	if (entity instanceof Thingy) {
	    entity.die();
	    let obj = new Projectile(this.pos.move(0,-16));
	    obj.imgsrc = SPRITES.get(S.YAY);
	    obj.movement = new Vec2(0,-4);
	    obj.lifetime = 0.5;
	    obj.zOrder = 2;
	    this.scene.layer.addObject(obj);
	    this.scored.fire();
	}
    }
    
}


//  Game
// 
class Game extends Scene {
    
    tilemap: TileMap;
    layer: ScrollLayer3;
    player: Player;
    speed: Vec2;

    constructor(app: App) {
	super(app);
	SPRITES = new ImageSpriteSheet(
	    app.images['sprites'], new Vec2(32,32), new Vec2(16,16));
	TILES = new ImageSpriteSheet(
	    app.images['tiles'], new Vec2(48,48), new Vec2(0,8));
    }
    
    init() {
	super.init();
	let ROWS = [T.WALL,0,0,0,0,0,T.WALL];
	this.tilemap = new TileMap(32, ROWS.map((c:number) => {
	    return new Int32Array(12).fill(c);
	}));
	this.layer = new ScrollLayer3(this.tilemap.bounds);
	this.layer.tilemap = this.tilemap;
	this.layer.tiles = TILES;
	this.speed = new Vec2(2, 0);
	this.player = new Player(this, this.screen.center());
	this.player.scored.subscribe(() => {
	    this.speed.x += 1;
	});
	this.layer.addObject(this.player);
	this.tilemap.set(8, 2, T.BLOCK);
	
	// show a banner.
	let banner = new TextBox(this.screen, APP.shadowFont);
	banner.putText(['GET ALL TEH DAMN THINGIES!'], 'center', 'center');
	banner.lifetime = 2.0;
	banner.update = (() => {
	    banner.visible = (phase(banner.time, 0.5) != 0);
	});
	this.layer.addObject(banner);
    }

    tick(t: number) {
	super.tick(t);
	this.layer.tick(t);
	this.moveAll(this.speed);
    }

    setDir(v: Vec2) {
	this.player.setMove(v);
    }

    setAction(action: boolean) {
	this.player.setJump(action? Infinity : 0);
    }
    
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,128,224)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	super.render(ctx, bx, by);
	let dy = (this.screen.height-this.layer.window.height)/2
	this.layer.render3(ctx, bx, by+dy);
    }

    moveAll(v: Vec2) {
	this.layer.moveCenter(v);
	let ts = this.tilemap.tilesize;
	let window = this.layer.window;
	let x0 = int(window.x/ts);
	let y0 = int(window.y/ts);
	if (x0 !== 0 || y0 !== 0) {
	    // warp all the tiles and characters.
	    this.shiftTiles(x0, y0);
	    let vw = new Vec2(-x0*ts, -y0*ts);
	    this.layer.moveCenter(vw);
	    this.layer.moveAll(vw);
	}
	if (this.player.alive) {
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
		this.layer.addObject(new Thingy(this, rect.center()));
		this.tilemap.set(x, y, T.NONE);
	    }
	}
	this.tilemap.shift(-vx, -vy);
    }

}
