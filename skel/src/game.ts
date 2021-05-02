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
function main() {
    APP = new App(320, 240);
    FONT = new Font(APP.images['font'], 'white');
    SPRITES = new ImageSpriteSheet(
	APP.images['sprites'], new Vec2(16,16), new Vec2(8,8));
    APP.init(new Game());
}


//  Player
//
class Player extends Entity {

    usermove: Vec2;

    constructor(pos: Vec2) {
	super(pos);
        let sprite = SPRITES.get(0);
	this.sprites = [sprite];
	this.usermove = new Vec2();
    }

    getCollider(pos: Vec2) {
        return this.sprites[0].getBounds().add(pos);
    }

    onTick() {
	super.onTick();
	this.moveIfPossible(this.usermove);
    }

    setMove(v: Vec2) {
	this.usermove = v.scale(4);
    }

    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	return [this.world.area];
    }
}


//  Game
//
class Game extends GameScene {

    player: Player;
    scoreBox: TextBox;
    score: number;

    onStart() {
	super.onStart();
	this.scoreBox = new TextBox(this.screen.inflate(-8,-8), FONT);
	this.player = new Player(this.world.area.center());
	this.add(this.player);
	this.score = 0;
	this.updateScore();
    }

    onTick() {
	super.onTick();
    }

    onDirChanged(v: Vec2) {
	this.player.setMove(v);
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,0,0)';
	fillRect(ctx, this.screen);
	super.render(ctx);
	this.scoreBox.render(ctx);
    }

    updateScore() {
	this.scoreBox.clear();
	this.scoreBox.putText(['SCORE: '+this.score]);
    }
}
