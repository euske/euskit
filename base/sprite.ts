/// <reference path="utils.ts" />
/// <reference path="geom.ts" />


/** Abstract image obejct that is placed at (0, 0).
 *  render() is responsible to draw the image.
 */
interface ImageSource {
    
    /** Returns the bounds of the image at (0, 0). */
    getBounds(): Rect;

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D): void;
}


/** ImageSource that is a solid filled rectangle.
 *  Typically used as placeholders.
 */
class RectImageSource implements ImageSource {

    /** Fill color. */
    color: string;
    /** Destination rectangle. */
    dstRect: Rect;
    
    constructor(color: string, dstRect: Rect) {
	this.color = color;
	this.dstRect = dstRect;
    }

    /** Returns the bounds of the image at (0, 0). */
    getBounds(): Rect {
	return this.dstRect;
    }

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D) {
	if (this.color !== null) {
	    ctx.fillStyle = this.color;
	    ctx.fillRect(
		this.dstRect.x, this.dstRect.y,
		this.dstRect.width, this.dstRect.height);
	}
    }
}


/** ImageSource that is a solid filled oval.
 */
class OvalImageSource implements ImageSource {
    
    /** Fill color. */
    color: string;
    /** Destination rectangle. */
    dstRect: Rect;
    
    constructor(color: string, dstRect: Rect) {
	this.color = color;
	this.dstRect = dstRect;
    }

    /** Returns the bounds of the image at (0, 0). */
    getBounds(): Rect {
	return this.dstRect;
    }

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D) {
	if (this.color !== null) {
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
}


/** ImageSource that uses a (part of) HTML <img> element.
 */
class HTMLImageSource implements ImageSource {

    /** Source image. */
    image: HTMLImageElement;
    /** Source rectangle. */
    srcRect: Rect;
    /** Destination rectangle. */
    dstRect: Rect;
    
    constructor(image: HTMLImageElement, srcRect: Rect, dstRect: Rect) {
	this.image = image;
	this.srcRect = srcRect;
	this.dstRect = dstRect;
    }

    /** Returns the bounds of the image at (0, 0). */
    getBounds(): Rect {
	return this.dstRect;
    }

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D) {
	ctx.drawImage(
	    this.image,
	    this.srcRect.x, this.srcRect.y,
	    this.srcRect.width, this.srcRect.height,
	    this.dstRect.x, this.dstRect.y,
	    this.dstRect.width, this.dstRect.height);
    }
}


/** ImageSource that consists of tiled images.
 *  A image is displayed repeatedly to fill up the specified bounds.
 */
class TiledImageSource implements ImageSource {

    /** Bounds to fill. */
    bounds: Rect;
    /** Image source to be tiled. */
    imgsrc: ImageSource;
    /** Image offset. */
    offset: Vec2 = new Vec2();
    
    constructor(bounds: Rect, imgsrc: ImageSource=null) {
	this.bounds = bounds;
	this.imgsrc = imgsrc;
    }

