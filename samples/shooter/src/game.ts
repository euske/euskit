/// <reference path="base/utils.ts" />
/// <reference path="base/geom.ts" />
/// <reference path="base/entity.ts" />
/// <reference path="base/text.ts" />
/// <reference path="base/scene.ts" />
/// <reference path="base/app.ts" />
///  shooter.ts
///


//  Bullet
//
class Bullet extends Projectile {
    constructor(pos: Vec2) {
	super(pos);
	let bounds = new Rect(-4, -1, 8, 2);
	this.imgsrc = new DummyImageSource('white', bounds)
	this.collider = bounds;
    }
}


//  Player
//
class Player extends Entity {

    scene: Shooter;
    usermove: Vec2;
    firing: boolean;
    firetick: number;

    constructor(scene: Shooter, pos: Vec2) {
	super(pos);
	this.scene = scene;
	this.imgsrc = scene.sprites.get(0);
	this.collider = this.imgsrc.dstRect;
	this.usermove = new Vec2();
    }

    update() {
	super.update();
	this.moveIfPossible(this.usermove, true);
	if (this.firing && this.firetick == 0) {
	    this.firetick = 4;
	    var bullet = new Bullet(this.pos);
	    bullet.movement = new Vec2(8, 0);
	    bullet.frame = this.scene.screen;
	    this.scene.addObject(bullet);
	    playSound(APP.audios['pew']);
	} else {
	    this.firetick = lowerbound(0, this.firetick-1)
	}
    }

    setFire(firing: boolean) {
	if (!this.firing) {
	    this.firetick = 0;
	}
	this.firing = firing;
    }
    
    setMove(v: Vec2) {
	this.usermove = v.scale(4);
    }
    
    getFencesFor(range: Rect, force: boolean): Rect[] {
	return [this.scene.screen];
    }    
}


//  EnemyBase
//
class EnemyBase extends Projectile {
    collide(entity: Entity) {
	if (entity instanceof Bullet) {
	    playSound(APP.audios['explosion']);
	    this.die();
	}
    }
}


//  Enemy1
//
class Enemy1 extends Projectile {

    constructor(scene: Shooter, pos: Vec2) {
	super(pos);
	this.imgsrc = scene.sprites.get(1);
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
	this.imgsrc = scene.sprites.get(2);
	this.collider = this.imgsrc.dstRect;
	this.movement = new Vec2(-rnd(1,4), 0);
	this.frame = scene.screen;
    }

    update() {
	super.update();
	if (rnd(4) == 0) {
	    this.movement.y = rnd(5)-2;
	}
    }
}
applyMixins(Enemy2, [EnemyBase]);


//  Shooter
// 
class Shooter extends GameScene {

    sprites: SpriteSheet;
    player: Player;
    stars: StarSprite;
    count: number;

    constructor(app: App) {
	super(app);
	this.sprites = new ImageSpriteSheet(
	    APP.images['sprites'], new Vec2(16,16), new Vec2(8,8));
    }
    
    init() {
	super.init();
	this.player = new Player(this, this.screen.center());
	this.addObject(this.player);
	this.stars = new StarSprite(this.screen, 100);
	this.stars.imgsrc = new DummyImageSource('white', new Rect(0,0,1,1));
	this.stars.velocity = new Vec2(-4, 0);
	this.count = 0;
    }

    tick(t: number) {
	super.tick(t);
	this.stars.tick(t);
	this.count--;
	if (this.count <= 0) {
	    let pos = new Vec2(this.screen.width, rnd(this.screen.height));
	    if (rnd(2) == 0) {
		this.addObject(new Enemy1(this, pos));
	    } else {
		this.addObject(new Enemy2(this, pos));
	    }
	    this.count = 10+rnd(20);
	}
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
