/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="tilemap.ts" />
/// <reference path="entity.ts" />
/// <reference path="pathfind.ts" />


//  PlatformerActor
//
interface PlatformerActor extends PlanActor {
    isCloseTo(p: Vec2): boolean;

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
    toString() {
        return ('<PlatformAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
    }
    getColor(): string { return null; }
}
class PlatformerWalkAction extends PlatformerAction {
    toString() {
        return ('<PlatformWalkAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
    }
    getColor(): string { return 'white'; }
}
class PlatformerFallAction extends PlatformerAction {
    toString() {
        return ('<PlatformFallAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
    }
    getColor(): string { return 'blue'; }
}
class PlatformerJumpAction extends PlatformerAction {
    toString() {
        return ('<PlatformJumpAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
    }
    getColor(): string { return 'magenta'; }
}
class PlatformerClimbAction extends PlatformerAction {
    toString() {
        return ('<PlatformClimbAction('+this.p.x+','+this.p.y+'): cost='+this.cost+'>');
    }
    getColor(): string { return 'cyan'; }
}


//  PlatformerPlanMap
//
class PlatformerPlanMap extends PlanMap {

    grid: GridConfig;
    obstacle: RangeMap;
    grabbable: RangeMap;
    stoppable: RangeMap;

    constructor(grid: GridConfig, tilemap: TileMap, physics: PhysicsConfig) {
        super();
        this.grid = grid;
        this.obstacle = tilemap.getRangeMap(
            'obstacle', physics.isObstacle);
        this.grabbable = tilemap.getRangeMap(
            'grabbable', physics.isGrabbable);
        this.stoppable = tilemap.getRangeMap(
            'stoppable', physics.isStoppable);
    }

    expand(actor: PlatformerActor, range: Rect,
           prev: PlatformerAction, start: Vec2=null) {
        let p0 = prev.p;
        let cost0 = prev.cost;
        // assert(range.containsPt(p0));

        // try climbing down.
        let dp = new Vec2(p0.x, p0.y-1);
        if (range.containsPt(dp) &&
            actor.canClimbDown(dp)) {
            this.addAction(start, new PlatformerClimbAction(
                dp, prev, cost0+1, null));
        }
        // try climbing up.
        let up = new Vec2(p0.x, p0.y+1);
        if (range.containsPt(up) &&
            actor.canClimbUp(up)) {
            this.addAction(start, new PlatformerClimbAction(
                up, prev, cost0+1, null));
        }

        // for left and right.
        for (let vx = -1; vx <= +1; vx += 2) {

            // try walking.
            let wp = new Vec2(p0.x-vx, p0.y);
            if (range.containsPt(wp) &&
                actor.canMoveTo(wp) &&
                (actor.canGrabAt(wp) ||
                 actor.canStandAt(wp))) {
                this.addAction(start, new PlatformerWalkAction(
                    wp, prev, cost0+1, null));
            }

            // try falling.
            if (actor.canStandAt(p0)) {
                let fallpts = actor.getFallPoints();
                for (let v of fallpts) {
                    // try the v.x == 0 case only once.
                    if (v.x === 0 && vx < 0) continue;
                    let fp = p0.move(-v.x*vx, -v.y);
                    if (!range.containsPt(fp)) continue;
                    if (!actor.canMoveTo(fp)) continue;
                    //  +--+....  [vx = +1]
                    //  |  |....
                    //  +-X+.... (fp.x,fp.y) original position.
                    // ##.......
                    //   ...+--+
                    //   ...|  |
                    //   ...+-X+ (p0.x,p0.y)
                    //     ######
                    if (actor.canFallTo(fp, p0)) {
                        let dc = Math.abs(v.x)+Math.abs(v.y);
                        this.addAction(start, new PlatformerFallAction(
                            fp, prev, cost0+dc, null));
                    }
                }
            }

            // try jumping.
            if (prev instanceof PlatformerFallAction) {
                let jumppts = actor.getJumpPoints();
                for (let v of jumppts) {
                    // try the v.x == 0 case only once.
                    if (v.x === 0 && vx < 0) continue;
                    let jp = p0.move(-v.x*vx, -v.y);
                    if (!range.containsPt(jp)) continue;
                    if (!actor.canMoveTo(jp)) continue;
                    if (!actor.canGrabAt(jp) && !actor.canStandAt(jp)) continue;
                    //  ....+--+  [vx = +1]
                    //  ....|  |
                    //  ....+-X+ (p0.x,p0.y) tip point
                    //  .......
                    //  +--+...
                    //  |  |...
                    //  +-X+... (jp.x,jp.y) original position.
                    // ######
                    if (actor.canJumpTo(jp, p0)) {
                        let dc = Math.abs(v.x)+Math.abs(v.y);
                        this.addAction(start, new PlatformerJumpAction(
                            jp, prev, cost0+dc, null));
                    }
                }
            } else if (actor.canStandAt(p0)) {
                let jumppts = actor.getJumpPoints();
                for (let v of jumppts) {
                    if (v.x === 0) continue;
                    let jp = p0.move(-v.x*vx, -v.y);
                    if (!range.containsPt(jp)) continue;
                    if (!actor.canMoveTo(jp)) continue;
                    if (!actor.canGrabAt(jp) && !actor.canStandAt(jp)) continue;
                    //  ....+--+  [vx = +1]
                    //  ....|  |
                    //  ....+-X+ (p0.x,p0.y) tip point
                    //  .....##
                    //  +--+...
                    //  |  |...
                    //  +-X+... (jp.x,jp.y) original position.
                    // ######
                    if (actor.canJumpTo(jp, p0)) {
                        let dc = Math.abs(v.x)+Math.abs(v.y);
                        this.addAction(start, new PlatformerJumpAction(
                            jp, prev, cost0+dc, null));
                    }
                }
            }
        }
    }
}


//  PointSet
//
class PointSet {

