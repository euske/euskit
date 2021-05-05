/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/sprite.ts" />
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
function main() {
    APP = new App(640, 480);
    SPRITES = new ImageSpriteSheet(
	APP.images['sprites'], new Vec2(32,32), new Vec2(16,16));
    TILES = new ImageSpriteSheet(
	APP.images['tiles'], new Vec2(48,48), new Vec2(0,16));
    APP.init(new Game());
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
//
class ShadowSprite implements Sprite {

    shadow: ImageSprite;
    shadowPos: Vec2 = null;

    constructor() {
	this.shadow = SPRITES.get(S.SHADOW) as ImageSprite;
    }

    getBounds(): Rect {
        return this.shadow.getBounds();
    }

    render(ctx: CanvasRenderingContext2D) {
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
    }
}


//  Player
//
class Player extends PlatformerEntity {

    collider: Collider;
    scene: Game;
    shadow: ShadowSprite = new ShadowSprite();
    usermove: Vec2 = new Vec2();
    holding: boolean = true;
    picked: Signal;

    constructor(scene: Game, pos: Vec2) {
	super(scene.physics, scene.tilemap, scene.world.area, pos);
        let sprite = SPRITES.get(S.PLAYER);
	this.sprites = [this.shadow, sprite];
        this.collider = sprite.getBounds();
	this.scene = scene;
	this.picked = new Signal(this);
    }

    getCollider() {
        return this.collider.add(this.pos);
    }

    onJumped() {
        super.onJumped();
	// Release a ladder when jumping.
        this.holding = false;
    }

    onLanded() {
        super.onLanded();
	// Grab a ladder when landed.
        this.holding = true;
    }

    hasLadder() {
	let range = this.getCollider().getAABB();
	return (this.tilemap.findTileByCoord(this.physics.isGrabbable, range) !== null);
    }

    canFall() {
	return !(this.holding && this.hasLadder());
    }

    getObstaclesFor(range: Rect, v: Vec2, context: string): Rect[] {
	if (!this.holding) {
	    return this.tilemap.getTileRects(this.physics.isObstacle, range);
	}
        return super.getObstaclesFor(range, v, context);
    }

    onTick() {
	super.onTick();
	let v = this.usermove;
	if (!this.holding) {
	    v = new Vec2(v.x, 0);
	} else if (!this.hasLadder()) {
	    v = new Vec2(v.x, lowerbound(0, v.y));
	}
        v = this.getMove(v);
        this.pos = this.pos.add(v);
	this.shadow.shadowPos = findShadowPos(this.tilemap, this.pos);
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

    onCollided(entity: Entity) {
	super.onCollided(entity);
	if (entity instanceof Thingy) {
	    APP.playSound('pick');
	    entity.stop();
	    let yay = new Particle(this.pos.move(0,-16));
	    yay.sprites = [SPRITES.get(S.YAY)];
	    yay.movement = new Vec2(0,-4);
	    yay.lifetime = 0.5;
	    this.world.add(yay);
	    this.picked.fire();
	}
    }
}


//  Monster
//
class Monster extends PlanningEntity {

    collider: Collider;
    scene: Game;
    shadow: ShadowSprite = new ShadowSprite();
    target: Entity;

    constructor(scene: Game, pos: Vec2, target: Entity) {
	super(scene.physics, scene.tilemap, scene.world.area,
	      scene.grid, scene.caps, SPRITES.get(S.MONSTER).getBounds(),
	      pos, 4);
	let sprite = SPRITES.get(S.MONSTER);
	this.sprites = [this.shadow, sprite];
        this.collider = sprite.getBounds();
	this.scene = scene;
        this.target = target;
    }

    getCollider() {
        return this.collider.add(this.pos);
    }

    onTick() {
	super.onTick();
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
	this.shadow.shadowPos = findShadowPos(this.tilemap, this.pos);
    }

    setAction(action: PlanAction) {
	super.setAction(action);
        if (action !== null && !(action instanceof NullAction)) {
	    info("setAction: "+action);
        }
    }
}


//  Thingy
//
class Thingy extends Entity {

    bounds: Rect;

    constructor(pos: Vec2) {
	super(pos);
	let sprite = SPRITES.get(S.THINGY);
        this.sprites = [sprite];
        this.bounds = sprite.getBounds().inflate(-4, -4);
    }

    getCollider() {
        return this.bounds.add(this.pos);
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

    onStart() {
	super.onStart();
	this.physics = new PhysicsConfig();
	this.physics.jumpfunc = ((vy:number, t:number) => {
	    return (0 <= t && t <= 6)? -8 : vy+2;
	});
	this.physics.maxspeed = new Vec2(16, 16);
	this.physics.isObstacle =
            ((c:number) => { return c == T.BLOCK; });
	this.physics.isGrabbable =
            ((c:number) => { return c == T.LADDER; });
	this.physics.isStoppable =
            ((c:number) => { return c == T.BLOCK || c == T.LADDER; });

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
		let monster = new Monster(this, rect.center(), this.player);
		this.add(monster);
		this.watch = monster;
		break;
	    }
	    return false;
	});
    }

    onTick() {
	super.onTick();
	this.world.setCenter(
            this.player.pos.expand(80,80),
            this.tilemap.bounds);
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
	this.thingies--;
	if (this.thingies == 0) {
            let task = new Task();
            task.lifetime = 2;
            task.stopped.subscribe(() => {
		APP.lockKeys();
		this.changeScene(new Ending());
	    });
	    this.add(task);
	}
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,0,0)';
	fillRect(ctx, this.screen);
	// Render the background tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, this.world.window,
	    (x,y,c) => {
                return (c != T.BLOCK)? TILES.get(T.BACKGROUND) : null;
            });
	// Render the map tiles.
	this.tilemap.renderWindowFromBottomLeft(
	    ctx, this.world.window,
	    (x,y,c) => {
                return (c == T.BLOCK || c == T.LADDER)? TILES.get(c) : null;
            });
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
	let html = '<strong>You Won!</strong><p>Yay!';
	super(html);
    }

    change() {
	this.changeScene(new Game());
    }
}
