/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />
/// <reference path="../../../base/tilemap.ts" />
/// <reference path="../../../base/planmap.ts" />
/// <reference path="../../../base/planrunner.ts" />

//  Platformer
//
//  An example of intermediate level using
//  basic physics and path finding.
//


//  Initialize the resources.
let SPRITES: SpriteSheet;
enum S {
    PLAYER = 0,
    SHADOW = 1,
    THINGY = 2,
    YAY = 3,
    MONSTER = 4,
};
let TILES: SpriteSheet;
enum T {
    BACKGROUND = 0,
    BLOCK = 1,
    LADDER = 2,
    THINGY = 3,
    ENEMY = 8,
    PLAYER = 9,
}
addInitHook(() => {
    //PlanningEntity.debug = true;
    SPRITES = new ImageSpriteSheet(
	IMAGES['sprites'], new Vec2(32,32), new Vec2(16,16));
    TILES = new ImageSpriteSheet(
	IMAGES['tiles'], new Vec2(48,48), new Vec2(0,16));
});
const JUMPFUNC = (vy:number, t:number) => {
    return (0 <= t && t <= 6)? -8 : vy+2;
};
const MAXSPEED = new Vec2(16, 16);


//  WorldObject
//
class WorldObject {
    
    scene: Game;
    
    getFencesFor(range: Rect, context: string): Rect[] {
	return [this.scene.screen];
    }
    
}


//  ShadowSprite
//  An EntitySprite with shadow.
//
class ShadowSprite extends EntitySprite {

    shadow: ImageSource;
    shadowPos: Vec2 = null;
    
    constructor(entity: Entity=null) {
	super(entity);
	this.shadow = SPRITES.get(S.SHADOW);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	let imgsrc = this.shadow;
	let pos = this.shadowPos;
	if (this.entity !== null && imgsrc !== null && pos !== null) {
	    ctx.save();
	    ctx.translate(bx+int(pos.x), by+int(pos.y));
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
	super.render(ctx, bx, by);
    }
}


//  Player
//
class Player extends PlatformerEntity {

    scene: Game;
    usermove: Vec2 = new Vec2();
    holding: boolean = false;
    picked: Signal;

    constructor(scene: Game, pos: Vec2) {
	super(scene.tilemap, pos);
	this.sprite = new ShadowSprite(this);
	this.sprite.imgsrc = SPRITES.get(S.PLAYER);
	this.collider = this.sprite.imgsrc.dstRect;
	this.scene = scene;
	this.jumpfunc = JUMPFUNC;
	this.maxspeed = MAXSPEED;
	this.picked = new Signal(this);
    }

    hasLadder() {
	return this.hasTile(this.tilemap.isGrabbable);
    }

    canFall() {
	return !(this.holding && this.hasLadder());
    }

    isLanded() {
	return (this.holding && this.hasLadder()) || super.isLanded();
    }
    
    getObstaclesFor(range: Rect, v: Vec2, context=null as string): Rect[] {
	if (!this.holding) {
	    return this.tilemap.getTileRects(this.tilemap.isObstacle, range);
	}
	return super.getObstaclesFor(range, v, context);
    }
    
    update() {
	super.update();
	let v = this.usermove;
	if (this.hasLadder()) {
	    if (v.y < 0) {
		// Grab the ladder.
		this.holding = true;
	    }
	}
	if (!this.holding) {
	    v = new Vec2(v.x, 0);
	} else if (!this.hasLadder()) {
	    v = new Vec2(v.x, lowerbound(0, v.y));
	}
	if (this.isLanded() && !this.holding) {
	    (this.sprite as ShadowSprite).shadowPos = this.pos;
	} else {
	    (this.sprite as ShadowSprite).shadowPos = null;
	}
	this.moveIfPossible(v);
    }
    
    setJump(jumpend: number) {
	if (0 < jumpend) {
	    // Release the ladder when jumping.
	    this.holding = false;
	}
	super.setJump(jumpend);
	if (0 < jumpend && this.isJumping()) {
	    playSound(SOUNDS['jump']);
	}
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(8);
    }

    collidedWith(entity: Entity) {
	super.collidedWith(entity);
	if (entity instanceof Thingy) {
	    playSound(SOUNDS['pick']);
	    entity.stop();
	    this.picked.fire(entity);
	}
    }
}
applyMixins(Player, [WorldObject]);


//  Monster
//
class Monster extends PlanningEntity {