    pts: { [index:string]:Vec2 } = {};

    add(p: Vec2) {
        this.pts[p.x+','+p.y] = p;
    }

    exists(p: Vec2) {
        return (this.pts[p.x+','+p.y] !== undefined);
    }

    values() {
        let a:Vec2[] = [];
        for (let k in this.pts) {
            a.push(this.pts[k]);
        }
        return a;
    }
}


//  PlatformerCaps
//
class PlatformerCaps {

    grid: GridConfig;
    physics: PhysicsConfig;
    speed: Vec2;

    jumppts: Vec2[];
    fallpts: Vec2[];

    constructor(grid: GridConfig, physics: PhysicsConfig, speed: Vec2,
                maxtime=15) {
        this.grid = grid;
        this.physics = physics;
        this.speed = speed;

        this.jumppts = this.calcJumpRange(maxtime);
        this.fallpts = this.calcFallRange(maxtime);
    }

    calcJumpRange(maxtime=15) {
        let gridsize = this.grid.gridsize;
        let jumpfunc = this.physics.jumpfunc;
        let dx = this.speed.x;
        let pts = new PointSet();
        for (let jt = 1; jt < maxtime; jt++) {
            let p = new Vec2();
            let vy = 0;
            for (let t = 0; t < maxtime; t++) {
                vy = (t < jt)? jumpfunc(vy, t) : jumpfunc(vy, Infinity);
                if (0 <= vy) {
                    // tip point.
                    let cy = Math.ceil(p.y/gridsize);
                    for (let x = 0; x <= p.x; x++) {
                        let c = new Vec2(int(x/gridsize+.5), cy);
                        if (c.x == 0 && c.y == 0) continue;
                        pts.add(c);
                    }
                    break;
                }
                p.x += dx;
                p.y += vy;
            }
        }
        return pts.values();
    }

    calcFallRange(maxtime=15) {
        let gridsize = this.grid.gridsize;
        let jumpfunc = this.physics.jumpfunc;
        let dx = this.speed.x;
        let p = new Vec2();
        let vy = 0;
        let pts = new PointSet();
        for (let t = 0; t < maxtime; t++) {
            vy = jumpfunc(vy, Infinity);
            p.x += dx;
            p.y += vy;
            let cy = Math.ceil(p.y/gridsize);
            for (let x = 0; x <= p.x; x++) {
                let c = new Vec2(int(x/gridsize+.5), cy);
                if (c.x == 0 && c.y == 0) continue;
                pts.add(c);
            }
        }
        return pts.values();
    }
}


//  PlatformerActionRunner
//
class PlatformerActionRunner extends ActionRunner {

    goal: Vec2;

    constructor(actor: PlatformerActor, action: PlanAction,
                goal: Vec2, timeout=Infinity) {
        super(actor, action, timeout);
        this.goal = goal;
    }

    execute(action: PlanAction): PlanAction {
        let actor = this.actor as PlatformerActor;;
        let cur = actor.getGridPos();

        // Get a micro-level (greedy) plan.
        if (action instanceof PlatformerWalkAction ||
            action instanceof PlatformerClimbAction) {
            let dst = action.next.p;
            actor.moveToward(dst);
            if (actor.isCloseTo(dst)) {
                return action.next;
            }

        } else if (action instanceof PlatformerFallAction) {
            let dst = action.next.p;
            let path = this.findSimplePath(cur, dst);
            for (let i = 0; i < path.length; i++) {
                let r0 = actor.getGridBoxAt(path[i]);
                let r1 = actor.getGridBox();
                let v = new Vec2(r0.x-r1.x, r0.y-r1.y);
                if (actor.canMove(v)) {
                    actor.moveToward(path[i]);
                    break;
                }
            }
            if (actor.isCloseTo(dst)) {
                return action.next;
            }

        } else if (action instanceof PlatformerJumpAction) {
            let dst = action.next.p;
            if (actor.canJump() && actor.canFall() &&
                actor.isClearedFor(dst)) {
                actor.jumpToward(dst);
                // once you leap, the action is considered finished.
                return new PlatformerFallAction(
                    dst, action.next, action.next.cost, null);
            } else {
                // not landed, holding something, or has no clearance.
                actor.moveToward(cur);
            }

        }

        return super.execute(action);
    }

