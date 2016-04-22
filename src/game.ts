/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="entity.ts" />
/// <reference path="tilemap.ts" />
/// <reference path="text.ts" />
/// <reference path="layer.ts" />
/// <reference path="scene.ts" />
/// <reference path="app.ts" />
/// <reference path="planmap.ts" />
/// <reference path="planrunner.ts" />


function isObstacle(c:number) { return c == 1; }
function isGrabbable(c:number) { return c == 2; }
function isStoppable(c:number) { return c != 0; }
PlatformerEntity.isObstacle = isObstacle;
PlatformerEntity.isGrabbable = isGrabbable;
PlatformerEntity.isStoppable = isStoppable;
PlanningEntity.debug = true;


//  WorldObject
//
class WorldObject {
    
    scene: Game;
    
    getConstraintsFor(hitbox: Rect, force: boolean) {
	return this.scene.screen;
    }
    
}


//  Player
//
class Player extends PlatformerEntity {

    scene: Game;
    usermove: Vec2;

    constructor(scene: Game, pos: Vec2) {
	let bounds = pos.expand(16, 16);
	super(scene.tilemap, bounds, scene.sheet.get(0), bounds);
	this.scene = scene;
	this.usermove = new Vec2();
    }

    update() {
	super.update();
	this.moveIfPossible(this.usermove, true);
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(4);
    }
}
applyMixins(Player, [WorldObject]);


//  Monster
//
class Monster extends PlanningEntity {

    scene: Game;
    target: Entity;

    constructor(scene: Game, pos: Vec2) {
	let bounds = pos.expand(16, 16);
	super(scene.tilemap, bounds, scene.sheet.get(1), bounds);
	this.scene = scene;
    }

    update() {
	super.update();
	if (!this.isPlanRunning()) {
	    let runner = this.getPlan(this.target.hitbox.center())
	    if (runner !== null) {
		this.startPlan(runner);
	    }
	}
	this.move();
    }
}
applyMixins(Player, [WorldObject]);


//  Game
// 
class Game extends GameScene {

    player: Player;
    tilemap: TileMap;
    sheet: SpriteSheet;
    tiles: SpriteSheet;

    constructor(app: App) {
	super(app);
	this.sheet = new DummySpriteSheet(['green','red']);
	this.tiles = new DummySpriteSheet(['black','gray','orange']);
    }
    
    init() {
	super.init();
	this.tilemap = new TileMap(16, [
	    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
	    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
	    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
	    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
	    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],

	    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
	    [0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
	    [0,0,0,0, 0,1,0,0, 0,0,2,0, 0,0,0,0, 0,0,0,0],
	    [0,0,0,0, 0,0,1,0, 0,0,2,1, 1,0,0,0, 0,0,0,0],
	    [0,0,1,1, 0,0,0,0, 1,1,2,0, 0,0,1,1, 0,0,0,0],
	    
	    [0,0,0,0, 0,0,1,0, 0,0,2,0, 0,1,0,0, 0,1,0,0],
	    [0,0,0,0, 0,1,1,0, 0,0,2,0, 0,1,1,0, 0,0,0,1],
	    [0,0,0,1, 0,0,0,0, 0,1,1,2, 0,1,1,1, 0,0,1,0],
	    [0,0,1,1, 1,0,0,0, 0,0,0,2, 0,1,1,1, 1,0,0,0],
	    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
	]);
	
	this.player = new Player(this, this.screen.center());
	this.addObject(this.player);
	
	PlanningEntity.gridsize = 16;
	let monster = new Monster(this, this.screen.center())
	monster.target = this.player;
	this.addObject(monster);
	
	// show a banner.
	let textbox = new TextBox(this.screen, this.app.font);
	textbox.linespace = 2;
	textbox.duration = 30;
	textbox.putText(['GAEM!!1'], 'center', 'center');
	this.addObject(textbox);
    }

    tick() {
	super.tick();
	this.player.setMove(this.app.key_dir);
    }

    set_action(action: boolean) {
	this.player.setJump(action? Infinity : 0);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	this.tilemap.renderFromBottomLeft(
	    ctx, bx, by, this.tiles,
	    (x,y,c) => { return this.tilemap.get(x,y); });
	super.render(ctx, bx, by);
    }
}
