/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/sprite.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />

//  Scramble
//
//  Shooter + scrolling terrain. Mouse support.
//


//  Initialize the resources.
let FONT: Font;
let SPRITES:ImageSpriteSheet;
let TILES:SpriteSheet = new ArraySpriteSheet(
    [null, new RectSprite('red', new Rect(0,0,16,16))]);
addInitHook(() => {
    FONT = new Font(APP.images['font'], 'white');
    SPRITES = new ImageSpriteSheet(
	APP.images['sprites'], new Vec2(16,16), new Vec2(8,8));
});

function isTerrain(c:number) {
    return (c != 0);
}


//  Explosion
//
class Explosion extends Entity {
    constructor(pos: Vec2) {
	super(pos);
	this.sprites = [SPRITES.get(1)];
	this.lifetime = 0.2;
    }
}


//  Enemy
//
class Enemy extends Particle {

    killed: Signal;

    constructor(pos: Vec2) {
	super(pos);
	this.killed = new Signal(this);
    }

    getFrame() {
	return this.world.area;
    }

    onCollided(entity: Entity) {
	if (entity instanceof Bullet ||
            entity instanceof Bomb) {
	    APP.playSound('explosion');
	    this.chain(new Explosion(this.pos));
	    this.stop();
	    this.killed.fire();
	}
    }
}

// Enemy1
class Enemy1 extends Enemy {

    constructor(pos: Vec2) {
	super(pos);
        let sprite = SPRITES.get(2);
	this.sprites = [sprite];
	this.collider = sprite.getBounds().inflate(-2,-2);
	this.movement = new Vec2(-rnd(1,8), rnd(3)-1);
    }
}

// Enemy2
class Enemy2 extends Enemy {

    constructor(pos: Vec2) {
	super(pos);
	let sprite = SPRITES.get(3);
        this.sprites = [sprite];
	this.collider = sprite.getBounds().inflate(-2,-2);
	this.movement = new Vec2(-rnd(1,4), 0);
    }

    onTick() {
	super.onTick();
	// Move wiggly vertically.
	if (rnd(4) == 0) {
	    this.movement.y = rnd(5)-2;
	}
    }
}

// Fuel
class Fuel extends Enemy {

    constructor(pos: Vec2) {
	super(pos);
        let sprite = SPRITES.get(4);
	this.sprites = [sprite];
	this.collider = sprite.getBounds();
    }
}

// Missile
class Missile extends Enemy {

    threshold: number;

    constructor(pos: Vec2, threshold: number) {
	super(pos);
        let sprite = SPRITES.get(5);
	this.sprites = [sprite];
	this.collider = sprite.getBounds();
        this.threshold = threshold;
    }

    onTick() {
	super.onTick();
        if (this.pos.x < this.threshold) {
	    this.movement = new Vec2(0,-4);
        }
    }
}


//  Bullet
//
class Bullet extends Particle {

    constructor(pos: Vec2) {
	super(pos);
	let bounds = new Rect(-4, -1, 8, 2);
	this.sprites = [new RectSprite('white', bounds)];
	this.collider = bounds;
	this.movement = new Vec2(8, 0);
    }

    getFrame() {
	return this.world.area;
    }
}


//  Bomb
//
class Bomb extends TileMapEntity {

    movement: Vec2;

    constructor(tilemap: TileMap, pos: Vec2) {
	super(tilemap, null, pos);
	let bounds = new Rect(-3, -2, 6, 4);
	this.sprites = [new RectSprite('cyan', bounds)];
	this.collider = bounds;
	this.movement = new Vec2(2, 0);
    }

    onTick() {
        super.onTick();
	this.movePos(this.movement);
        this.movement.y = upperbound(6, this.movement.y+1);
	let collider = this.getCollider();
	if (this.hasTile(isTerrain) ||
            !collider.overlaps(this.world.area)) {
	    this.stop();
	}
    }
}


//  Player
//
class Player extends TileMapEntity {

    usermove: Vec2 = new Vec2();
    goalpos: Vec2 = null;
    firing: boolean = false;
    droping: boolean = false;
    nextfire: number = 0;	// Firing counter
    nextdrop: number = 0;	// Droping counter

    constructor(tilemap: TileMap, pos: Vec2) {
	super(tilemap, null, pos);
        let sprite = SPRITES.get(0);
	this.sprites = [sprite];
	this.collider = sprite.getBounds().inflate(-2,-2);
    }

    onTick() {
	super.onTick();
        let v = this.usermove;
        if (this.goalpos !== null) {
            v = this.goalpos.sub(this.pos);
            if (Math.abs(v.x) < 8) { v.x = 0; }
            if (Math.abs(v.y) < 8) { v.y = 0; }
        }
	this.moveIfPossible(v.sign().scale(4));
	if (this.firing) {
	    if (this.nextfire == 0) {
		// Fire a bullet at a certain interval.
		let bullet = new Bullet(this.pos);
		this.world.add(bullet);
		APP.playSound('pew');
		this.nextfire = 5;
	    }
	    this.nextfire--;
	}
        if (this.droping) {
	    if (this.nextdrop == 0) {
		// Drop a bomb at a certain interval.
		let bomb = new Bomb(this.tilemap, this.pos);
		this.world.add(bomb);
		APP.playSound('bomb');
		this.nextdrop = 10;
	    }
            this.nextdrop--;
        }
        if (this.hasTile(isTerrain)) {
            this.onTileCollided();
        }
    }

