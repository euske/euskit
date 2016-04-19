// planmap.ts
//   requires: utils.ts
//   requires: geom.ts
//   requires: tilemap.ts
//   requires: entity.ts


//  PlanActor
//
interface PlanActor {
    isMovable(v: Vec2): boolean;
    isLanded(): boolean;
    isHolding(): boolean;
    getGridPos(): Vec2;
    getGridBox(): Rect;
    getGridBoxAt(p: Vec2): Rect;
    getJumpPoints(): [Vec2];
    getFallPoints(): [Vec2];
    canMoveTo(p: Vec2): boolean;
    canGrabAt(p: Vec2): boolean;
    canStandAt(p: Vec2): boolean;
    canClimbUp(p: Vec2): boolean;
    canClimbDown(p: Vec2): boolean;
    canFall(p0: Vec2, p1: Vec2): boolean;
    canJump(p0: Vec2, p1: Vec2): boolean;
    moveToward(p: Vec2): void;
    jumpToward(p: Vec2): void;
}


//  PlanAction
//
enum ActionType {
    NONE=0,
    WALK,
    FALL,
    JUMP,
    CLIMB,
    MOVETO,
};

function getKey(x: number, y: number, context: string=null)
{
    return (context === null)? (x+','+y) : (x+','+y+':'+context);
}

class PlanAction {

    p: Vec2;
    context: string;
    type: ActionType;
    next: PlanAction;
    cost: number;
    key: string;

    constructor(p: Vec2,
		context: string=null,
		type: ActionType=ActionType.NONE,
		next: PlanAction=null,
		dc=0) {
	this.p = p;
	this.context = context;
	this.type = type;
	this.next = next;
	this.cost = (next === null)? 0 : next.cost+dc;
	this.key = getKey(p.x, p.y);
    }

