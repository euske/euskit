/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="sprite.ts" />
/// <reference path="entity.ts" />


//  Layer
// 
class Layer {

    time: number = 0;
    tasks: Task[] = [];
    sprites: Sprite[] = [];
    entities: Entity[] = [];
    
    mouseFocus: Sprite = null;
    mouseActive: Sprite = null;
    clicked: Signal;

    constructor() {
	this.clicked = new Signal(this);
    }

    toString() {
	return ('<Layer: tasks='+this.tasks+', sprites='+
		this.sprites+', entities='+this.entities+'>');
    }
  
    init() {
	this.tasks = [];
	this.sprites = [];
	this.entities = [];
	this.mouseFocus = null;
	this.mouseActive = null;
    }
  
    tick(t: number) {
	this.time = t;
	for (let task of this.tasks) {
	    if (task.running) {
		task.tick(t);
	    }
	}
	this.checkEntityCollisions();
	this.tasks = this.tasks.filter((task: Task) => { return task.running; });
    }

    addTask(task: Task) {
	task.layer = this;
	this.tasks.push(task);
	task.start();
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
	    if (sprite.visible) {
		sprite.render(ctx, bx, by);
	    }
	}
    }

    moveAll(v: Vec2) {
	for (let entity of this.entities) {
	    if (!entity.running) continue;
	    entity.movePos(v);
	}
    }

    checkEntityCollisions() {
	this.checkEntityPairs(
	    (e0:Entity, e1:Entity) => {
		e0.collidedWith(e1);
		e1.collidedWith(e0);
	    });
    }

    checkEntityPairs(f: (e0:Entity, e1:Entity)=>void) {
	for (let i = 0; i < this.entities.length; i++) {
	    let entity0 = this.entities[i];
	    if (entity0.running) {
		let collider0 = entity0.getCollider();
		if (collider0 !== null) {
		    let a = this.findEntities(
			(e:Entity) => {
			    let collider1 = e.getCollider();
			    return (entity0 !== e &&
				    collider1 !== null &&
				    collider0.overlaps(collider1));
			},
			this.entities.slice(i+1));
		    for (let e of a) {
			f(entity0, e);
		    }
		}
	    }
	}
    }

    findEntities(f: (e:Entity)=>boolean, entities: Entity[]=null) {
	if (entities === null) {
	    entities = this.entities;
	}
	let a:Entity[] = [];
	for (let entity1 of entities) {
	    if (entity1.running && f(entity1)) {
		a.push(entity1);
	    }
	}
	return a;
    }
    
    hasEntity(f: (e:Entity)=>boolean, collider0: Collider) {
	for (let entity1 of this.entities) {
	    if (entity1.running && f(entity1)) {
		let collider1 = entity1.getCollider();
		if (collider1 !== null && collider0.overlaps(collider1)) {
		    return true;
		}
	    }
	}
	return false;
    }
    
    findSpriteAt(p: Vec2) {
	for (let i = this.sprites.length-1; 0 <= i; i--) {
	    let sprite = this.sprites[i]; // from reversed order.
	    if (sprite.mouseSelectable &&
		sprite.getBounds().containsPt(p)) {
		return sprite;
	    }
	}
	return null;
    }

    onMouseDown(p: Vec2, button: number) {
	if (button == 0) {
	    this.mouseFocus = this.findSpriteAt(p);
	    this.mouseActive = this.mouseFocus;
	}
    }
    
    onMouseUp(p: Vec2, button: number) {
	if (button == 0) {
	    this.mouseFocus = this.findSpriteAt(p);
	    if (this.mouseFocus !== null &&
		this.mouseFocus === this.mouseActive) {
		this.clicked.fire(this.mouseActive);
	    }
	    this.mouseActive = null;
	}
    }
    
    onMouseMove(p: Vec2) {
	if (this.mouseActive === null) {
	    this.mouseFocus = this.findSpriteAt(p);
	}
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
	    if (sprite.visible) {
		let bounds = sprite.getBounds()
		if (bounds === null || bounds.overlaps(this.window)) {
		    sprite.render(ctx, bx, by);
		}
	    }
	}
    }
}
