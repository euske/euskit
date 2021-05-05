/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="tilemap.ts" />
/// <reference path="entity.ts" />


//  GridConfig
//
class GridConfig {

    tilemap: TileMap;
    gridsize: number;
    offset: number;

    constructor(tilemap:TileMap, resolution=1) {
        this.tilemap = tilemap;
        this.gridsize = tilemap.tilesize/resolution;
        this.offset = fmod(this.gridsize, tilemap.tilesize)/2;
    }

    coord2grid(p: Vec2) {
        return new Vec2(
            int((p.x-this.offset)/this.gridsize),
            int((p.y-this.offset)/this.gridsize));
    }

    grid2coord(p: Vec2) {
        return new Vec2(
            int((p.x+.5)*this.gridsize)+this.offset,
            int((p.y+.5)*this.gridsize)+this.offset);
    }

    clip(rect: Rect) {
        return this.tilemap.bounds.intersection(rect);
    }
}


//  PlanActor
//
interface PlanActor {
    setAction(action: PlanAction): void;
}


//  PlanAction
//
function getKey(x: number, y: number, context: string=null)
{
    return (context === null)? (x+','+y) : (x+','+y+':'+context);
}

class PlanAction {

    p: Vec2;
    next: PlanAction;
    cost: number;
    context: string;

    constructor(p: Vec2,
                next: PlanAction=null,
                cost=0,
                context: string=null) {
        this.p = p.copy();
        this.next = next;
        this.cost = cost;
        this.context = context;
    }

    getKey() {
        return getKey(this.p.x, this.p.y, this.context);
    }

    getColor() {
        return (null as string);
    }

    getList() {
        let a: PlanAction[] = [];
        let action: PlanAction = this;
        while (action !== null) {
            a.push(action);
            action = action.next;
        }
        return a;

    }

    chain(next: PlanAction) {
        let action: PlanAction = this;
        while (true) {
            if (action.next === null) {
                action.next = next;
                break;
            }
            action = action.next;
        }
        return next;
    }

    toString() {
        return ('<PlanAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
    }
}

class NullAction extends PlanAction {
    toString() {
        return ('<NullAction('+this.p.x+','+this.p.y+')>');
    }
}


//  PlanMap
//
class PlanActionEntry {
    action: PlanAction;
    total: number;
    constructor(action: PlanAction, total: number) {
        this.action = action;
        this.total = total;
    }
}
class PlanMap {

    private _map:  { [index:string]: PlanAction } = {};
    private _queue: PlanActionEntry[] = [];
    private _goal: Vec2 = null;   // for debugging
    private _start: Vec2 = null;  // for debugging

    toString() {
        return ('<PlanMap>');
    }

    addAction(start: Vec2, action: PlanAction) {
        let key = action.getKey();
        let prev = this._map[key];
        if (prev === undefined || action.cost < prev.cost) {
            this._map[key] = action;
            let dist = ((start === null)? Infinity :
                        (Math.abs(start.x-action.p.x)+
                         Math.abs(start.y-action.p.y)));
            this._queue.push(new PlanActionEntry(action, dist+action.cost));
        }
    }

    getAction(x: number, y: number, context: string=null) {
        let k = getKey(x, y, context);
        if (this._map.hasOwnProperty(k)) {
            return this._map[k];
        } else {
            return null;
        }
    }

    render(ctx: CanvasRenderingContext2D, grid: GridConfig) {
        let gs = grid.gridsize;
        let rs = gs/2;
        ctx.lineWidth = 1;
        for (let k in this._map) {
            let action = this._map[k];
            let color = action.getColor();
            if (color !== null) {
                let p0 = grid.grid2coord(action.p);
                ctx.strokeStyle = color;
                ctx.strokeRect(p0.x-rs/2+.5,
                               p0.y-rs/2+.5,
                               rs, rs);
                if (action.next !== null) {
                    let p1 = grid.grid2coord(action.next.p);
                    ctx.beginPath();
                    ctx.moveTo(p0.x+.5, p0.y+.5);
                    ctx.lineTo(p1.x+.5, p1.y+.5);
                    ctx.stroke();
                }
            }
        }
        if (this._goal !== null) {
            let p = grid.grid2coord(this._goal);
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(p.x-gs/2+.5,
                           p.y-gs/2+.5,
                           gs, gs);
        }
        if (this._start !== null) {
            let p = grid.grid2coord(this._start);
            ctx.strokeStyle = '#ff0000';
            ctx.strokeRect(p.x-gs/2+.5,
                           p.y-gs/2+.5,
                           gs, gs);
        }
    }

    build(actor: PlanActor, goal: Vec2, range: Rect,
          start: Vec2=null, maxcost=Infinity): PlanAction {
        //info("build: goal="+goal+", start="+start+", range="+range+", maxcost="+maxcost);
        this._map = {};
        this._queue = [];
        this._goal = goal;
        this._start = start;
        this.addAction(null, new NullAction(goal));
        while (0 < this._queue.length) {
            let entry = this._queue.shift();
            let action = entry.action;
            if (start !== null && start.equals(action.p)) return action;
            if (maxcost <= action.cost) continue;
            this.expand(actor, range, action, start);
            // A* search.
            if (start !== null) {
                this._queue.sort((a:PlanActionEntry,b:PlanActionEntry) => {
                    return a.total-b.total;
                });
            }
        }
        return null;
    }