    // findSimplePath(x0, y0, x1, x1, cb):
    //   returns a list of points that a character can proceed without being blocked.
    //   returns null if no such path exists. This function takes O(w*h).
    //   Note: this returns only a straightforward path without any detour.
    findSimplePath(p0: Vec2, p1: Vec2) {

        class PathEntry {
            p: Vec2;
            d: number;
            next: PathEntry;
            constructor(p: Vec2, d: number, next:PathEntry) {
                this.p = p.copy();
                this.d = d;
                this.next = next;
            }
        }

        let a:PathEntry[][] = []
        let w = Math.abs(p1.x-p0.x);
        let h = Math.abs(p1.y-p0.y);
        let vx = (p0.x <= p1.x)? +1 : -1;
        let vy = (p0.y <= p1.y)? +1 : -1;
        let actor = this.actor as PlatformerActor;

        for (let dy = 0; dy <= h; dy++) {
            a.push([]);
            // y: y0...y1
            let y = p0.y+dy*vy;
            for (let dx = 0; dx <= w; dx++) {
                // x: x0...x1
                let x = p0.x+dx*vx;
                // for each point, compare the cost of (x-1,y) and (x,y-1).
                let p = new Vec2(x, y);
                let d:number;
                let e:PathEntry = null; // the closest neighbor (if exists).
                if (dx === 0 && dy === 0) {
                    d = 0;
                } else {
                    d = Infinity;
                    if (actor.canMoveTo(p)) {
                        if (0 < dx && a[dy][dx-1].d < d) {
                            e = a[dy][dx-1];
                            d = e.d+1;
                        }
                        if (0 < dy && a[dy-1][dx].d < d) {
                            e = a[dy-1][dx];
                            d = e.d+1;
                        }
                    }
                }
                // populate a[dy][dx].
                a[dy].push(new PathEntry(p, d, e));
            }
        }
        // trace them in a reverse order: from goal to start.
        let r:Vec2[] = [];
        let e = a[h][w];
        while (e !== null) {
            r.push(e.p);
            e = e.next;
        }
        return r;
    }
}


//  PlanningEntity
//
class PlanningEntity extends PlatformerEntity implements PlatformerActor {

    grid: GridConfig;
    caps: PlatformerCaps;
    gridbox: Rect;
    planmap: PlatformerPlanMap;
    allowance: number;

    runner: ActionRunner = null;

    constructor(physics: PhysicsConfig, tilemap: TileMap,
                grid: GridConfig, caps: PlatformerCaps, hitbox: Rect,
                pos: Vec2, allowance=0) {
        super(physics, tilemap, pos);
        this.grid = grid;
        this.caps = caps;
        let gs = grid.gridsize;
        this.gridbox = new Rect(
            0, 0,
            Math.ceil(hitbox.width/gs)*gs,
            Math.ceil(hitbox.height/gs)*gs);
        this.planmap = new PlatformerPlanMap(this.grid, tilemap, physics);
        this.allowance = (allowance !== 0)? allowance : grid.gridsize/2;
    }