    toString() {
	return ('<PlanAction('+this.p.x+','+this.p.y+'): '+this.type+' cost='+this.cost+'>');
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

class PlanGrid {
    gridsize: number;

    constructor(gridsize: number) {
	this.gridsize = gridsize;
    }

    coord2grid(p: Vec2) {
	let gs = this.gridsize;
	return new Vec2(int(p.x/gs),
			int(p.y/gs));
    }

    grid2coord(p: Vec2) {
	let gs = this.gridsize;
	return new Vec2(int((p.x+.5)*gs), int((p.y+.5)*gs));
    }
}

class PlanMap {

    actor: PlanActor;
    tilemap: TileMap;

    grid: PlanGrid;
    start: Vec2;
    goal: Vec2;
    
    private _map: PlanActionMap;
    private _queue: [PlanActionEntry];
    
    constructor(actor: PlanActor, grid: PlanGrid, tilemap: TileMap) {
	this.actor = actor;
	this.grid = grid;
	this.tilemap = tilemap;
	this.start = null;
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
	let prev = this._map[action.key];
	if (prev === undefined || action.cost < prev.cost) {
	    this._map[action.key] = action;
	    let dist = ((start === null)? Infinity :
			(Math.abs(start.x-action.p.x)+
			 Math.abs(start.y-action.p.y)));
	    this._queue.push(new PlanActionEntry(action, dist+action.cost));
	}
    }

    render(ctx:CanvasRenderingContext2D, bx:number, by:number) {
	let grid = this.grid;
	let gs = grid.gridsize;
	let rs = gs/2;
	ctx.lineWidth = 1;
	for (let k in this._map) {
	    let a = this._map[k];
	    let p0 = grid.grid2coord(a.p);
	    switch (a.type) {
	    case ActionType.WALK:
		ctx.strokeStyle = 'white';
		break;
	    case ActionType.FALL:
		ctx.strokeStyle = 'blue';
		break;
	    case ActionType.JUMP:
		ctx.strokeStyle = 'magenta';
		break;
	    case ActionType.CLIMB:
		ctx.strokeStyle = 'cyan';
		break;
	    default:
		continue;
	    }
	    ctx.strokeRect(bx+p0.x-rs/2+.5,
			   by+p0.y-rs/2+.5,
			   rs, rs);
	    if (a.next !== null) {
		let p1 = grid.grid2coord(a.next.p);
		ctx.beginPath();
		ctx.moveTo(bx+p0.x+.5, by+p0.y+.5);
		ctx.lineTo(bx+p1.x+.5, by+p1.y+.5);
		ctx.stroke();
	    }
	}
	if (this.start !== null) {
	    let p = grid.grid2coord(this.start);
	    ctx.strokeStyle = '#ff0000';
	    ctx.strokeRect(bx+p.x-gs/2+.5,
			   by+p.y-gs/2+.5,
			   gs, gs);
	}
	if (this.goal !== null) {
	    let p = grid.grid2coord(this.goal);
	    ctx.strokeStyle = '#00ff00';
	    ctx.strokeRect(bx+p.x-gs/2+.5,
			   by+p.y-gs/2+.5,
			   gs, gs);
	}
    }

    initPlan(goal: Vec2) {
	this.goal = goal;
	this._map = {} as PlanActionMap;
	this._queue = [] as [PlanActionEntry];
	this.addAction(null, new PlanAction(goal));
    }

    fillPlan(range: Rect, start: Vec2=null, maxcost=20) {
	this.start = start;
	while (0 < this._queue.length) {
	    let a0 = this._queue.shift().action;
	    if (maxcost <= a0.cost) continue;
	    let p = a0.p;
	    if (start !== null && start.equals(p)) return true;
	    // assert(range.contains(p));

	    // try climbing down.
	    let dp = new Vec2(p.x, p.y-1);
	    if (range.contains(dp) &&
		this.actor.canClimbDown(dp)) {
		this.addAction(start, new PlanAction(
		    dp, null, ActionType.CLIMB, a0, 1));
	    }
	    // try climbing up.
	    let up = new Vec2(p.x, p.y+1);
	    if (range.contains(up) &&
		this.actor.canClimbUp(up)) {
		this.addAction(start, new PlanAction(
		    up, null, ActionType.CLIMB, a0, 1));
	    }

	    // for left and right.
	    for (let vx = -1; vx <= +1; vx += 2) {

		// try walking.
		let wp = new Vec2(p.x-vx, p.y);
		if (range.contains(wp) &&
		    this.actor.canMoveTo(wp) &&
		    (this.actor.canGrabAt(wp) ||
		     this.actor.canStandAt(wp))) {
		    this.addAction(start, new PlanAction(
			wp, null, ActionType.WALK, a0, 1));
		}

		// try falling.
		if (this.actor.canStandAt(p)) {
		    let fallpts = this.actor.getFallPoints();
		    for (let i = 0; i < fallpts.length; i++) {
			let v = fallpts[i];
			// try the v.x == 0 case only once.
			if (v.x === 0 && vx < 0) continue;
			let fp = p.move(-v.x*vx, -v.y);
			if (!range.contains(fp)) continue;
			if (!this.actor.canMoveTo(fp)) continue;
			//  +--+....  [vx = +1]
			//  |  |....
			//  +-X+.... (fp.x,fp.y) original position.
			// ##.......
			//   ...+--+
			//   ...|  |
			//   ...+-X+ (p.x,p.y)
			//     ######
			if (this.actor.canFall(fp, p)) {
			    let dc = Math.abs(v.x)+Math.abs(v.y);
			    this.addAction(start, new PlanAction(
				fp, null, ActionType.FALL, a0, dc));
			}
		    }
		}

		// try jumping.
		if (a0.type === ActionType.FALL) {
		    let jumppts = this.actor.getJumpPoints();
		    for (let i = 0; i < jumppts.length; i++) {
			let v = jumppts[i];
			// try the v.x == 0 case only once.
			if (v.x === 0 && vx < 0) continue;
			let jp = p.move(-v.x*vx, -v.y);
			if (!range.contains(jp)) continue;
			if (!this.actor.canMoveTo(jp)) continue;
			if (!this.actor.canGrabAt(jp) && !this.actor.canStandAt(jp)) continue;
			//  ....+--+  [vx = +1]
			//  ....|  |
			//  ....+-X+ (p.x,p.y) tip point
			//  .......
			//  +--+...
			//  |  |...
			//  +-X+... (jp.x,jp.y) original position.
			// ######
			if (this.actor.canJump(jp, p)) {
			    let dc = Math.abs(v.x)+Math.abs(v.y);
			    this.addAction(start, new PlanAction(
				jp, null, ActionType.JUMP, a0, dc));
			}
		    }
		} else if (this.actor.canStandAt(p)) {
		    let jumppts = this.actor.getJumpPoints();
		    for (let i = 0; i < jumppts.length; i++) {
			let v = jumppts[i];
			if (v.x === 0) continue;
			let jp = p.move(-v.x*vx, -v.y);
			if (!range.contains(jp)) continue;
			if (!this.actor.canMoveTo(jp)) continue;
			if (!this.actor.canGrabAt(jp) && !this.actor.canStandAt(jp)) continue;
			//  ....+--+  [vx = +1]
			//  ....|  |
			//  ....+-X+ (p.x,p.y) tip point
			//  .....##
			//  +--+...
			//  |  |...
			//  +-X+... (jp.x,jp.y) original position.
			// ######
			if (this.actor.canJump(jp, p)) {
			    let dc = Math.abs(v.x)+Math.abs(v.y);
			    this.addAction(start, new PlanAction(
				jp, null, ActionType.JUMP, a0, dc));
			}
		    }
		}
	    }
	    
	    // A* search.
	    this._queue.sort(
		(a:PlanActionEntry,b:PlanActionEntry) => { return a.total-b.total; });
	}
	
	return false;
    }

}
