/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />
/// <reference path="../../../base/tilemap.ts" />
/// <reference path="../../../base/pathfind.ts" />
/// <reference path="../../../base/planplat.ts" />

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
    SPRITES = new ImageSpriteSheet(
	APP.images['sprites'], new Vec2(32,32), new Vec2(16,16));
    TILES = new ImageSpriteSheet(
	APP.images['tiles'], new Vec2(48,48), new Vec2(0,16));
});


//  WorldObject
//
class WorldObject {

    scene: Game;

    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	return [this.scene.screen];
    }

}

function findShadowPos(tilemap: TileMap, pos: Vec2) {
    let rect = tilemap.coord2map(pos);
    let p = new Vec2(rect.x, rect.y);
    while (p.y < tilemap.height) {
	let c = tilemap.get(p.x, p.y+1);
	if (c == T.BLOCK || c == -1) break;
	p.y++;
    }
    let y = tilemap.map2coord(p).center().y;
    return new Vec2(0, y-pos.y);
}


//  ShadowSprite
//  An EntitySprite with shadow.
//
class ShadowSprite extends EntitySprite {

    shadow: HTMLImageSource;
    shadowPos: Vec2 = null;

    constructor(entity: Entity) {
	super(entity);
	this.shadow = SPRITES.get(S.SHADOW) as HTMLImageSource;
    }

    renderImage(ctx: CanvasRenderingContext2D) {
	let shadow = this.shadow;
	let pos = this.shadowPos;
	if (pos !== null) {
	    ctx.save();
	    ctx.translate(pos.x, pos.y);
	    let srcRect = shadow.srcRect;
	    let dstRect = shadow.dstRect;
	    // Shadow gets smaller based on its ground distance.
	    let d = pos.y/4;
	    if (d*2 <= dstRect.width && d*2 <= dstRect.height) {
		ctx.drawImage(
		    shadow.image,
		    srcRect.x, srcRect.y, srcRect.width, srcRect.height,
		    dstRect.x+d, dstRect.y+d*2,
		    dstRect.width-d*2, dstRect.height-d*2);
	    }
	    ctx.restore();
	}
	super.renderImage(ctx);
    }
}


//  Player
//
class Player extends PlatformerEntity implements WorldObject {

    scene: Game;
    usermove: Vec2 = new Vec2();
    holding: boolean = true;
    picked: Signal;

    constructor(scene: Game, pos: Vec2) {
	super(scene.tilemap, scene.physics, pos);
	this.sprite = new ShadowSprite(this);
	this.skin = SPRITES.get(S.PLAYER);
	this.collider = this.skin.getBounds();
	this.scene = scene;
	this.picked = new Signal(this);
	// Release a ladder when jumping.
	this.jumped.subscribe(() => { this.holding = false; });
	// Grab a ladder when landed.
	this.landed.subscribe(() => { this.holding = true; });
    }

    hasLadder() {
	return this.hasTile(this.physics.isGrabbable);
    }

    canFall() {
	return !(this.holding && this.hasLadder());
    }

    getObstaclesFor(range: Rect, v: Vec2, context=null as string): Rect[] {
	if (!this.holding) {
	    return this.tilemap.getTileRects(this.physics.isObstacle, range);
	}
	return super.getObstaclesFor(range, v, context);
    }

    update() {
	super.update();
	let v = this.usermove;
	if (!this.holding) {
	    v = new Vec2(v.x, 0);
	} else if (!this.hasLadder()) {
	    v = new Vec2(v.x, lowerbound(0, v.y));
	}
	this.moveIfPossible(v);
	(this.sprite as ShadowSprite).shadowPos = findShadowPos(this.tilemap, this.pos);
    }

    setJump(jumpend: number) {
	super.setJump(jumpend);
	if (0 < jumpend && this.isJumping()) {
	    APP.playSound('jump');
	}
    }

    setMove(v: Vec2) {
	this.usermove = v.scale(8);
	if (v.y != 0) {
	    // Grab the ladder in air.
	    this.holding = true;
	}
    }

