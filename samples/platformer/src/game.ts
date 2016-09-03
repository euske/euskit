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


PlanningEntity.debug = true;
const JUMPFUNC = (vy:number, t:number) => {
    return (0 <= t && t <= 6)? -8 : vy+2;
};



//  WorldObject
//
class WorldObject {
    
    scene: Game;
    
    getFencesFor(range: Rect, context: string): Rect[] {
	return [this.scene.screen];
    }
    
}


//  Player
//
class Player extends PlatformerEntity {

    scene: Game;
    usermove: Vec2 = new Vec2();
    holding: boolean = false;

    constructor(scene: Game, pos: Vec2) {
	super(scene.tilemap, pos);
	this.imgsrc = scene.sprites.get(0);
	this.collider = this.imgsrc.dstRect;
	this.scene = scene;
	this.jumpfunc = JUMPFUNC;
    }

    hasLadder() {
	return this.hasTile(this.tilemap.isGrabbable);
    }

    canFall() {
	return !(this.holding && this.hasLadder());
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
	if (!this.hasLadder() && v.y < 0) {
	    v = new Vec2(v.x, 0);
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
	    playSound(APP.audios['jump']);
	}
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(8);
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
	this.imgsrc = scene.sprites.get(4);
	this.collider = this.imgsrc.dstRect;
	this.jumpfunc = JUMPFUNC;
	this.setHitbox(this.imgsrc.dstRect);
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
	this.move();
    }
}
applyMixins(Monster, [WorldObject]);


//  Game
// 
class Game extends GameScene {

    tilemap: TileMap;
    player: Player;
    profile: GridProfile;
    sprites: SpriteSheet;
    tiles: SpriteSheet;

    constructor(app: App) {
	super(app);
	this.sprites = new ImageSpriteSheet(
	    APP.images['sprites'], new Vec2(32,32), new Vec2(16,16));
	this.tiles = new ImageSpriteSheet(
	    APP.images['tiles'], new Vec2(48,48), new Vec2(0,16));
    }
    
    init() {
	super.init();
	const MAP = [
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",
	    "00000000000000000000",

	    "00000000000000000000",
	    "00001000000000000000",
	    "00000100002000000000",
	    "00000010002110000000",
	    "00110000112000110000",
	    
	    "00000001002001000100",
	    "00000011002001100001",
	    "00010000011201110000",
	    "00111000000201111000",
	    "11111111111111111111",
	];
	this.tilemap = new TileMap(32, MAP.map((v:string) => { return str2array(v); }));
	this.tilemap.isObstacle = ((c:number) => { return c == 1; });
	this.tilemap.isGrabbable = ((c:number) => { return c == 2; });
	this.tilemap.isStoppable = ((c:number) => { return c != 0; });
	this.profile = new GridProfile(this.tilemap);
	
	this.player = new Player(this, this.screen.center());
	this.add(this.player);

	let monster = new Monster(this, this.screen.center())
	monster.target = this.player;
	this.add(monster);
    }

    tick(t: number) {
	super.tick(t);
	this.player.setMove(this.app.keyDir);
	this.layer.setCenter(this.tilemap.bounds,
			     this.player.pos.expand(80,80));
    }

    setAction(action: boolean) {
	this.player.setJump(action? Infinity : 0);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	// Render the background tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, bx, by, this.layer.window, this.tiles,
	    (x,y,c) => { return (c == 0 || c == 2)? 0 : -1; });
	// Render the map tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, bx, by, this.layer.window, this.tiles,
	    (x,y,c) => { return (c == 0)? -1 : c; });
	super.render(ctx, bx, by);
    }
}
