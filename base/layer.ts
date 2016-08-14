/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="entity.ts" />


//  Layer
// 
class Layer {

    time: number = 0;
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
  
    tick(t: number) {
	this.time = t;
	for (let obj of this.tasks) {
	    if (obj.alive) {
		obj.tick(t);
	    }
	}
	this.cleanObjects(this.tasks);
	this.cleanObjects(this.sprites);
	this.cleanObjects(this.entities);
	this.checkCollisions();
    }
    
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	for (let obj of this.sprites) {
	    if (obj.alive && obj.visible) {
		obj.render(ctx, bx, by);
	    }
	}
    }

    moveAll(v: Vec2) {
	for (let obj of this.sprites) {
	    if (!obj.alive) continue;
	    if (obj.getBounds() === null) continue;
	    obj.pos = obj.pos.add(v);
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
		let a = this.findObjects(
		    obj0.getCollider(),
		    this.entities.slice(i+1));
		for (let obj1 of a) {
		    obj0.collidedWith(obj1);
		    obj1.collidedWith(obj0);
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
	for (let obj1 of objs) {
	    if (obj1.alive && obj1.collider !== null &&
		(f === null || f(obj1)) &&
		obj1.getCollider().overlaps(shape)) {
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
  
    moveCenter(v: Vec2) {
	this.window = this.window.add(v);
    }
    
    setCenter(bounds: Rect, rect: Rect) {
	if (this.window.width < rect.width) {
	    this.window.x = (rect.width-this.window.width)/2;
	} else if (rect.x < this.window.x) {
	    this.window.x = rect.x;
	} else if (this.window.x+this.window.width < rect.x+rect.width) {
	    this.window.x = rect.x+rect.width - this.window.width;
	}
	if (this.window.height < rect.height) {
	    this.window.y = (rect.height-this.window.height)/2;
	} else if (rect.y < this.window.y) {
	    this.window.y = rect.y;
	} else if (this.window.y+this.window.height < rect.y+rect.height) {
	    this.window.y = rect.y+rect.height - this.window.height;
	}
	this.window.x = clamp(0, this.window.x, bounds.width-this.window.width);
	this.window.y = clamp(0, this.window.y, bounds.height-this.window.height);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	bx -= this.window.x;
	by -= this.window.y;
	for (let obj of this.sprites) {
	    if (obj.alive && obj.visible) {
		let bounds = obj.getBounds()
		if (bounds === null || bounds.overlaps(this.window)) {
		    obj.render(ctx, bx, by);
		}
	    }
	}
    }
}