    collidedWith(entity: Entity) {
	super.collidedWith(entity);
	if (entity instanceof Thingy) {
	    APP.playSound('pick');
	    entity.stop();
	    this.picked.fire(entity);
	}
    }
}
applyMixins(Player, [WorldObject]);


//  Monster
//
class Monster extends PlanningEntity implements WorldObject {

    scene: Game;
    target: Entity;

    constructor(scene: Game, pos: Vec2) {
	let skin = SPRITES.get(S.MONSTER);
	super(scene.tilemap, scene.physics,
	      scene.grid, scene.caps, skin.getBounds(),
	      pos, 4);
	this.scene = scene;
	this.sprite = new ShadowSprite(this);
	this.skin = skin;
	this.collider = skin.getBounds();
    }

    update() {
	super.update();
	let goal = this.grid.coord2grid(this.target.pos);
	if (this.runner instanceof PlatformerActionRunner) {
	    if (!this.runner.goal.equals(goal)) {
		// abandon an obsolete plan.
		this.setRunner(null);
	    }
	}
	if (this.runner === null) {
	    let action = this.buildPlan(goal);
	    if (action !== null) {
		this.setRunner(new PlatformerActionRunner(this, action, goal));
	    }
	}
	(this.sprite as ShadowSprite).shadowPos = findShadowPos(this.tilemap, this.pos);
    }

    setAction(action: PlanAction) {
	super.setAction(action);
	log("setAction: "+action);
    }
}
applyMixins(Monster, [WorldObject]);


//  Thingy
//
class Thingy extends Entity {

    constructor(pos: Vec2) {
	super(pos);
	this.skin = SPRITES.get(S.THINGY);
	this.collider = this.skin.getBounds().inflate(-4, -4);
    }
}


//  Game
//
class Game extends GameScene {

    physics: PhysicsConfig;
    tilemap: TileMap;
    grid: GridConfig;
    caps: PlatformerCaps;
    player: Player;
    thingies: number;

    debug: boolean = false;
    watch: PlanningEntity = null;

    init() {
	super.init();
	this.physics = new PhysicsConfig();
	this.physics.jumpfunc = ((vy:number, t:number) => {
	    return (0 <= t && t <= 6)? -8 : vy+2;
	});
	this.physics.maxspeed = new Vec2(16, 16);
	this.physics.isObstacle = ((c:number) => { return c == T.BLOCK; });
	this.physics.isGrabbable = ((c:number) => { return c == T.LADDER; });
	this.physics.isStoppable = ((c:number) => { return c == T.BLOCK || c == T.LADDER; });

	const MAP = [
	    "00000000000000300000",
	    "00002111210001121100",
	    "00112000200000020000",
	    "00000000200000111211",
	    "00300011111000000200",
	    "00100300002000000200",
	    "00000000002111121100",
	    "00000110002000020000",
	    "00000000002000020830",
	    "00110002111000111111",
	    "00000002000000002000",
	    "11030111112110002003",
	    "00010000002000112110",
	    "31020100092000002000",
	    "11111111111111111111",
	];
	this.tilemap = new TileMap(32, 20, 15, MAP.map(
	    (v:string) => { return str2array(v); }
	));
	this.grid = new GridConfig(this.tilemap);
	this.caps = new PlatformerCaps(this.grid, this.physics, new Vec2(4, 4));

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
		this.watch = monster;
		break;
	    }
	    return false;
	});
    }

    update() {
	super.update();
	this.camera.setCenter(this.tilemap.bounds,
			      this.player.pos.expand(80,80));
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
	yay.skin = SPRITES.get(S.YAY);
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

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,0,0)';
	fillRect(ctx, this.screen);
	// Render the background tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, this.camera.window,
	    (x,y,c) => { return (c != T.BLOCK)? TILES.get(T.BACKGROUND) : null; });
	// Render the map tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, this.camera.window,
	    (x,y,c) => { return (c == T.BLOCK || c == T.LADDER)? TILES.get(c) : null; });
	super.render(ctx);
	// Render the planmap.
	if (this.debug) {
	    if (this.watch !== null && this.watch.runner !== null) {
		this.watch.planmap.render(ctx, this.grid);
	    }
	}
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
