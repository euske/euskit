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


//  Sprite3d
//
class Sprite3d extends Sprite {

    entity: Entity3d;
    shadow: HTMLImageSource = null;
    shadowz: number = 0;
    floating: boolean = false;
    
    constructor(entity: Entity3d=null, imgsrc: ImageSource=null) {
	super(imgsrc);
	this.entity = entity;
    }

    getBounds(pos: Vec2=null) {
	if (this.entity !== null && this.imgsrc !== null) {
	    if (pos === null) {
		pos = this.entity.pos;
	    }
	    return this.imgsrc.getBounds().add(pos);
	}
	return null;
    }

    render3(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	let pos = this.entity.pos;
	let z = this.entity.z;
	ctx.save();
	ctx.translate(bx+int(pos.x), by+int(pos.y));
	let shadow = this.shadow;
	if (shadow !== null) {
	    // Render the shadow first.
	    let srcRect = shadow.srcRect;
	    let dstRect = shadow.getBounds();
	    let d = (z-this.shadowz)/4;
	    if (d*2 <= dstRect.width && d*2 <= dstRect.height) {
		ctx.drawImage(
		    shadow.image,
		    srcRect.x, srcRect.y, srcRect.width, srcRect.height,
		    dstRect.x+d, dstRect.y+d-this.shadowz/2,
		    dstRect.width-d*2, dstRect.height-d*2);
	    }
	}
	if (this.imgsrc !== null) {
	    ctx.translate(0, -z/2);
	    if (this.rotation) {
		ctx.rotate(this.rotation);
	    }
	    ctx.scale((0 < this.scale.x)? 1 : -1,
		      (0 < this.scale.y)? 1 : -1);
	    this.imgsrc.render(ctx);
	}
	ctx.restore();
    }
}


//  Entity3d
//
class Entity3d extends Entity {

    sprite3: Sprite3d;
    depth: number = 0;

    z: number = 0;
    velocity3: Vec3 = new Vec3();
    maxspeed3: Vec3 = new Vec3();
    
    constructor(pos: Vec2) {
	super(pos);
	this.sprite3 = new Sprite3d(this);
	this.sprite = this.sprite3;
    }
    
    getPos3() {
	return new Vec3(this.pos.x, this.pos.y, this.z);
    }
    
    movePos3(v: Vec3) {
	this.pos = this.pos.move(v.x, v.y);
	this.z += v.z;
    }

    getCollider3(pos3: Vec3=null) {
	let pos = (pos3 !== null)? new Vec2(pos3.x, pos3.y) : this.pos;
	let z = (pos3 !== null)? pos3.z : this.z;
	let bounds = this.sprite3.getBounds(pos);
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
}


//  ScrollLayer3
// 
interface SpriteDictionary {
    [index: string]: Sprite[];
}
class ScrollLayer3 extends ScrollLayer {

    tilemap: TileMap = null;
    tiles: SpriteSheet = null;

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	let ts = this.tilemap.tilesize;
	let window = this.window;
	let dx = -ts;
	let dy = 0;
	let tx = bx+dx-window.x;
	let ty = by+dy-window.y;

	// Set the drawing order.
	let sprites = {} as SpriteDictionary;
	for (let sprite of this.sprites) {
	    if (sprite.visible) {
		let bounds = sprite.getBounds();
		if (bounds !== null && bounds.overlapsRect(window)) {
		    let x = int((bounds.x+bounds.width/2)/ts);
		    let y = int((bounds.y+bounds.height/2)/ts);
		    let k = x+','+y;
		    if (!sprites.hasOwnProperty(k)) {
			sprites[k] = [];
		    }
		    sprites[k].push(sprite);
		}
	    }
	}

