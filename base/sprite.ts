/// <reference path="utils.ts" />
/// <reference path="geom.ts" />


//  ImageSource
//
class ImageSource {
    dstRect: Rect;
    
    constructor(dstRect: Rect) {
	this.dstRect = dstRect;
    }

    render(ctx: CanvasRenderingContext2D, dstRect: Rect) {
	// [OVERRIDE]
    }
}

class HTMLImageSource extends ImageSource {
    image: HTMLImageElement;
    srcRect: Rect;
    
    constructor(image: HTMLImageElement, srcRect: Rect, dstRect: Rect) {
	super(dstRect);
	this.image = image;
	this.srcRect = srcRect;
    }

    render(ctx: CanvasRenderingContext2D, dstRect: Rect) {
	ctx.drawImage(
	    this.image,
	    this.srcRect.x, this.srcRect.y,
	    this.srcRect.width, this.srcRect.height,
	    dstRect.x, dstRect.y,
	    dstRect.width, dstRect.height);
    }
}

class FillImageSource extends ImageSource {
    color: string;
    
    constructor(color: string, dstRect: Rect) {
	super(dstRect);
	this.color = color;
    }

    render(ctx: CanvasRenderingContext2D, dstRect: Rect) {
	ctx.fillStyle = this.color;
	ctx.fillRect(
	    dstRect.x, dstRect.y,
	    dstRect.width, dstRect.height);
    }
}


//  SpriteSheet
// 
class SpriteSheet {
    constructor() {
    }
    
    get(x:number, y=0, w=1, h=1, origin: Vec2=null) {
	return null as ImageSource;
    }
}

class ImageSpriteSheet extends SpriteSheet {
    image: HTMLImageElement;
    size: Vec2;
    origin: Vec2;

    constructor(image: HTMLImageElement, size: Vec2, origin: Vec2=null) {
	super();
	this.image = image;
	this.size = size;
	this.origin = origin;
    }

    get(x:number, y=0, w=1, h=1, origin: Vec2=null) {
	if (origin === null) {
	    if (this.origin === null) {
		origin = new Vec2(w*this.size.x/2, h*this.size.y/2);
	    } else {
		origin = this.origin;
	    }
	}
	let srcRect = new Rect(x*this.size.x, y*this.size.y, w*this.size.x, h*this.size.y);
	let dstRect = new Rect(-origin.x, -origin.y, w*this.size.x, h*this.size.y);
	return new HTMLImageSource(this.image, srcRect, dstRect);
    }
}

class SimpleSpriteSheet extends SpriteSheet {
    imgsrcs: FillImageSource[];

    constructor(imgsrcs: FillImageSource[]) {
	super();
	this.imgsrcs = imgsrcs;
    }

    get(x:number, y=0, w=1, h=1, origin: Vec2=null) {
	return this.imgsrcs[x];
    }
}


//  Sprite
//  An object that's rendered on a screen.
//
class Sprite {

    imgsrc: ImageSource;
    visible: boolean = true;
    zOrder: number = 0;
    scale: Vec2 = new Vec2(1, 1);
    rotation: number = 0;
    mouseSelectable: boolean = false;

    constructor(imgsrc: ImageSource=null) {
	this.imgsrc = imgsrc;
    }

    toString() {
	return '<Sprite: '+this.imgsrc+'>';
    }

    getBounds() {
	// [OVERRIDE]
	return null as Rect;
    }
  
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	// [OVERRIDE]
    }
}


//  SimpleSprite
//
class SimpleSprite extends Sprite {
    
    getPos() {
	// [OVERRIDE]
	return null as Vec2;
    }

    getBounds() {
	if (this.imgsrc !== null) {
	    let pos = this.getPos();
	    if (pos !== null) {
		return this.imgsrc.dstRect.add(pos);
	    }
	}
	return null;
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	if (this.imgsrc !== null) {
	    let pos = this.getPos();
	    if (pos !== null) {
		ctx.save();
		ctx.translate(bx+int(pos.x), by+int(pos.y));
		if (this.rotation) {
		    ctx.rotate(this.rotation);
		}
		ctx.scale((0 < this.scale.x)? 1 : -1,
			  (0 < this.scale.y)? 1 : -1);
		this.imgsrc.render(ctx, this.imgsrc.dstRect);
		ctx.restore();
	    }
	}
    }
}


//  EntitySprite
//  A Sprite that belongs to an Entity
//
class EntitySprite extends SimpleSprite {

    entity: Entity;
    
    constructor(entity: Entity=null, imgsrc: ImageSource=null) {
	super(imgsrc);
	this.entity = entity;
    }

    getPos() {
	if (this.entity !== null) {
	    return this.entity.pos;
	}
	return null;
    }
}


//  TiledSprite
//  Displays a tiled image repeatedly.
//
class TiledSprite extends Sprite {

    bounds: Rect;
    offset: Vec2 = new Vec2();
    
    constructor(bounds: Rect, imgsrc: ImageSource=null) {
	super(imgsrc);
	this.bounds = bounds;
    }

    getBounds() {
	return this.bounds;
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	let imgsrc = this.imgsrc;
	if (imgsrc !== null) {
	    ctx.save();
	    ctx.translate(bx+int(this.bounds.x), by+int(this.bounds.y));
	    ctx.beginPath();
	    ctx.rect(0, 0, this.bounds.width, this.bounds.height);
	    ctx.clip();
	    let w = imgsrc.dstRect.width;
	    let h = imgsrc.dstRect.height;
	    let dx0 = int(Math.floor(this.offset.x/w)*w - this.offset.x);
	    let dy0 = int(Math.floor(this.offset.y/h)*h - this.offset.y);
	    for (let dy = dy0; dy < this.bounds.height; dy += h) {
		for (let dx = dx0; dx < this.bounds.width; dx += w) {
		    imgsrc.render(ctx, new Rect(dx, dy, w, h));
		}
	    }
	    ctx.restore();
	}
    }

}


//  StarSprite
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
class StarSprite extends Sprite {
    
    bounds: Rect;
    maxdepth: number;
    
    private _stars: Star[] = [];

    constructor(bounds: Rect, nstars: number, maxdepth=3) {
	super();
	this.bounds = bounds
	this.maxdepth = maxdepth;
	this.imgsrc = new FillImageSource('white', new Rect(0,0,1,1));
	for (let i = 0; i < nstars; i++) {
	    let star = new Star();
	    star.init(this.maxdepth);
	    star.p = this.bounds.rndpt();
	    this._stars.push(star);
	}
    }

    getBounds() {
	return this.bounds;
    }

    move(v: Vec2) {
	for (let star of this._stars) {
	    star.p.x += v.x/star.z;
	    star.p.y += v.y/star.z;
	    let rect = star.p.expand(star.s, star.s);
	    if (!this.bounds.overlapsRect(rect)) {
		star.init(this.maxdepth);
		star.p = this.bounds.modpt(star.p);
	    }
	}
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	if (this.imgsrc !== null) {
	    ctx.save();
	    ctx.translate(bx+int(this.bounds.x), by+int(this.bounds.y));
	    for (let star of this._stars) {
		let dstRect = star.p.expand(star.s, star.s);
		this.imgsrc.render(ctx, dstRect);
	    }
	    ctx.restore();
	}
    }
}