    scene: Game;
    target: Entity;

    constructor(scene: Game, pos: Vec2) {
	super(scene.profile, scene.tilemap, pos);
	this.scene = scene;
	this.sprite = new ShadowSprite(this);
	this.sprite.imgsrc = SPRITES.get(S.MONSTER);
	this.collider = this.sprite.imgsrc.dstRect;
	this.jumpfunc = JUMPFUNC;
	this.maxspeed = MAXSPEED;
	this.setHitbox(this.sprite.imgsrc.dstRect);
    }

    update() {
	super.update();
	if (!this.isPlanRunning()) {
	    let p = this.target.pos;
	    let runner = this.getPlan(p, 20, 40)
	    if (runner !== null) {
		this.startPlan(runner);
	    }
	}
	if (this.isLanded()) {
	    (this.sprite as ShadowSprite).shadowPos = this.pos;
	} else {
	    (this.sprite as ShadowSprite).shadowPos = null;
	}
	this.move();
    }
}
applyMixins(Monster, [WorldObject]);


//  Thingy
//
class Thingy extends Entity {
    
    constructor(pos: Vec2) {
	super(pos);
	this.sprite.imgsrc = SPRITES.get(S.THINGY);
	this.collider = this.sprite.imgsrc.dstRect.inflate(-4, -4);
    }
}


//  Game
// 
class Game extends GameScene {

    tilemap: TileMap;
    player: Player;
    profile: GridProfile;
    thingies: number;
    
    init() {
	super.init();
	const MAP = [
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",

	    "00003000000000000000",
	    "00001000000000000000",
	    "00000100002000000000",
	    "00000010092110000000",
	    "00110000112000110000",
	    
	    "00000001002001000100",
	    "00000011002001100001",
	    "00010000011201110000",
	    "00111000080201111000",
	    "11111111111111111111",
	];
	this.tilemap = new TileMap(32, MAP.map((v:string) => { return str2array(v); }));
	this.tilemap.isObstacle = ((c:number) => { return c == T.BLOCK; });
	this.tilemap.isGrabbable = ((c:number) => { return c == T.LADDER; });
	this.tilemap.isStoppable = ((c:number) => { return c == T.BLOCK || c == T.LADDER; });
	this.profile = new GridProfile(this.tilemap);

	// Place the player.
	let p = this.tilemap.findTile((c:number) => { return c == T.PLAYER; });
	this.player = new Player(this, this.tilemap.map2coord(p).center());
	this.player.picked.subscribe((entity:Entity) => {
	    this.onPicked(entity);
	});
	this.add(this.player);

	// Place monsters and stuff.
	this.thingies = 0;
	this.tilemap.apply((x:number, y:number, c:number) => {
	    let rect = this.tilemap.map2coord(new Vec2(x,y));
	    switch (c) {
	    case T.THINGY:
		let thingy = new Thingy(rect.center());
		this.add(thingy);
		this.thingies++;
		break;
	    case T.ENEMY:
		let monster = new Monster(this, rect.center());
		monster.target = this.player;
		this.add(monster);
		break;
	    }
	    return false;
	});
    }

    update() {
	super.update();
	this.player.setMove(APP.keyDir);
	this.layer.setCenter(this.tilemap.bounds,
			     this.player.pos.expand(80,80));
    }

    setAction(action: boolean) {
	this.player.setJump(action? Infinity : 0);
    }

    onPicked(entity: Entity) {
	let yay = new Projectile(entity.pos.move(0,-16));
	yay.sprite.imgsrc = SPRITES.get(S.YAY);
	yay.movement = new Vec2(0,-4);
	yay.lifetime = 0.5;
	this.add(yay);
	this.thingies--;
	if (this.thingies == 0) {
	    this.add(new DelayTask(2, () => { 
		APP.lockKeys();
		this.changeScene(new Ending());
	    }));
	}
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	// Render the background tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, bx, by, this.layer.window, TILES,
	    (x,y,c) => { return (c != T.BLOCK)? T.BACKGROUND : -1; });
	// Render the map tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, bx, by, this.layer.window, TILES,
	    (x,y,c) => { return (c == T.BLOCK || c == T.LADDER)? c : -1; });
	super.render(ctx, bx, by);
    }
}


//  Ending
// 
class Ending extends HTMLScene {
    
    constructor() {
	var html = '<strong>You Won!</strong><p>Yay!';
	super(html);
    }

    change() {
	this.changeScene(new Game());
    }
}
