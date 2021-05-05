/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/sprite.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/tilemap.ts" />
/// <reference path="../../../base/pathfind.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />

//  Maze
//
const TILES = [
    null,                       // 0
    new RectSprite('white', new Rect(0,0,16,16)),  // 1
    new RectSprite('yellow', new Rect(0,0,16,16)), // 2
];
let isObstacle = ((c:number) => { return c == 1; });
let isGoal = ((c:number) => { return c == 2; });


// makeMaze
function makeMaze(tilemap: TileMap, tile=0, ratio=0)
{
    let pts = [] as Vec2[];
    let dirs = [new Vec2(-1,0), new Vec2(+1,0), new Vec2(0,-1), new Vec2(0,+1)];
    pts.push(new Vec2(1,1));
    while (0 < pts.length) {
        let i = rnd(pts.length);
        let p0 = pts[i];
        pts.splice(i, 1);
        let j = rnd(dirs.length);
        let t = dirs[0];
        dirs[0] = dirs[j];
        dirs[j] = t;
        for (let d of dirs) {
            let p1 = p0.add(d);
            let p2 = p1.add(d);
            if (p2.x < 0 || p2.y < 0 ||
                tilemap.width <= p2.x || tilemap.height <= p2.y) continue;
            let hole = (tilemap.get(p2.x, p2.y) != tile);
            if (hole || Math.random() < ratio) {
                tilemap.set(p1.x, p1.y, tile);
                tilemap.set(p2.x, p2.y, tile);
            }
            if (hole) {
                pts.push(p2);
            }
        }
    }
}


//  Player
//
class Player extends TileMapEntity {

    goaled: Signal;
    usermove: Vec2;
    prevmove: Vec2;

    constructor(tilemap: TileMap, pos: Vec2) {
        super(tilemap, pos);
        this.goaled = new Signal(this);
        let sprite = new RectSprite('#0f0', new Rect(-8,-8,16,16));
        this.sprites = [sprite];
        this.collider = sprite.getBounds();
        this.isObstacle = isObstacle;
        this.usermove = new Vec2();
        this.prevmove = this.usermove;
    }

    onCollided(entity: Entity) {
        if (entity instanceof Enemy) {
            APP.playSound('beep');
        }
    }

    onTick() {
        super.onTick();
        if (!this.usermove.isZero()) {
            let v = this.getMove(this.usermove);
            if (v.isZero()) {
                v = this.getMove(this.prevmove);
            } else {
                this.prevmove = this.usermove.copy();
            }
            this.pos = this.pos.add(v);
            let bounds = this.getCollider() as Rect;
            if (this.tilemap.findTileByCoord(isGoal, bounds) !== null) {
                this.goaled.fire();
            }
        }
    }
}


//  Enemy
//
class Enemy extends WalkerEntity {

    speedlimit = new Vec2(2,2);
    target: Entity;

    constructor(grid: GridConfig, objmap: RangeMap,
                sprite: Sprite, target: Entity, pos: Vec2) {
        super(grid, objmap, sprite.getBounds(), pos, 4);
        this.sprites = [sprite];
        this.collider = sprite.getBounds();
        this.target = target;
    }

    onTick() {
        super.onTick();
        let start = this.grid.coord2grid(this.pos);
        let goal = this.grid.coord2grid(this.target.pos);
        if (this.runner instanceof WalkerActionRunner) {
            if (!this.runner.goal.equals(goal)) {
                // abandon an obsolete plan.
                this.setRunner(null);
            }
        }
        if (this.runner === null) {
            let action = this.buildPlan(goal, start, 0, 40);
            if (action !== null) {
                this.setRunner(new WalkerActionRunner(this, action, goal));
            }
        }
    }

    getMove(v: Vec2) {
        v = super.getMove(v);
        return v.clamp(this.speedlimit);
    }
}


//  Game
//
class Game extends GameScene {

    tilemap: TileMap;
    player: Player;

    onStart() {
        super.onStart();
        this.tilemap = new TileMap(16, 39, 29);
        this.tilemap.fill(1);
        makeMaze(this.tilemap, 0, 0.1);
        this.tilemap.set(this.tilemap.width-2, this.tilemap.height-2, 2);
        let rect = this.tilemap.map2coord(new Vec2(1,1));
        this.player = new Player(this.tilemap, rect.center());
        this.player.goaled.subscribe((e) => { this.changeScene(new GoalScene()); });
        this.add(this.player);
        let grid = new GridConfig(this.tilemap);
        let objmap = this.tilemap.getRangeMap('obstacle', isObstacle);
        let sprite = new RectSprite('#f80', new Rect(-8,-8,16,16));
        for (let i = 0; i < 10; i++) {
            let x = 3+2*rnd(int((this.tilemap.width-5)/2));
            let y = 3+2*rnd(int((this.tilemap.height-5)/2));
            let r = this.tilemap.map2coord(new Vec2(x,y));
            let enemy = new Enemy(grid, objmap, sprite, this.player, r.center());
            this.add(enemy);
        }
    }

    onTick() {
        super.onTick();
        let target = this.player.getCollider() as Rect
        this.world.setCenter(target.inflate(96,96), this.tilemap.bounds);
    }

    onDirChanged(v: Vec2) {
        this.player.usermove = v.scale(4);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgb(0,0,64)';
        fillRect(ctx, this.screen);
        this.tilemap.renderWindowFromBottomLeft(
            ctx, this.world.window, (x,y,c)=>{return TILES[(c<0)? 1 : c];});
        super.render(ctx);
    }
}

class GoalScene extends HTMLScene {

    constructor() {
        super('<strong>Goal!</strong>')
    }

    onStart() {
        super.onStart();
        APP.lockKeys();
        APP.playSound('goal');
    }

    change() {
        this.changeScene(new Game());
    }
}


function main() {
    APP = new App(320, 240);
    APP.init(new Game());
}