    buildPlan(goal: Vec2, start: Vec2=null, size=0, maxcost=20) {
        start = (start !== null)? start : this.getGridPos();
        let range = (size == 0)? this.tilemap.bounds : goal.inflate(size, size);
        range = this.grid.clip(range);
        return this.planmap.build(this, goal, range, start, maxcost) as PlatformerAction;
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

    isCloseTo(p: Vec2) {
        return this.grid.grid2coord(p).distance(this.pos) < this.allowance;
    }

    // PlatformerActor methods

    getJumpPoints() {
        return this.caps.jumppts;
    }
    getFallPoints() {
        return this.caps.fallpts;
    }
    getGridPos() {
        return this.grid.coord2grid(this.pos);
    }
    getGridBox() {
        return this.pos.expand(this.gridbox.width, this.gridbox.height);
    }
    getGridBoxAt(p: Vec2) {
        return this.grid.grid2coord(p).expand(this.gridbox.width, this.gridbox.height);
    }
    canMoveTo(p: Vec2) {
        let hitbox = this.getGridBoxAt(p);
        return !this.planmap.obstacle.exists(this.tilemap.coord2map(hitbox));
    }
    canGrabAt(p: Vec2) {
        let hitbox = this.getGridBoxAt(p);
        return this.planmap.grabbable.exists(this.tilemap.coord2map(hitbox));
    }
    canStandAt(p: Vec2) {
        let hitbox = this.getGridBoxAt(p).move(0, this.grid.gridsize);
        return this.planmap.stoppable.exists(this.tilemap.coord2map(hitbox));
    }
    canClimbUp(p: Vec2) {
        let hitbox = this.getGridBoxAt(p);
        return this.planmap.grabbable.exists(this.tilemap.coord2map(hitbox));
    }
    canClimbDown(p: Vec2) {
        let rect = this.getCollider() as Rect;
        let hitbox = this.getGridBoxAt(p).move(0, rect.height);
        return this.planmap.grabbable.exists(this.tilemap.coord2map(hitbox));
    }
    canFallTo(p0: Vec2, p1: Vec2) {
        //  +--+.....
        //  |  |.....
        //  +-X+..... (p0.x,p0.y) original position.
        // ##   .....
        //      .+--+
        //      .|  |
        //      .+-X+ (p1.x,p1.y)
        //      ######
        let hb0 = this.getGridBoxAt(p0);
        let hb1 = this.getGridBoxAt(p1);
        let xc = (hb0.x < hb1.x)? hb0.x1() : hb0.x;
        let x0 = Math.min(xc, hb1.x);
        let x1 = Math.max(xc, hb1.x1());
        let y0 = Math.min(hb0.y, hb1.y);
        let y1 = Math.max(hb0.y1(), hb1.y1());
        let rect = new Rect(x0, y0, x1-x0, y1-y0);
        return !this.planmap.stoppable.exists(this.tilemap.coord2map(rect));
    }
    canJumpTo(p0: Vec2, p1: Vec2) {
        //  .....+--+
        //  .....|  |
        //  .....+-X+ (p1.x,p1.y) tip point
        //  .....
        //  +--+.
        //  |  |.
        //  +-X+. (p0.x,p0.y) original position.
        // ######
        let hb0 = this.getGridBoxAt(p0);
        let hb1 = this.getGridBoxAt(p1);
        let xc = (p0.x < p1.x)? hb1.x : hb1.x1();
        let x0 = Math.min(xc, hb0.x);
        let x1 = Math.max(xc, hb0.x1());
        let y0 = Math.min(hb0.y, hb1.y);
        let y1 = Math.max(hb0.y1(), hb1.y1());
        if (this.planmap.obstacle.exists(
            this.tilemap.coord2map(new Rect(x0, y0, x1-x0, y1-y0)))) {
            return false;
        }
        // Extra care is needed not to allow the following case:
        //      .# [rect1]
        //    +--+
        //    |  |  (this is impossiburu!)
        //    +-X+
        //       # [rect2]
        let rect = this.tilemap.coord2map(hb1);
        let dx = sign(p1.x - p0.x);
        let rect1 = (0 < dx)? rect.resize(1, 1, 'ne') : rect.resize(1, 1, 'nw');
        let rect2 = (0 < dx)? rect.resize(1, 1, 'se') : rect.resize(1, 1, 'sw');
        if (this.planmap.obstacle.exists(rect1) &&
            !this.planmap.obstacle.exists(rect1.move(-dx,0)) &&
            this.planmap.obstacle.exists(rect2)) {
            return false;
        }
        return true;
    }

    moveToward(p: Vec2) {
        let p0 = this.pos;
        let p1 = this.getGridBoxAt(p).center();
        let v = p1.sub(p0);
        let speed = this.caps.speed;
        v.x = clamp(-speed.x, v.x, +speed.x);
        v.y = clamp(-speed.y, v.y, +speed.y);
        v = this.getMove(v);
        this.pos = this.pos.add(v);
    }

    jumpToward(p: Vec2) {
        this.setJump(Infinity);
        this.moveToward(p);
    }

    isClearedFor(p1: Vec2) {
        let hb0 = this.getGridBox();
        let hb1 = this.getGridBoxAt(p1);
        let xc = (hb0.x < hb1.x)? hb1.x : hb1.x1();
        let x0 = Math.min(xc, hb0.x);
        let x1 = Math.max(xc, hb0.x1());
        let y0 = Math.min(hb0.y, hb1.y);
        let y1 = Math.max(hb0.y1(), hb1.y1());
        let rect = new Rect(x0, y0, x1-x0, y1-y0);
        return !this.planmap.obstacle.exists(this.tilemap.coord2map(rect));
    }
}
