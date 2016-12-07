/// <reference path="utils.ts" />
/// <reference path="geom.ts" />


//  ImageSource
//
interface ImageSource {
    getBounds(): Rect;
    render(ctx: CanvasRenderingContext2D): void;
}

class HTMLImageSource implements ImageSource {
    image: HTMLImageElement;
    srcRect: Rect;
    dstRect: Rect;
    
    constructor(image: HTMLImageElement, srcRect: Rect, dstRect: Rect) {
	this.image = image;
	this.srcRect = srcRect;
	this.dstRect = dstRect;
    }

    getBounds() {
	return this.dstRect;
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.drawImage(
	    this.image,
	    this.srcRect.x, this.srcRect.y,
	    this.srcRect.width, this.srcRect.height,
	    this.dstRect.x, this.dstRect.y,
	    this.dstRect.width, this.dstRect.height);
    }
}

class RectImageSource implements ImageSource {
    color: string;
    dstRect: Rect;
    
    constructor(color: string, dstRect: Rect) {
	this.color = color;
	this.dstRect = dstRect;
    }

    getBounds() {
	return this.dstRect;
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = this.color;
	ctx.fillRect(
	    this.dstRect.x, this.dstRect.y,
	    this.dstRect.width, this.dstRect.height);
    }
}

class OvalImageSource implements ImageSource {
    color: string;
    dstRect: Rect;
    
    constructor(color: string, dstRect: Rect) {
	this.color = color;
	this.dstRect = dstRect;
    }

    getBounds() {
	return this.dstRect;
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.fillStyle = this.color;
	ctx.translate(this.dstRect.centerx(), this.dstRect.centery());
	ctx.scale(this.dstRect.width/2, this.dstRect.height/2);
	ctx.beginPath();
	ctx.arc(0, 0, 1, 0, Math.PI*2);
	ctx.fill();
	ctx.restore();
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
    imgsrcs: ImageSource[];

    constructor(imgsrcs: ImageSource[]) {
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

    getBounds(pos: Vec2=null) {
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

    getBounds(pos: Vec2=null) {
	if (this.imgsrc !== null) {
	    if (pos === null) {
		pos = this.getPos();
	    }
	    if (pos !== null) {
		return this.imgsrc.getBounds().add(pos);
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
		this.imgsrc.render(ctx);
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
	    let dstRect = imgsrc.getBounds();
	    let w = dstRect.width;
	    let h = dstRect.height;
	    let dx0 = int(Math.floor(this.offset.x/w)*w - this.offset.x);
	    let dy0 = int(Math.floor(this.offset.y/h)*h - this.offset.y);
	    for (let dy = dy0; dy < this.bounds.height; dy += h) {
		for (let dx = dx0; dx < this.bounds.width; dx += w) {
		    ctx.save();
		    ctx.translate(dx, dy);
		    imgsrc.render(ctx);
		    ctx.restore();
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
	this.imgsrc = new RectImageSource('white', new Rect(0,0,1,1));
	for (let i = 0; i < nstars; i++) {
	    let star = new Star();
	    star.init(this.maxdepth);
	    star.p = this.bounds.rndPt();
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
		ctx.save();
		ctx.translate(star.p.x, star.p.y);
		ctx.scale(star.s, star.s);
		this.imgsrc.render(ctx);
		ctx.restore();
	    }
	    ctx.restore();
	}
    }
}
