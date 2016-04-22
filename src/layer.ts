/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="entity.ts" />
/// <reference path="tilemap.ts" />


//  Layer
// 
class Layer {

    tasks: [Task];
    sprites: [Sprite];
    entities: [Entity];

    constructor() {
	this.init();
    }

    init() {
	this.tasks = [] as [Task];
	this.sprites = [] as [Sprite];
	this.entities = [] as [Entity];
    }
  
    tick() {
	for (let i = 0; i < this.tasks.length; i++) {
	    let obj = this.tasks[i];
	    if (obj.alive) {
		obj.tick();
	    }
	}
	this.collideObjects(this.entities);
	this.cleanObjects(this.tasks);
	this.cleanObjects(this.sprites);
	this.cleanObjects(this.entities);
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
	    if (obj.hitbox === null) continue;
	    obj.hitbox = obj.hitbox.add(v);
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
	    this.sprites.sort((a:Sprite, b:Sprite) => { return a.zorder-b.zorder; });
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

    collideObjects(objs: [Entity]) {
	for (let i = 0; i < objs.length; i++) {
	    let obj0 = objs[i];
	    if (obj0.alive && obj0.hitbox !== null) {
		for (let j = i+1; j < objs.length; j++) {
		    let obj1 = objs[j];
		    if (obj1.alive && obj1.hitbox !== null &&
			obj1 !== obj0 && obj1.hitbox.overlap(obj0.hitbox)) {
			obj0.collide(obj1);
			obj1.collide(obj0);
		    }
		}
	    }
	}
    }
    
    cleanObjects(objs: [Task]) {
	removeElements(objs, (obj: Task) => { return !obj.alive; });
    }

    findObjects(rect: Rect,
		f: (e:Entity)=>boolean=null) {
	let a:[Entity] = [] as [Entity];
	for (let i = 0; i < this.entities.length; i++) {
	    let obj1 = this.entities[i];
	    if (obj1.alive && obj1.hitbox !== null &&
		(f === null || f(obj1)) && obj1.hitbox.overlap(rect)) {
		a.push(obj1);
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
		if (obj.bounds === null || obj.bounds.overlap(this.window)) {
		    obj.render(ctx, bx, by);
		}
	    }
	}
    }

    renderTilesFromBottomLeft(
	ctx: CanvasRenderingContext2D,
	bx: number, by: number,
	tilemap: TileMap,
	tiles: SpriteSheet,
	ft: TilePosTileFunc) {
	let window = this.window;
	let ts = tilemap.tilesize;
	let x0 = Math.floor(window.x/ts);
	let y0 = Math.floor(window.y/ts);
	let x1 = Math.ceil((window.x+window.width)/ts);
	let y1 = Math.ceil((window.y+window.height)/ts);
	let fx = x0*ts-window.x;
	let fy = y0*ts-window.y;
	tilemap.renderFromBottomLeft(
	    ctx, bx+fx, by+fy, tiles, ft, 
	    x0, y0, x1-x0+1, y1-y0+1);
    }

    renderTilesFromTopRight(
	ctx: CanvasRenderingContext2D,
	bx: number, by: number,
	tilemap: TileMap,
	tiles: SpriteSheet,
	ft: TilePosTileFunc) {
	let window = this.window;
	let ts = tilemap.tilesize;
	let x0 = Math.floor(window.x/ts);
	let y0 = Math.floor(window.y/ts);
	let x1 = Math.ceil((window.x+window.width)/ts);
	let y1 = Math.ceil((window.y+window.height)/ts);
	let fx = x0*ts-window.x;
	let fy = y0*ts-window.y;
	tilemap.renderFromTopRight(
	    ctx, bx+fx, by+fy, tiles, ft, 
	    x0, y0, x1-x0+1, y1-y0+1);
    }

}


//  StarsLayer
//
class Star {
    z: number;
    s: number;
    p: Vec2;
    init(maxdepth: number) {
	this.z = Math.random()*maxdepth+1;
	this.s = (Math.random()*2+1) / this.z;
    }
}
class StarsLayer extends Layer {

    frame: Rect;
    color: string;
    velocity: Vec2;
    maxdepth: number;
    private _stars: [Star] = [] as [Star];

    constructor(frame: Rect, nstars: number,
		color='white', velocity=new Vec2(-1,0), maxdepth=3) {
	super();
	this.frame = frame;
	this.color = color;
	this.velocity = velocity;
	this.maxdepth = maxdepth;
	for (let i = 0; i < nstars; i++) {
	    let star = new Star();
	    star.init(this.maxdepth);
	    star.p = this.frame.rndpt();
	    this._stars.push(star);
	}
    }

    tick() {
	super.tick();
	for (let i = 0; i < this._stars.length; i++) {
	    let star = this._stars[i];
	    star.p.x += this.velocity.x/star.z;
	    star.p.y += this.velocity.y/star.z;
	    let rect = star.p.expand(star.s, star.s);
	    if (!this.frame.overlap(rect)) {
		star.init(this.maxdepth);
		star.p = this.frame.modpt(star.p);
	    }
	}
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = this.color;
	bx += this.frame.x;
	by += this.frame.y;
	for (let i = 0; i < this._stars.length; i++) {
	    let star = this._stars[i];
	    let rect = star.p.expand(star.s, star.s);
	    ctx.fillRect(bx+rect.x, by+rect.y, rect.width, rect.height);
	}
    }
}