	// Draw the tilemap.
	function f(x:number, y:number, c:number) {
	    let k = x+','+y;
	    if (sprites.hasOwnProperty(k)) {
		for (let sprite of sprites[k]) {
		    if (sprite instanceof Sprite3d) {
			if (!sprite.floating) {
			    sprite.render3(ctx, tx, ty);
			}
		    } else {
			sprite.render(ctx, tx, ty);
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
	for (let sprite of this.sprites) {
	    if (sprite.visible) {
		let bounds = sprite.getBounds();
		if (bounds === null) {
		    sprite.render(ctx, bx, by);
		} else if (bounds.overlaps(window)) {
		    if (sprite instanceof Sprite3d) {
			if (sprite.floating) {
			    sprite.render3(ctx, tx, ty);
			}
		    } else {
			sprite.render(ctx, tx, ty);
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
//  Initialize the resources.
let FONT: Font;
let SPRITES: SpriteSheet;
let TILES: SpriteSheet;
let isBlock = (c:number) => { return c == T.BLOCK; };
let isWall = (c:number) => { return c == T.WALL; };
addInitHook(() => {
    FONT = new ShadowFont(IMAGES['font'], 'white'),
    SPRITES = new ImageSpriteSheet(
	IMAGES['sprites'], new Vec2(32,32), new Vec2(16,16));
    TILES = new ImageSpriteSheet(
	IMAGES['tiles'], new Vec2(48,48), new Vec2(0,8));
});


//  Thingy
//
class Thingy extends Entity3d {
    
    shadow: HTMLImageSource;

    constructor(scene: Game, pos: Vec2) {
	super(pos);
	this.sprite3.imgsrc = SPRITES.get(S.THINGY);
	this.sprite3.shadow = SPRITES.get(S.SHADOW) as HTMLImageSource;
	this.sprite3.zOrder = 0;
	this.collider = this.sprite3.getBounds(new Vec2()).inflate(-4, -4);
	this.z = 4;
    }
}


//  Player
//
class Player extends Entity3d {
    
    scene: Game;
    picked: Signal;
    
    jumpfunc3: (vz:number, t:number) => number;
    usermove3: Vec3;

    _jumpt: number;
    _jumpend: number;
    
    constructor(scene: Game, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.picked = new Signal(this);
	this.sprite3.imgsrc = SPRITES.get(S.PLAYER)
	this.sprite3.shadow = SPRITES.get(S.SHADOW) as HTMLImageSource;
	this.sprite3.zOrder = 1;
	this.collider = this.sprite3.getBounds(new Vec2()).inflate(-4, -4);
	this.depth = scene.tilemap.tilesize;
	this.maxspeed3 = new Vec3(16, 16, 16);
	this.jumpfunc3 = (vz:number,t:number) => {
	    return (0<=t && t<=7)? 8 : vz-2;
	};
	this.usermove3 = new Vec3();
    }
    
    getObstaclesFor3(range: Box, v: Vec3, context: string) {
	let window = this.scene.layer3.window;
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
	let area = new Rect(range.origin.x, range.origin.y,
			    range.size.x, range.size.y);
	tilemap.apply(f, tilemap.coord2map(area));
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
		playSound(SOUNDS['jump']);
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
	this.sprite3.floating = (tilemap.tilesize/2 < this.z);
	if (this.sprite3.floating &&
	    tilemap.findTileByCoord(isBlock, this.sprite.getBounds())) {
	    this.sprite3.shadowz = tilemap.tilesize;
	} else {
	    this.sprite3.shadowz = 0;
	}
	let window = this.scene.layer3.window;
	if (!window.overlaps(this.getCollider())) {
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

    collidedWith(entity: Entity) {
	if (entity instanceof Thingy) {
	    playSound(SOUNDS['pick']);
	    entity.stop();
	    this.picked.fire();
	}
    }
}


//  Game
// 
class Game extends Scene {
    
    tilemap: TileMap;
    layer: Layer;
    layer3: ScrollLayer3;
    player: Player;
    score: number;
    speed: Vec2;
    
    init() {
	super.init();
	let ROWS = [T.WALL,0,0,0,0,0,T.WALL];
	this.tilemap = new TileMap(32, ROWS.map((c:number) => {
	    return new Int32Array(12).fill(c);
	}));
	this.layer = new Layer();
	this.layer3 = new ScrollLayer3(this.tilemap.bounds);
	this.layer3.tilemap = this.tilemap;
	this.layer3.tiles = TILES;
	this.score = 0;
	this.speed = new Vec2(2, 0);
	this.player = new Player(this, this.screen.center());
	this.player.picked.subscribe((entity:Entity) => {
	    this.onPicked(entity);
	});
	this.player.stopped.subscribe(() => {
	    APP.lockKeys();
	    playSound(SOUNDS['bomb']);
	    this.changeScene(new GameOver(this.score));
	});
	this.add(this.player);
	
	// show a banner.
	let banner = new BannerBox(
	    this.screen, FONT,
	    ['GET ALL TEH DAMN THINGIES!']);
	banner.lifetime = 2.0;
	banner.interval = 0.5;
	this.layer.addTask(banner);
    }

    add(task: Task) {
    	this.layer3.addTask(task);
    }

    tick() {
	super.tick();
	this.layer.tick();
	this.layer3.tick();
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
	let yay = new Projectile(entity.pos.move(0,-16));
	yay.sprite.imgsrc = SPRITES.get(S.YAY);
	yay.sprite.zOrder = 2;
	yay.movement = new Vec2(0,-4);
	yay.lifetime = 0.5;
	this.add(yay);
	this.score += 1;
	this.speed.x += 1;
    }
    
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,128,224)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	super.render(ctx, bx, by);
	let dy = (this.screen.height-this.layer3.window.height)/2
	this.layer3.render(ctx, bx, by+dy);
	this.layer.render(ctx, bx, by);
    }

    moveAll(v: Vec2) {
	this.layer3.moveCenter(v);
	let ts = this.tilemap.tilesize;
	let window = this.layer3.window;
	let x0 = int(window.x/ts);
	let y0 = int(window.y/ts);
	if (x0 !== 0 || y0 !== 0) {
	    // warp all the tiles and characters.
	    this.shiftTiles(x0, y0);
	    let vw = new Vec2(-x0*ts, -y0*ts);
	    this.layer3.moveCenter(vw);
	    this.layer3.moveAll(vw);
	}
	if (this.player.running) {
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
		this.add(new Thingy(this, rect.center()));
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
	var html = `<strong>Game Over!</strong><p>Score: ${score}`;
	super(html);
    }

    change() {
	this.changeScene(new Game());
    }
}
