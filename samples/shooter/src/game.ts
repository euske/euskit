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
	this.sprites = [new RectImageSource('white', bounds)];
	this.collider = bounds;
	this.movement = new Vec2(8, 0);
    }

    init() {
        super.init();
	this.frame = this.world.area;
    }
}


//  Explosion
//
class Explosion extends Entity {
    constructor(pos: Vec2) {
	super(pos);
	this.sprites = [SPRITES.get(4)];
	this.lifetime = 0.2;
    }
}


//  Player
//
class Player extends Entity {

    usermove: Vec2 = new Vec2();
    firing: boolean = false;
    nextfire: number = 0;	// Firing counter

    constructor(pos: Vec2) {
	super(pos);
        let sprite = SPRITES.get(0);
	this.sprites = [sprite];
	this.collider = sprite.getBounds();
    }

    tick() {
	super.tick();
	this.moveIfPossible(this.usermove);
	if (this.firing) {
	    if (this.nextfire == 0) {
		// Shoot a bullet at a certain interval.
		var bullet = new Bullet(this.pos);
		this.world.add(bullet);
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
	return [this.world.area];
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

    constructor(pos: Vec2) {
	super(pos);
	this.killed = new Signal(this);
    }

    init() {
        super.init();
	this.frame = this.world.area;
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

    constructor(pos: Vec2) {
	super(pos);
        let sprite = SPRITES.get(1);
	this.sprites = [sprite];
	this.collider = sprite.getBounds();
	this.movement = new Vec2(-rnd(1,8), rnd(3)-1);
    }
}


//  Enemy2
//
class Enemy2 extends EnemyBase {

    constructor(pos: Vec2) {
	super(pos);
	let sprite = SPRITES.get(2);
        this.sprites = [sprite];
	this.collider = sprite.getBounds();
	this.movement = new Vec2(-rnd(1,4), 0);
    }

    tick() {
	super.tick();
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
    stars: StarImageSource;
    nextenemy: number;		// Enemy spawning counter.
    score: number;
    scoreBox: TextBox;

    constructor() {
	super();
	this.scoreBox = new TextBox(this.screen.inflate(-8,-8), FONT);
    }

    init() {
	super.init();
	this.player = new Player(this.world.area.center());
        let task = new Task();
        task.lifetime = 2;
        task.stopped.subscribe(() => { this.init(); });
	this.player.chain(task);
	this.add(this.player);
	this.stars = new StarImageSource(this.screen, 100);
	this.nextenemy = 0;
	this.score = 0;
	this.updateScore();
    }

    tick() {
	super.tick();
	this.stars.move(new Vec2(-4, 0));
	// Spawn an enemy at a random interval.
	if (this.nextenemy == 0) {
            let area = this.world.area;
	    let pos = new Vec2(area.width, rnd(area.height));
	    let enemy:EnemyBase;
	    if (rnd(2) == 0) {
		enemy = new Enemy1(pos);
	    } else {
		enemy = new Enemy2(pos);
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
