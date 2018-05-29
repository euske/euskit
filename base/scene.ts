/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="entity.ts" />


//  World
//
class World extends ParallelTaskList {

    mouseFocus: Entity = null;
    mouseActive: Entity = null;
    mouseDown: Signal;
    mouseUp: Signal;

    area: Rect;
    window: Rect;
    entities: Entity[];

    constructor(area: Rect) {
        super();
	this.mouseDown = new Signal(this);
	this.mouseUp = new Signal(this);
	this.area = area.copy();
        this.init();
    }

    toString() {
	return '<World: '+this.area+'>';
    }

    init() {
        super.init();
        this.window = this.area.copy();
	this.entities = [];
    }

    tick() {
	super.tick();
	this.checkEntityCollisions();
    }

    add(task: Task) {
	if (task instanceof Entity) {
	    task.world = this;
            this.entities.push(task);
            this.sortEntitiesByOrder();
	}
	super.add(task);
    }

    remove(task: Task) {
	if (task instanceof Entity) {
	    removeElement(this.entities, task);
        }
	super.remove(task);
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.translate(-this.window.x, -this.window.y);
        for (let entity of this.entities) {
	    if (!entity.isRunning()) continue;
            if (!entity.visible) continue;
            if (entity.pos === null) continue;
            entity.render(ctx);
        }
	ctx.restore();
        for (let entity of this.entities) {
	    if (!entity.isRunning()) continue;
            if (!entity.visible) continue;
            if (entity.pos !== null) continue;
            entity.render(ctx);
        }
    }

    findEntityAt(p: Vec2): Entity {
        let found: Entity = null;
        for (let entity of this.entities) {
	    if (!entity.isRunning()) continue;
            if (!entity.visible) continue;
            let collider = entity.getCollider();
            if (collider instanceof Rect) {
                if (collider.containsPt(p)) {
                    if (found === null || entity.order < found.order) {
                        found = entity;
                    }
                }
            }
        }
	return found;
    }

    moveCenter(v: Vec2) {
	this.window = this.window.add(v);
    }

    setCenter(bounds: Rect, target: Rect) {
	if (this.window.width < target.width) {
	    this.window.x = (target.width-this.window.width)/2;
	} else if (target.x < this.window.x) {
	    this.window.x = target.x;
	} else if (this.window.x+this.window.width < target.x+target.width) {
	    this.window.x = target.x+target.width - this.window.width;
	}
	if (this.window.height < target.height) {
	    this.window.y = (target.height-this.window.height)/2;
	} else if (target.y < this.window.y) {
	    this.window.y = target.y;
	} else if (this.window.y+this.window.height < target.y+target.height) {
	    this.window.y = target.y+target.height - this.window.height;
	}
	this.window.x = clamp(0, this.window.x, bounds.width-this.window.width);
	this.window.y = clamp(0, this.window.y, bounds.height-this.window.height);
    }

    onMouseDown(p: Vec2, button: number) {
	if (button == 0) {
	    this.mouseFocus = this.findEntityAt(p);
	    this.mouseActive = this.mouseFocus;
	    if (this.mouseActive !== null) {
		this.mouseDown.fire(this.mouseActive, p);
	    }
	}
    }

    onMouseUp(p: Vec2, button: number) {
	if (button == 0) {
	    this.mouseFocus = this.findEntityAt(p);
	    if (this.mouseActive !== null) {
		this.mouseUp.fire(this.mouseActive, p);
	    }
	    this.mouseActive = null;
	}
    }

    onMouseMove(p: Vec2) {
	if (this.mouseActive === null) {
	    this.mouseFocus = this.findEntityAt(p);
	}
    }

    moveAll(v: Vec2) {
	for (let entity of this.entities) {
	    if (!entity.isRunning()) continue;
            if (entity.pos === null) continue;
	    entity.movePos(v);
	}
    }

    sortEntitiesByOrder() {
        this.entities.sort((a:Entity, b:Entity) => { return a.order-b.order; });
    }

    applyEntities(f: (e:Entity)=>boolean, collider0: Collider=null): Entity {
	for (let entity1 of this.entities) {
	    if (!entity1.isRunning()) continue;
	    let collider1 = entity1.getCollider();
            if (collider1 !== null && !collider1.overlaps(collider0)) continue;
            if (f(entity1)) {
                return entity1;
            }
	}
	return null;
    }