    expand(actor: PlanActor, range: Rect, prev: PlanAction,
           start: Vec2=null) {
        // [OVERRIDE]
    }
}


//  ActionRunner
//
class ActionRunner extends Task {

    actor: PlanActor;
    action: PlanAction;
    timeout: number;

    constructor(actor: PlanActor, action: PlanAction, timeout=Infinity) {
        super();
        this.actor = actor;
        this.timeout = timeout;

        this.actor.setAction(action);
        this.action = action;
        this.lifetime = timeout;
    }

    toString() {
        return ('<ActionRunner: actor='+this.actor+', action='+this.action+'>');
    }

    onTick() {
        super.onTick();
        let action = this.action;
        if (action !== null) {
            action = this.execute(action);
            if (action === null) {
                this.actor.setAction(action);
                this.stop();
            } else if (action !== this.action) {
                this.actor.setAction(action);
                this.lifetime = this.timeout;
            }
            this.action = action;
        }
    }

    execute(action: PlanAction): PlanAction {
        if (action instanceof NullAction) {
            return action.next;
        }
        return action;
    }
}


//  WalkerActor
//
interface WalkerActor extends PlanActor {
    canMoveTo(p: Vec2): boolean;
    moveToward(p: Vec2): void;
    isCloseTo(p: Vec2): boolean;
}

//  WalkerAction
//
class WalkerAction extends PlanAction {
    toString() {
        return ('<WalkerAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
    }
    getColor(): string { return null; }
}
class WalkerWalkAction extends WalkerAction {
    toString() {
        return ('<WalkerWalkAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
    }
    getColor(): string { return 'white'; }
}

//  WalkerPlanMap
//
class WalkerPlanMap extends PlanMap {

    grid: GridConfig;
    obstacle: RangeMap;

    constructor(grid: GridConfig, obstacle: RangeMap) {
        super();
        this.grid = grid;
        this.obstacle = obstacle;
    }

    expand(actor: WalkerActor, range: Rect,
           prev: WalkerAction, start: Vec2=null) {
        let p0 = prev.p;
        let cost0 = prev.cost;
        // assert(range.containsPt(p0));

        // try walking.
        for (let i = 0; i < 4; i++) {
            let d = new Vec2(1,0).rot90(i);
            let p1 = p0.add(d);
            if (range.containsPt(p1) &&
                actor.canMoveTo(p1)) {
                this.addAction(start, new WalkerWalkAction(
                    p1, prev, cost0+1, null));
            }
        }
    }
}

//  WalkerActionRunner
//
class WalkerActionRunner extends ActionRunner {

    goal: Vec2;

    constructor(actor: WalkerActor, action: PlanAction,
                goal: Vec2, timeout=Infinity) {
        super(actor, action, timeout);
        this.goal = goal;
    }

    execute(action: PlanAction): PlanAction {
        let actor = this.actor as WalkerActor;;

        if (action instanceof WalkerWalkAction) {
            let dst = action.next.p;
            actor.moveToward(dst);
            if (actor.isCloseTo(dst)) {
                return action.next;
            }
        }
        return super.execute(action);
    }
}


//  WalkerEntity
//
class WalkerEntity extends TileMapEntity implements WalkerActor {

    grid: GridConfig;
    gridbox: Rect;
    planmap: WalkerPlanMap;
    allowance: number;

    runner: ActionRunner = null;

    constructor(grid: GridConfig, objmap: RangeMap,
                hitbox: Rect, pos: Vec2, allowance=0) {
        super(grid.tilemap, pos);
        this.grid = grid;
        let gs = grid.gridsize;
        this.gridbox = new Rect(
            0, 0,
            Math.ceil(hitbox.width/gs)*gs,
            Math.ceil(hitbox.height/gs)*gs);
        this.planmap = new WalkerPlanMap(this.grid, objmap);
        this.allowance = (allowance !== 0)? allowance : grid.gridsize/2;
    }

    buildPlan(goal: Vec2, start: Vec2=null, size=0, maxcost=20) {
        start = (start !== null)? start : this.getGridPos();
        let range = (size == 0)? this.grid.tilemap.bounds : goal.inflate(size, size);
        range = this.grid.clip(range);
        return this.planmap.build(this, goal, range, start, maxcost) as WalkerAction;
    }

    setRunner(runner: ActionRunner) {
        if (this.runner !== null) {
            this.runner.stop();
        }
        this.runner = runner;
        if (this.runner !== null) {
            this.runner.stopped.subscribe(() => { this.runner = null; });
            this.parent.add(this.runner);
        }
    }

    setAction(action: PlanAction) {
        // [OVERRIDE]
    }

    // WalkerActor methods

    canMoveTo(p: Vec2) {
        let hitbox = this.getGridBoxAt(p);
        return !this.planmap.obstacle.exists(this.grid.tilemap.coord2map(hitbox));
    }

    moveToward(p: Vec2) {
        let p0 = this.pos;
        let p1 = this.getGridBoxAt(p).center();
        let v = p1.sub(p0);
        v = this.getMove(v);
        this.pos = this.pos.add(v);
    }

    isCloseTo(p: Vec2) {
        return this.grid.grid2coord(p).distance(this.pos) < this.allowance;
    }

    getGridPos() {
        return this.grid.coord2grid(this.pos);
    }
    getGridBoxAt(p: Vec2) {
        return this.grid.grid2coord(p).expand(this.gridbox.width, this.gridbox.height);
    }
}
