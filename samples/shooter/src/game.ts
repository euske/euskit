/// <reference path="base/utils.ts" />
/// <reference path="base/geom.ts" />
/// <reference path="base/entity.ts" />
/// <reference path="base/text.ts" />
/// <reference path="base/scene.ts" />
/// <reference path="base/app.ts" />

//  Shooter
//
//  A basic shoot-em up using multiple enemy types.
//

let SPRITES:ImageSpriteSheet = null;


//  Bullet
//
class Bullet extends Projectile {
    constructor(pos: Vec2) {
	super(pos);
	let bounds = new Rect(-4, -1, 8, 2);
	this.imgsrc = new FillImageSource('white', bounds)
	this.collider = bounds;
    }
}


//  Explosion
//
class Explosion extends Sprite {
    constructor(pos: Vec2) {
	super(pos);
	this.imgsrc = SPRITES.get(4);
	this.lifetime = 0.2;
    }
}


//  Player
//
class Player extends Entity {

    scene: Shooter;
    usermove: Vec2 = new Vec2();
    firing: boolean = false;
    nextfire: number = 0;

    constructor(scene: Shooter, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.imgsrc = SPRITES.get(0);
	this.collider = this.imgsrc.dstRect;
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
		this.scene.addObject(bullet);
		playSound(APP.audios['pew']);
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
    
    getFencesFor(range: Rect, context: string): Rect[] {
	// Restrict its position within the screen.
	return [this.scene.screen];
    }    
}


//  EnemyBase
//  This class has the common methods for all enemies.
//  They can be mixed in with applyMixins().
//
class EnemyBase extends Projectile {

    collidedWith(entity: Entity) {
	if (entity instanceof Bullet) {
	    playSound(APP.audios['explosion']);
	    this.die();
	    this.layer.addObject(new Explosion(this.pos));
	}
    }
}


//  Enemy1
//
class Enemy1 extends Projectile {

    constructor(scene: Shooter, pos: Vec2) {
	super(pos);
	this.imgsrc = SPRITES.get(1);
	this.collider = this.imgsrc.dstRect;
	this.movement = new Vec2(-rnd(1,8), rnd(3)-1);
	this.frame = scene.screen;
    }
}
applyMixins(Enemy1, [EnemyBase]);


//  Enemy2
//
class Enemy2 extends Projectile {

    constructor(scene: Shooter, pos: Vec2) {
	super(pos);
	this.imgsrc = SPRITES.get(2);
	this.collider = this.imgsrc.dstRect;
	this.movement = new Vec2(-rnd(1,4), 0);
	this.frame = scene.screen;
    }

    update() {
	super.update();
	// Move wiggly vertically.
	if (rnd(4) == 0) {
	    this.movement.y = rnd(5)-2;
	}
    }
}
applyMixins(Enemy2, [EnemyBase]);


//  Shooter
// 
class Shooter extends GameScene {

    player: Player;
    stars: StarSprite;
    nextenemy: number;

    constructor(app: App) {
	super(app);
	SPRITES = new ImageSpriteSheet(
	    APP.images['sprites'], new Vec2(16,16), new Vec2(8,8));
    }
    
    init() {
	super.init();
	this.player = new Player(this, this.screen.center());
	this.addObject(this.player);
	this.stars = new StarSprite(this.screen, 100);
	this.stars.imgsrc = new FillImageSource('white', new Rect(0,0,1,1));
	this.stars.velocity = new Vec2(-4, 0);
	this.nextenemy = 0;
    }

    tick(t: number) {
	super.tick(t);
	this.stars.tick(t);
	// Spawn an enemy at a random interval.
	if (this.nextenemy == 0) {
	    let pos = new Vec2(this.screen.width, rnd(this.screen.height));
	    if (rnd(2) == 0) {
		this.addObject(new Enemy1(this, pos));
	    } else {
		this.addObject(new Enemy2(this, pos));
	    }
	    this.nextenemy = 10+rnd(20);
	}
	this.nextenemy--;
    }

    setAction(action: boolean) {
	this.player.setFire(action);
    }
    
    setDir(v: Vec2) {
	this.player.setMove(v);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,32)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	super.render(ctx, bx, by);
	this.stars.render(ctx, bx, by);
    }
}