    getEntityColliders(f0: (e:Entity)=>boolean, range: Collider) {
        let a = [] as Collider[];
        let f = (entity: Entity) => {
            if (f0(entity)) {
                let collider = entity.getCollider();
                if (collider != null) {
                    a.push(collider);
                }
            }
            return false;
        }
        this.applyEntities(f, range);
    }

    checkEntityCollisions() {
	this.applyEntityPairs(
	    (e0:Entity, e1:Entity) => {
		e0.collidedWith(e1);
		e1.collidedWith(e0);
	    });
    }

    applyEntityPairs(f: (e0:Entity,e1:Entity)=>void) {
	for (let i = 0; i < this.entities.length; i++) {
	    let entity0 = this.entities[i];
	    if (!entity0.isRunning()) continue;
	    let collider0 = entity0.getCollider();
	    if (collider0 === null) continue;
            for (let j = i+1; j < this.entities.length; j++) {
                let entity1 = this.entities[j];
	        if (!entity1.isRunning()) continue;
	        let collider1 = entity1.getCollider();
	        if (collider1 === null) continue;
                if (collider0.overlaps(collider1)) {
                    f(entity0, entity1)
                }
	    }
	}
    }
}


//  Scene
//
class Scene {

    screen: Rect;

    constructor() {
	this.screen = new Rect(0, 0, APP.canvas.width, APP.canvas.height);
    }

    changeScene(scene: Scene) {
	APP.post(() => { APP.init(scene); });
    }

    init() {
	// [OVERRIDE]
    }

    cleanup() {
	// [OVERRIDE]
    }

    tick() {
	// [OVERRIDE]
    }

    render(ctx: CanvasRenderingContext2D) {
	// [OVERRIDE]
    }

    onDirChanged(v: Vec2) {
	// [OVERRIDE]
    }

    onButtonPressed(keysym: KeySym) {
	// [OVERRIDE]
    }

    onButtonReleased(keysym: KeySym) {
	// [OVERRIDE]
    }

    onKeyDown(key: number) {
	// [OVERRIDE]
    }

    onKeyUp(key: number) {
	// [OVERRIDE]
    }

    onKeyPress(char: number) {
	// [OVERRIDE]
    }

    onMouseDown(p: Vec2, button: number) {
	// [OVERRIDE]
    }

    onMouseUp(p: Vec2, button: number) {
	// [OVERRIDE]
    }

    onMouseMove(p: Vec2) {
	// [OVERRIDE]
    }

    onFocus() {
	// [OVERRIDE]
    }

    onBlur() {
	// [OVERRIDE]
    }
}


//  HTMLScene
//
class HTMLScene extends Scene {

    text: string;

    constructor(text: string) {
	super();
	this.text = text;
    }

    init() {
	super.init();
	let scene = this;
	let bounds = APP.elem.getBoundingClientRect();
	let e = APP.addElement(
	    new Rect(bounds.width/8, bounds.height/4,
		     3*bounds.width/4, bounds.height/2));
	e.align = 'left';
	e.style.padding = '10px';
	e.style.color = 'black';
	e.style.background = 'white';
	e.style.border = 'solid black 2px';
	e.innerHTML = this.text;
	e.onmousedown = ((e) => { scene.change(); });
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,0,0)';
	fillRect(ctx, this.screen);
    }

    change() {
	// [OVERRIDE]
    }

    onMouseDown(p: Vec2, button: number) {
	this.change();
    }

    onKeyDown(key: number) {
	this.change();
    }

}


//  GameScene
//
class GameScene extends Scene {

    world: World = null;

    init() {
	super.init();
        this.world = new World(this.screen);
    }

    tick() {
	super.tick();
	this.world.tick();
    }

    render(ctx: CanvasRenderingContext2D) {
	super.render(ctx);
	this.world.render(ctx);
    }

    add(task: Task) {
	this.world.add(task);
    }

    remove(task: Task) {
	this.world.remove(task);
    }

    onMouseDown(p: Vec2, button: number) {
	super.onMouseDown(p, button);
	this.world.onMouseDown(p, button);
    }

    onMouseUp(p: Vec2, button: number) {
	super.onMouseUp(p, button);
	this.world.onMouseUp(p, button);
    }

    onMouseMove(p: Vec2) {
	super.onMouseMove(p);
	this.world.onMouseMove(p);
    }
}
