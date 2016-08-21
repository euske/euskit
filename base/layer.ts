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
	for (let task of this.tasks) {
	    if (task.running) {
		task.tick(t);
	    }
	}
	this.checkCollisions();
	this.tasks = this.tasks.filter((task: Task) => { return task.running; });
    }
    
    addTask(task: Task) {
	if (task.layer === null) {
	    task.start(this);
	}
	this.tasks.push(task);
    }

    addSprite(sprite: Sprite) {
	this.sprites.push(sprite);
	this.sprites.sort((a:Sprite, b:Sprite) => { return a.zOrder-b.zOrder; });
    }

    removeSprite(sprite: Sprite) {
	removeElement(this.sprites, sprite);
    }

    addEntity(entity: Entity) {
	this.entities.push(entity);
    }

    removeEntity(entity: Entity) {
	removeElement(this.entities, entity);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	for (let sprite of this.sprites) {
	    if (sprite.running && sprite.visible) {
		sprite.render(ctx, bx, by);
	    }
	}
    }

    moveAll(v: Vec2) {
	for (let sprite of this.sprites) {
	    if (!sprite.running) continue;
	    if (sprite.getBounds() === null) continue;
	    sprite.pos = sprite.pos.add(v);
	}
    }

    checkCollisions() {
	for (let i = 0; i < this.entities.length; i++) {
	    let entity0 = this.entities[i];
	    if (entity0.running && entity0.collider !== null) {
		let a = this.findEntities(
		    entity0.getCollider(),
		    this.entities.slice(i+1));
		for (let entity1 of a) {
		    entity0.collidedWith(entity1);
		    entity1.collidedWith(entity0);
		}
	    }
	}
    }
    
    findEntities(shape: Shape,
		 entities: Entity[]=null,
		 f: (e:Entity)=>boolean=null) {
	if (entities === null) {
	    entities = this.entities;
	}
	let a:Entity[] = [];
	for (let entity1 of entities) {
	    if (entity1.running && entity1.collider !== null &&
		(f === null || f(entity1)) &&
		entity1.getCollider().overlaps(shape)) {
		a.push(entity1);
	    }
	}
	return a;
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
	for (let sprite of this.sprites) {
	    if (sprite.running && sprite.visible) {
		let bounds = sprite.getBounds()
		if (bounds === null || bounds.overlaps(this.window)) {
		    sprite.render(ctx, bx, by);
		}
	    }
	}
    }
}