    setFire(firing: boolean) {
	this.firing = firing;
	if (!this.firing) {
	    // Reset the counter when start shooting.
	    this.nextfire = 0;
	}
    }

    setDrop(droping: boolean) {
	this.droping = droping;
	if (!this.droping) {
	    // Reset the counter when start droping.
	    this.nextdrop = 0;
	}
    }

    setMove(v: Vec2) {
	this.usermove = v;
        this.goalpos = null;
    }
    setGoal(p: Vec2) {
        this.goalpos = p.copy();
    }

    getObstaclesFor(range: Rect, v: Vec2, context: string): Rect[] {
        return [];
    }

    getFencesFor(range: Rect, v: Vec2, context: string): Rect[] {
	// Restrict its position within the screen.
	return [this.world.area];
    }

    onCollided(entity: Entity) {
	if (entity instanceof Enemy) {
	    APP.playSound('explosion');
	    this.chain(new Explosion(this.pos));
	    this.stop();
	}
    }

    onTileCollided() {
	APP.playSound('explosion');
	this.chain(new Explosion(this.pos));
	this.stop();
    }
}


//  Scramble
//
class Scramble extends GameScene {

    tilesize: number = 16;
    scoreBox: TextBox;
    player: Player;
    terrain: TileMap;

    tx: number;
    theight: number;
    speed: number;
    spawning: number;
    score: number;

    constructor() {
	super();
	this.scoreBox = new TextBox(this.screen.inflate(-8,-8), FONT);
    }

    onStart() {
	super.onStart();
        this.world.area = new Rect(
            0, 0, this.screen.width+this.tilesize, this.screen.height);
        this.terrain = new TileMap(
            this.tilesize,
            1+int(this.world.area.width/this.tilesize),
            int(this.world.area.height/this.tilesize));
	this.player = new Player(this.terrain, this.world.area.center());
        let task = new Task();
        task.lifetime = 2;
        task.stopped.subscribe(() => { this.reset(); });
	this.player.chain(task);
	this.add(this.player);
        this.tx = 0;
        this.theight = 1;
        this.speed = 1;
        this.spawning = 0;
	this.score = 0;
	this.updateScore();
    }

    onTick() {
	super.onTick();
        this.player.movePos(new Vec2(this.speed, 0));
        this.world.moveAll(new Vec2(-this.speed, 0));
        this.tx += this.speed;
        let d = int(this.tx/this.tilesize);
        if (0 < d) {
            let dx = -d*this.tilesize;
            this.tx += dx;
            this.terrain.shift(-d, 0);
            for (let x = this.terrain.width-d; x < this.terrain.width; x++) {
                this.addTerrain(x);
            }
        }
	if (this.spawning == 0) {
            this.spawnEnemy();
	}
	this.spawning--;
    }

    onButtonPressed(keysym: KeySym) {
        switch (keysym) {
        case KeySym.Action1:
	    this.player.setFire(true);
            break;
        case KeySym.Action2:
	    this.player.setDrop(true);
            break;
        }
    }
    onButtonReleased(keysym: KeySym) {
        switch (keysym) {
        case KeySym.Action1:
	    this.player.setFire(false);
            break;
        case KeySym.Action2:
	    this.player.setDrop(false);
            break;
        }
    }
    onDirChanged(v: Vec2) {
	this.player.setMove(v);
    }

    onMouseDown(p: Vec2, button: number) {
        super.onMouseDown(p, button);
	this.player.setFire(true);
	this.player.setDrop(true);
    }
    onMouseUp(p: Vec2, button: number) {
        super.onMouseUp(p, button);
	this.player.setFire(false);
	this.player.setDrop(false);
    }
    onMouseMove(p: Vec2) {
	this.player.setGoal(p);
    }

    updateScore() {
	this.scoreBox.clear();
	this.scoreBox.putText(['SCORE:'+format(this.score)]);
    }

    addTerrain(x: number) {
        let y = this.terrain.height-this.theight;
        this.terrain.fill(1, new Rect(x, y, 1, this.theight));
        this.theight = clamp(1, this.theight+rnd(3)-1, 10);
	let rect = this.terrain.map2coord(new Vec2(x, y-1));
        let enemy: Enemy = null;
        switch (rnd(4)) {
        case 1:
            enemy = new Fuel(rect.center());
            break;
        case 2:
            enemy = new Missile(rect.center(), rnd(32, this.world.area.width-32));
            break;
        }
        if (enemy !== null) {
	    enemy.killed.subscribe(() => { this.score++; this.updateScore(); });
	    this.add(enemy);
        }
    }

    spawnEnemy() {
        let area = this.world.area;
	let pos = new Vec2(area.width, rnd(area.height));
	let enemy: Enemy;
        switch (rnd(2)) {
        case 1:
	    enemy = new Enemy1(pos);
            break;
        default:
	    enemy = new Enemy2(pos);
            break;
	}
	enemy.killed.subscribe(() => { this.score++; this.updateScore(); });
	this.add(enemy);
	this.spawning = 10+rnd(20);
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,0,32)';
	fillRect(ctx, this.screen);
        let dx = this.tx % this.tilesize;
        ctx.save();
        ctx.translate(-dx, 0);
	this.terrain.render(ctx, TILES);
        ctx.restore();
	super.render(ctx);
	this.scoreBox.render(ctx);
    }
}
