/// <reference path="../../base/utils.ts" />
/// <reference path="../../base/geom.ts" />
/// <reference path="../../base/entity.ts" />
/// <reference path="../../base/text.ts" />
/// <reference path="../../base/scene.ts" />
/// <reference path="../../base/app.ts" />

///  game.ts
///


//  Initialize the resources.
let FONT: Font;
let SPRITES:ImageSpriteSheet;
addInitHook(() => {
    FONT = new Font(IMAGES['font'], 'white');
    SPRITES = new ImageSpriteSheet(
	IMAGES['sprites'], new Vec2(16,16), new Vec2(8,8));
});


//  Player
//
class Player extends Entity {

    scene: Game;
    usermove: Vec2;

    constructor(scene: Game, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.sprite.imgsrc = SPRITES.get(0);
	this.collider = this.sprite.imgsrc.dstRect;
	this.usermove = new Vec2();
    }

    update() {
	super.update();
	this.moveIfPossible(this.usermove);
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(4);
    }
}


//  Game
// 
class Game extends GameScene {

    player: Player;
    
    init() {
	super.init();
	this.player = new Player(this, this.screen.center());
	this.add(this.player);
    }

    tick(t: number) {
	super.tick(t);
    }

    setDir(v: Vec2) {
	this.player.setMove(v);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	super.render(ctx, bx, by);
    }
}
