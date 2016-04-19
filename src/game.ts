// game.ts
//   requires: utils.ts
//   requires: geom.ts
//   requires: entity.ts
//   requires: tilemap.ts
//   requires: text.ts
//   requires: layer.ts
//   requires: scene.ts
//   requires: app.ts


//  Player
//
class Player extends Entity {

    scene: Game;
    usermove: Vec2;

    constructor(scene: Game, pos: Vec2) {
	let bounds = pos.expand(16, 16);
	super(bounds, scene.sheet.get(0), bounds);
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
    
    getConstraintsFor(hitbox: Rect, force: boolean) {
	return this.scene.screen;
    }
}


//  Game
// 
class Game extends GameScene {

    player: Player;
    sheet: SpriteSheet;

    constructor(app: App) {
	super(app);
	this.sheet = new ImageSpriteSheet(app.images['sprites'], new Vec2(16,16));
    }
    
    init() {
	super.init();
	
	this.player = new Player(this, this.screen.center());
	this.addObject(this.player);
	
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

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	super.render(ctx, bx, by);
    }
}
