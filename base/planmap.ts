/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="tilemap.ts" />
/// <reference path="entity.ts" />


//  GridConfig
// 
class GridConfig {
    
    gridsize: number;
    offset: number;

    constructor(tilemap:TileMap, resolution=1) {
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
}


//  PlanActor
//
interface PlanActor {
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
    
    toString() {
	return ('<PlanAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
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
    goal: Vec2;
    
    private _map: PlanActionMap;
    private _queue: PlanActionEntry[];
    
    constructor(grid: GridConfig) {
	this.grid = grid;
	this.goal = null;
    }

    toString() {
	return ('<PlanMap '+this.goal+'>');
    }

    getAction(x: number, y: number, context: string=null) {
	let k = getKey(x, y, context);
	if (this._map.hasOwnProperty(k)) {
	    return this._map[k];
	} else {
	    return null;
	}
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

    render(ctx:CanvasRenderingContext2D, start:Vec2=null) {
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
	if (this.goal !== null) {
	    let p = grid.grid2coord(this.goal);
	    ctx.strokeStyle = '#00ff00';
	    ctx.strokeRect(p.x-gs/2+.5,
			   p.y-gs/2+.5,
			   gs, gs);
	}
	if (start !== null) {
	    let p = grid.grid2coord(start);
	    ctx.strokeStyle = '#ff0000';
	    ctx.strokeRect(p.x-gs/2+.5,
			   p.y-gs/2+.5,
			   gs, gs);
	}
    }

    initPlan(goal: Vec2) {
	this.goal = goal.copy();
	this._map = {};
	this._queue = [];
	this.addAction(null, new PlanAction(goal));
    }
    
    fillPlan(actor: PlanActor, range: Rect, start: Vec2=null, maxcost=Infinity) {
	while (0 < this._queue.length) {
	    let action = this._queue.shift().action;
	    if (maxcost <= action.cost) continue;
	    if (start !== null && start.equals(action.p)) return true;
	    this.expandPlan(actor, range, action, start);
	    // A* search.
	    this._queue.sort(
		(a:PlanActionEntry,b:PlanActionEntry) => { return a.total-b.total; });
	}
	return false;
    }

    expandPlan(actor: PlanActor, range: Rect, a0: PlanAction, start: Vec2=null) {
    }
}


//  PlatformerActionType
// 
enum ActionType {
    NONE=0,
    WALK,
    FALL,
    JUMP,
    CLIMB,
};

//  PlatformerActor
//
interface PlatformerActor extends PlanActor {
    canMove(v: Vec2): boolean;
    canJump(): boolean;
    canFall(): boolean;
    isClearedFor(p: Vec2): boolean;
    getGridPos(): Vec2;
    getGridBox(): Rect;
    getGridBoxAt(p: Vec2): Rect;
    getJumpPoints(): Vec2[];
    getFallPoints(): Vec2[];
    moveToward(p: Vec2): void;
    jumpToward(p: Vec2): void;
    
    canMoveTo(p: Vec2): boolean;
    canGrabAt(p: Vec2): boolean;
    canStandAt(p: Vec2): boolean;
    canClimbUp(p: Vec2): boolean;
    canClimbDown(p: Vec2): boolean;
    canFallTo(p0: Vec2, p1: Vec2): boolean;
    canJumpTo(p0: Vec2, p1: Vec2): boolean;
}

//  PlatformerAction
// 
class PlatformerAction extends PlanAction {
    
    type: ActionType;
    
    constructor(p: Vec2,
		next: PlanAction=null,
		cost=0,
		context: string=null,
		type: ActionType=ActionType.NONE) {
	super(p, next, cost, context);
	this.type = type;
    }

    toString() {
	return ('<PlatformAction('+this.p.x+','+this.p.y+'): cost='+this.cost+' '+this.type+'>');
    }
    
    getColor() {
	switch (this.type) {
	case ActionType.WALK:
	    return 'white';
	case ActionType.FALL:
	    return 'blue';
	case ActionType.JUMP:
	    return 'magenta';
	case ActionType.CLIMB:
	    return 'cyan';
	default:
	    return null;
	}
    }
}

// PlatformerPlanMap
// 
class PlatformerPlanMap extends PlanMap {

    expandPlan(actor: PlatformerActor, range: Rect, a0: PlatformerAction, start: Vec2=null) {
	let p = a0.p;
	// assert(range.containsPt(p));

	// try climbing down.
	let dp = new Vec2(p.x, p.y-1);
	if (range.containsPt(dp) &&
	    actor.canClimbDown(dp)) {
	    this.addAction(start, new PlatformerAction(
		dp, a0, a0.cost+1, null, ActionType.CLIMB));
	}
	// try climbing up.
	let up = new Vec2(p.x, p.y+1);
	if (range.containsPt(up) &&
	    actor.canClimbUp(up)) {
	    this.addAction(start, new PlatformerAction(
		up, a0, a0.cost+1, null, ActionType.CLIMB));
	}

	// for left and right.
	for (let vx = -1; vx <= +1; vx += 2) {

	    // try walking.
	    let wp = new Vec2(p.x-vx, p.y);
	    if (range.containsPt(wp) &&
		actor.canMoveTo(wp) &&
		(actor.canGrabAt(wp) ||
		 actor.canStandAt(wp))) {
		this.addAction(start, new PlatformerAction(
		    wp, a0, a0.cost+1, null, ActionType.WALK));
	    }

	    // try falling.
	    if (actor.canStandAt(p)) {
		let fallpts = actor.getFallPoints();
		for (let v of fallpts) {
		    // try the v.x == 0 case only once.
		    if (v.x === 0 && vx < 0) continue;
		    let fp = p.move(-v.x*vx, -v.y);
		    if (!range.containsPt(fp)) continue;
		    if (!actor.canMoveTo(fp)) continue;
		    //  +--+....  [vx = +1]
		    //  |  |....
		    //  +-X+.... (fp.x,fp.y) original position.
		    // ##.......
		    //   ...+--+
		    //   ...|  |
		    //   ...+-X+ (p.x,p.y)
		    //     ######
		    if (actor.canFallTo(fp, p)) {
			let dc = Math.abs(v.x)+Math.abs(v.y);
			this.addAction(start, new PlatformerAction(
			    fp, a0, a0.cost+dc, null, ActionType.FALL));
		    }
		}
	    }

	    // try jumping.
	    if (a0.type === ActionType.FALL) {
		let jumppts = actor.getJumpPoints();
		for (let v of jumppts) {
		    // try the v.x == 0 case only once.
		    if (v.x === 0 && vx < 0) continue;
		    let jp = p.move(-v.x*vx, -v.y);
		    if (!range.containsPt(jp)) continue;
		    if (!actor.canMoveTo(jp)) continue;
		    if (!actor.canGrabAt(jp) && !actor.canStandAt(jp)) continue;
		    //  ....+--+  [vx = +1]
		    //  ....|  |
		    //  ....+-X+ (p.x,p.y) tip point
		    //  .......
		    //  +--+...
		    //  |  |...
		    //  +-X+... (jp.x,jp.y) original position.
		    // ######
		    if (actor.canJumpTo(jp, p)) {
			let dc = Math.abs(v.x)+Math.abs(v.y);
			this.addAction(start, new PlatformerAction(
			    jp, a0, a0.cost+dc, null, ActionType.JUMP));
		    }
		}
	    } else if (actor.canStandAt(p)) {
		let jumppts = actor.getJumpPoints();
		for (let v of jumppts) {
		    if (v.x === 0) continue;
		    let jp = p.move(-v.x*vx, -v.y);
		    if (!range.containsPt(jp)) continue;
		    if (!actor.canMoveTo(jp)) continue;
		    if (!actor.canGrabAt(jp) && !actor.canStandAt(jp)) continue;
		    //  ....+--+  [vx = +1]
		    //  ....|  |
		    //  ....+-X+ (p.x,p.y) tip point
		    //  .....##
		    //  +--+...
		    //  |  |...
		    //  +-X+... (jp.x,jp.y) original position.
		    // ######
		    if (actor.canJumpTo(jp, p)) {
			let dc = Math.abs(v.x)+Math.abs(v.y);
			this.addAction(start, new PlatformerAction(
			    jp, a0, a0.cost+dc, null, ActionType.JUMP));
		    }
		}
	    }
	}
    }
}
