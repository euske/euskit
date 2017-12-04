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
interface PlanActionMap {
    [index: string]: PlanAction;
}
class PlanActionEntry {
    action: PlanAction;
    total: number;
    constructor(action: PlanAction, total: number) {
	this.action = action;
	this.total = total;
    }
}
class PlanMap {

    grid: GridConfig;
    
    private _map: PlanActionMap;
    private _queue: PlanActionEntry[];
    private _goal: Vec2 = null;   // for debugging
    private _start: Vec2 = null;  // for debugging
    
    constructor(grid: GridConfig) {
	this.grid = grid;
    }

    toString() {
	return ('<PlanMap '+this.grid+'>');
    }

    render(ctx: CanvasRenderingContext2D) {
	let grid = this.grid;
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
	range = this.grid.clip(range);
	//log("build: goal="+goal+", start="+start+", range="+range+", maxcost="+maxcost);
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
	    this.expandPlan(actor, range, action, start);
	    // A* search.
	    if (start !== null) {
		this._queue.sort((a:PlanActionEntry,b:PlanActionEntry) => {
		    return a.total-b.total;
		});
	    }
	}
	return null;
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

    expandPlan(actor: PlanActor, range: Rect,
	       a0: PlanAction, start: Vec2=null) {
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

    update() {
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
