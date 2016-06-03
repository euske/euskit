/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="entity.ts" />


//  Layer
// 
class Layer {

    tasks: Task[];
    sprites: Sprite[];
    entities: Entity[];

    constructor() {
	this.init();
    }

    toString() {
	return ('<Layer: tasks='+this.tasks+', sprites='+
		this.sprites+', entities='+this.entities+'>');
    }
  
    init() {
	this.tasks = [];
	this.sprites = [];
	this.entities = [];
    }
  
    tick() {
	for (let i = 0; i < this.tasks.length; i++) {
	    let obj = this.tasks[i];
	    if (obj.alive) {
		obj.tick();
	    }
	}
	this.cleanObjects(this.tasks);
	this.cleanObjects(this.sprites);
	this.cleanObjects(this.entities);
	this.checkCollisions();
    }
    
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	for (let i = 0; i < this.sprites.length; i++) {
	    let obj = this.sprites[i];
	    if (obj.alive && obj.visible) {
		obj.render(ctx, bx, by);
	    }
	}
    }

    scroll(v: Vec2) {
	for (let i = 0; i < this.sprites.length; i++) {
	    let obj = this.sprites[i];
	    if (!obj.alive) continue;
	    if (obj.bounds === null) continue;
	    obj.bounds = obj.bounds.add(v);
	}
	for (let i = 0; i < this.entities.length; i++) {
	    let obj = this.entities[i];
	    if (!obj.alive) continue;
	    if (obj.collider === null) continue;
	    obj.collider = obj.collider.add(v);
	}
    }

    addObject(obj: Task) {
	if (obj instanceof Task) {
	    if (obj.layer === null) {
		obj.start(this);
	    }
	    this.tasks.push(obj);
	}
	if (obj instanceof Sprite) {
	    this.sprites.push(obj);
	    this.sprites.sort((a:Sprite, b:Sprite) => { return a.zOrder-b.zOrder; });
	}
	if (obj instanceof Entity) {
	    this.entities.push(obj);
	}
    }

    removeObject(obj: Task) {
	if (obj instanceof Task) {
	    removeElement(this.tasks, obj);
	}
	if (obj instanceof Sprite) {
	    removeElement(this.sprites, obj);
	}
	if (obj instanceof Entity) {
	    removeElement(this.entities, obj);
	}
    }

    checkCollisions() {
	for (let i = 0; i < this.entities.length; i++) {
	    let obj0 = this.entities[i];
	    if (obj0.alive && obj0.collider !== null) {
		let a = this.findObjects(obj0.collider, this.entities.slice(i+1));
		for (let j = 0; j < a.length; j++) {
		    let obj1 = a[j];
		    obj0.collide(obj1);
		    obj1.collide(obj0);
		}
	    }
	}
    }
    
    findObjects(shape: Shape,
		objs: Entity[]=null,
		f: (e:Entity)=>boolean=null) {
	if (objs === null) {
	    objs = this.entities;
	}
	let a:Entity[] = [];
	for (let i = 0; i < objs.length; i++) {
	    let obj1 = objs[i];
	    if (obj1.alive && obj1.collider !== null &&
		obj1.collider.overlaps(shape) && (f === null || f(obj1))) {
		a.push(obj1);
	    }
	}
	return a;
    }

    private cleanObjects(objs: Task[]) {
	removeElements(objs, (obj: Task) => { return !obj.alive; });
    }

}


//  ScrollLayer
// 
class ScrollLayer extends Layer {

    window: Rect;

    constructor(window: Rect) {
	super();
	this.window = window;
    }

    toString() {
	return '<ScrollLayer: '+this.window+'>';
    }
  
    move(v: Vec2) {
	this.window = this.window.add(v);
    }
    
    setCenter(world: Rect, bounds: Rect) {
	if (this.window.width < bounds.width) {
	    this.window.x = (bounds.width-this.window.width)/2;
	} else if (bounds.x < this.window.x) {
	    this.window.x = bounds.x;
	} else if (this.window.x+this.window.width < bounds.x+bounds.width) {
	    this.window.x = bounds.x+bounds.width - this.window.width;
	}
	if (this.window.height < bounds.height) {
	    this.window.y = (bounds.height-this.window.height)/2;
	} else if (bounds.y < this.window.y) {
	    this.window.y = bounds.y;
	} else if (this.window.y+this.window.height < bounds.y+bounds.height) {
	    this.window.y = bounds.y+bounds.height - this.window.height;
	}
	this.window.x = clamp(0, this.window.x, world.width-this.window.width);
	this.window.y = clamp(0, this.window.y, world.height-this.window.height);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	bx -= this.window.x;
	by -= this.window.y;
	for (let i = 0; i < this.sprites.length; i++) {
	    let obj = this.sprites[i];
	    if (obj.alive && obj.visible) {
		if (obj.bounds === null || obj.bounds.overlaps(this.window)) {
		    obj.render(ctx, bx, by);
		}
	    }
	}
    }
}
