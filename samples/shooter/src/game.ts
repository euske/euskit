/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />

//  Shooter
//
//  A basic shoot-em up using multiple enemy types.
//


//  Initialize the resources.
let FONT: Font;
let SPRITES:ImageSpriteSheet;
addInitHook(() => {
    FONT = new Font(APP.images['font'], 'white');
    SPRITES = new ImageSpriteSheet(
	APP.images['sprites'], new Vec2(16,16), new Vec2(8,8));
});


//  Bullet
//
class Bullet extends Projectile {
    constructor(pos: Vec2) {
	super(pos);
	let bounds = new Rect(-4, -1, 8, 2);
	this.skin = new RectImageSource('white', bounds)
	this.collider = bounds;
    }
}


//  Explosion
//
class Explosion extends Entity {
    constructor(pos: Vec2) {
	super(pos);
	this.skin = SPRITES.get(4);
	this.lifetime = 0.2;
    }
}


//  Player
//
class Player extends Entity {

    scene: Shooter;
    usermove: Vec2 = new Vec2();
    firing: boolean = false;
    nextfire: number = 0;	// Firing counter

    constructor(scene: Shooter, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.skin = SPRITES.get(0);
	this.collider = this.skin.getBounds();
    }

    update() {
	super.update();
	this.moveIfPossible(this.usermove);
	if (this.firing) {
	    if (this.nextfire == 0) {
		// Shoot a bullet at a certain interval.
		var bullet = new Bullet(this.pos);
		bullet.movement = new Vec2(8, 0);
		bullet.frame = this.scene.screen;
		this.scene.add(bullet);
		APP.playSound('pew');
		this.nextfire = 4;
	    }
	    this.nextfire--;
	}
    }

    setFire(firing: boolean) {
	this.firing = firing;
	if (!this.firing) {
	    // Reset the counter when start shooting.
	    this.nextfire = 0;
	}
    }

    setMove(v: Vec2) {
	this.usermove = v.scale(4);
    }

    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	// Restrict its position within the screen.
	return [this.scene.screen];
    }

    collidedWith(entity: Entity) {
	if (entity instanceof EnemyBase) {
	    APP.playSound('explosion');
	    this.chain(new Explosion(this.pos));
	    this.stop();
	}
    }
}


//  EnemyBase
//  This class has the common methods for all enemies.
//  They can be mixed in with applyMixins().
//
class EnemyBase extends Projectile {

    killed: Signal;

    constructor(scene: Shooter, pos: Vec2) {
	super(pos);
	this.frame = scene.screen;
	this.killed = new Signal(this);
    }

    collidedWith(entity: Entity) {
	if (entity instanceof Bullet) {
	    APP.playSound('explosion');
	    this.stop();
	    this.killed.fire();
	    this.chain(new Explosion(this.pos));
	}
    }
}


//  Enemy1
//
class Enemy1 extends EnemyBase {

    constructor(scene: Shooter, pos: Vec2) {
	super(scene, pos);
	this.skin = SPRITES.get(1);
	this.collider = this.skin.getBounds();
	this.movement = new Vec2(-rnd(1,8), rnd(3)-1);
    }
}


//  Enemy2
//
class Enemy2 extends EnemyBase {

    constructor(scene: Shooter, pos: Vec2) {
	super(scene, pos);
	this.skin = SPRITES.get(2);
	this.collider = this.skin.getBounds();
	this.movement = new Vec2(-rnd(1,4), 0);
    }

    update() {
	super.update();
	// Move wiggly vertically.
	if (rnd(4) == 0) {
	    this.movement.y = rnd(5)-2;
	}
    }
}


//  Shooter
//
class Shooter extends GameScene {

    player: Player;
    stars: FixedSprite;
    nextenemy: number;		// Enemy spawning counter.
    score: number;
    scoreBox: TextBox;

    constructor() {
	super();
	this.scoreBox = new TextBox(this.screen.inflate(-8,-8), FONT);
    }

    init() {
	super.init();
	this.player = new Player(this, this.screen.center());
	this.player.chain(new DelayTask(2, () => { this.init(); }));
	this.add(this.player);
	this.stars = new FixedSprite(new StarImageSource(this.screen, 100));
	this.nextenemy = 0;
	this.score = 0;
	this.updateScore();
    }

    update() {
	super.update();
	(this.stars.skin as StarImageSource).move(new Vec2(-4, 0));
	// Spawn an enemy at a random interval.
	if (this.nextenemy == 0) {
	    let pos = new Vec2(this.screen.width, rnd(this.screen.height));
	    let enemy:EnemyBase;
	    if (rnd(2) == 0) {
		enemy = new Enemy1(this, pos);
	    } else {
		enemy = new Enemy2(this, pos);
	    }
	    // Increase the score when it's killed.
	    enemy.killed.subscribe(() => { this.score++; this.updateScore(); });
	    this.add(enemy);
	    this.nextenemy = 10+rnd(20);
	}
	this.nextenemy--;
    }

    onButtonPressed(keysym: KeySym) {
	this.player.setFire(true);
    }
    onButtonReleased(keysym: KeySym) {
	this.player.setFire(false);
    }
    onDirChanged(v: Vec2) {
	this.player.setMove(v);
    }

    updateScore() {
	// Update the text in the score box.
	this.scoreBox.clear();
	this.scoreBox.putText(['SCORE:'+format(this.score)]);
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,0,32)';
	fillRect(ctx, this.screen);
	super.render(ctx);
	this.stars.render(ctx);
	this.scoreBox.render(ctx);
    }
}
