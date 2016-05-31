///  game.ts
///

var APP: App;


//  Player
//
class Player extends Entity {

    scene: Game;
    usermove: Vec2;

    constructor(scene: Game, pos: Vec2) {
	let bounds = pos.expand(16, 16);
	super(bounds, scene.sprites.get(0), bounds);
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


//  Game
// 
class Game extends GameScene {

    player: Player;
    sprites: SpriteSheet;

    constructor(app: App) {
	super(app);
	APP = app;
	this.sprites = new ImageSpriteSheet(APP.images['sprites'], new Vec2(16,16));
    }
    
    init() {
	super.init();
	this.player = new Player(this, this.screen.center());
	this.addObject(this.player);
    }

    tick() {
	super.tick();
    }

    set_dir(v: Vec2) {
	this.player.setMove(v);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	super.render(ctx, bx, by);
    }
}