    /** Returns the bounds of the sprite at a given pos. */
    getBounds(): Rect {
	return this.bounds;
    }

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D) {
	let imgsrc = this.imgsrc;
	if (imgsrc !== null) {
	    ctx.save();
	    ctx.translate(int(this.bounds.x), int(this.bounds.y));
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


/** Internal object that represents a star. */
class Star {
    z: number;
    s: number;
    p: Vec2;
    init(maxdepth: number) {
	this.z = Math.random()*maxdepth+1;
	this.s = (Math.random()*2+1) / this.z;
    }
}


/** ImageSource for "star flowing" effects.
 *  A image is scattered across the area with a varied depth.
 */
class StarImageSource implements ImageSource {
    
    /** Bounds to fill. */
    bounds: Rect;
    /** Maximum depth of stars. */
    maxdepth: number;
    /** Image source to be used as a single star. */
    imgsrc: ImageSource;
    
    private _stars: Star[] = [];

    constructor(bounds: Rect, nstars: number,
		maxdepth=3, imgsrc: ImageSource=null) {
	this.bounds = bounds
	this.maxdepth = maxdepth;
	if (imgsrc === null) {
	    imgsrc = new RectImageSource('white', new Rect(0,0,1,1));
	}
	this.imgsrc = imgsrc;
	for (let i = 0; i < nstars; i++) {
	    let star = new Star();
	    star.init(this.maxdepth);
	    star.p = this.bounds.rndPt();
	    this._stars.push(star);
	}
    }

    /** Returns the bounds of the sprite at a given pos. */
    getBounds(): Rect {
	return this.bounds;
    }

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D) {
	if (this.imgsrc !== null) {
	    ctx.save();
	    ctx.translate(int(this.bounds.x), int(this.bounds.y));
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
    
    /** Moves the stars by the given offset. */
    move(offset: Vec2) {
	for (let star of this._stars) {
	    star.p.x += offset.x/star.z;
	    star.p.y += offset.y/star.z;
	    let rect = star.p.expand(star.s, star.s);
	    if (!this.bounds.overlapsRect(rect)) {
		star.init(this.maxdepth);
		star.p = this.bounds.modpt(star.p);
	    }
	}
    }
}


/** Object that stores multiple ImageSource objects.
 *  Each cell on the grid represents an individual ImageSource.
 */
class SpriteSheet {
    
    constructor() {
    }

    /** Returns an ImageSource at the given cell. */
    get(x:number, y=0, w=1, h=1, origin: Vec2=null): ImageSource {
	return null as ImageSource;
    }
}


/** Simple list of ImageSources.
 *  Used as placeholders for ImageSpriteSheet.
 */
class SimpleSpriteSheet extends SpriteSheet {
    
    imgsrcs: ImageSource[];

    constructor(imgsrcs: ImageSource[]) {
	super();
	this.imgsrcs = imgsrcs;
    }

    /** Returns an ImageSource at the given cell. */
    get(x:number, y=0, w=1, h=1, origin: Vec2=null): ImageSource {
	return this.imgsrcs[x];
    }

    /** Sets an ImageSource at the given cell. */
    set(i:number, imgsrc:ImageSource) {
	this.imgsrcs[i] = imgsrc;
    }
}


/** SpriteSheet that is based on a single HTML image.
 */
class ImageSpriteSheet extends SpriteSheet {
    
    /** Source image. */
    image: HTMLImageElement;
    /** Size of each cell. */
    size: Vec2;
    /** Origin of each ImageSource. */
    origin: Vec2;

    constructor(image: HTMLImageElement, size: Vec2, origin: Vec2=null) {
	super();
	this.image = image;
	this.size = size;
	this.origin = origin;
    }

    /** Returns an ImageSource at the given cell. */
    get(x:number, y=0, w=1, h=1, origin: Vec2=null): ImageSource {
	if (origin === null) {
	    if (this.origin === null) {
		origin = new Vec2(w*this.size.x/2, h*this.size.y/2);
	    } else {
		origin = this.origin;
	    }
	}
	let srcRect = new Rect(
            x*this.size.x, y*this.size.y,
            w*this.size.x, h*this.size.y);
	let dstRect = new Rect(
            -origin.x, -origin.y,
            w*this.size.x, h*this.size.y);
	return new HTMLImageSource(this.image, srcRect, dstRect);
    }
}


/** Object that has a size and z-order and draws itself on screen.
 *  It can also interact with mouse/touch.
 */
class Sprite {

    /** True if this sprite is rendered. */
    visible: boolean = true;
    /** Z-Order of the sprite. */
    zOrder: number = 0;
    
    /** Returns the bounds of the sprite at a given pos. */
    getBounds(pos: Vec2=null): Rect {
	// [OVERRIDE]
	return null as Rect;
    }
  
    /** Returns true if the sprite can respond to mouse event. */
    mouseSelectable(p: Vec2): boolean {
	// return this.getBounds.containsPt(p);
	return false;
    }

    /** Renders itself in the given context, offset by (bx, by). */
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	// [OVERRIDE]
    }
}


/** Sprite that consists of a single image.
 */
class SimpleSprite extends Sprite {
    
    /** Image source to display. */
    imgsrc: ImageSource;
    /** Image scaling. Negative values can be used for flipped images. */
    scale: Vec2 = new Vec2(1, 1);
    /** Image rotation (in radian). */
    rotation: number = 0;
    
    constructor(imgsrc: ImageSource=null) {
	super();
	this.imgsrc = imgsrc;
    }

    toString() {
	return '<SimpleSprite: '+this.imgsrc+'>';
    }

    /** Returns its focal position. */
    getPos(): Vec2 {
	// [OVERRIDE]
	return null as Vec2;
    }

    /** Returns the bounds of the sprite at a given pos. */
    getBounds(pos: Vec2=null): Rect {
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

    /** Renders itself in the given context, offset by (bx, by). */
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


/** Sprite that is fixed to a certain location.
 */
class FixedSprite extends SimpleSprite {

    /** Sprite position. */
    pos: Vec2;
    
    constructor(pos: Vec2=null, imgsrc: ImageSource=null) {
	super(imgsrc);
	this.pos = pos;
    }

    /** Returns its focal position. */
    getPos(): Vec2 {
	return this.pos;
    }
}


/** Sprite that is atteched to an Entity.
 */
class EntitySprite extends SimpleSprite {

    /** Entity that this sprite belongs to. */
    entity: Entity;
    
    constructor(entity: Entity=null, imgsrc: ImageSource=null) {
	super(imgsrc);
	this.entity = entity;
    }

    /** Returns its focal position. */
    getPos(): Vec2 {
	if (this.entity !== null) {
	    return this.entity.pos;
	}
	return null;
    }
}
