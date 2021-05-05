/// <reference path="utils.ts" />
/// <reference path="geom.ts" />


/** Abstract image obejct that is placed at (0, 0).
 *  render() is responsible to draw the image.
 */
interface Sprite {

    /** Returns the bounds of the image at (0, 0). */
    getBounds(): Rect;

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D): void;
}


/** Sprite that is a solid filled rectangle.
 *  Typically used as placeholders.
 */
class RectSprite implements Sprite {

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
            fillRect(ctx, this.dstRect);
        }
    }
}


/** Sprite that is a solid filled oval.
 */
class OvalSprite implements Sprite {

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
            ctx.translate(this.dstRect.cx(), this.dstRect.cy());
            ctx.scale(this.dstRect.width/2, this.dstRect.height/2);
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }
    }
}


/** Sprite that uses a canvas object.
 */
class CanvasSprite implements Sprite {

    /** Source image. */
    canvas: HTMLCanvasElement;
    /** Destination rectangle. */
    dstRect: Rect;
    /** Source rectangle. */
    srcRect: Rect;

    constructor(canvas: HTMLCanvasElement, srcRect: Rect=null, dstRect: Rect=null) {
        this.canvas = canvas;
        if (srcRect === null) {
            srcRect = new Rect(0, 0, canvas.width, canvas.height);
        }
        this.srcRect = srcRect;
        if (dstRect === null) {
            dstRect = new Rect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
        }
        this.dstRect = dstRect;
    }

    /** Returns the bounds of the image at (0, 0). */
    getBounds(): Rect {
        return this.dstRect;
    }

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(
            this.canvas,
            this.srcRect.x, this.srcRect.y,
            this.srcRect.width, this.srcRect.height,
            this.dstRect.x, this.dstRect.y,
            this.dstRect.width, this.dstRect.height);
    }
}


/** Sprite that uses a (part of) HTML <img> element.
 */
class ImageSprite implements Sprite {

    /** Source image. */
    image: HTMLImageElement;
    /** Source rectangle. */
    srcRect: Rect;
    /** Destination rectangle. */
    dstRect: Rect;

    constructor(image: HTMLImageElement, srcRect: Rect=null, dstRect: Rect=null) {
        this.image = image;
        if (srcRect === null) {
            srcRect = new Rect(0, 0, image.width, image.height);
        }
        this.srcRect = srcRect;
        if (dstRect === null) {
            dstRect = new Rect(-image.width/2, -image.height/2, image.width, image.height);
        }
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


/** Sprite that consists of tiled images.
 *  A image is displayed repeatedly to fill up the specified bounds.
 */
class TiledSprite implements Sprite {

    /** Image source to be tiled. */
    sprite: Sprite;
    /** Bounds to fill. */
    bounds: Rect;
    /** Image offset. */
    offset: Vec2;

    constructor(sprite: Sprite, bounds: Rect, offset: Vec2=null) {
        this.sprite = sprite;
        this.bounds = bounds;
        this.offset = (offset !== null)? offset : new Vec2();
    }

    /** Returns the bounds of the image at a given pos. */
    getBounds(): Rect {
        return this.bounds;
    }

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(int(this.bounds.x), int(this.bounds.y));
        ctx.beginPath();
        ctx.rect(0, 0, this.bounds.width, this.bounds.height);
        ctx.clip();
        let dstRect = this.sprite.getBounds();
        let w = dstRect.width;
        let h = dstRect.height;
        let dx0 = int(Math.floor(this.offset.x/w)*w - this.offset.x);
        let dy0 = int(Math.floor(this.offset.y/h)*h - this.offset.y);
        for (let dy = dy0; dy < this.bounds.height; dy += h) {
            for (let dx = dx0; dx < this.bounds.width; dx += w) {
                ctx.save();
                ctx.translate(dx, dy);
                this.sprite.render(ctx);
                ctx.restore();
            }
        }
        ctx.restore();
    }
}


/** Internal object that represents a star. */
class Star {
    sprite: Sprite;
    z: number;
    s: number;
    p: Vec2;
    init(maxdepth: number) {
        this.z = Math.random()*maxdepth+1;
        this.s = (Math.random()*2+1) / this.z;
    }
}


/** Sprite for "star flowing" effects.
 *  A image is scattered across the area with a varied depth.
 */
class StarSprite implements Sprite {

    /** Bounds to fill. */
    bounds: Rect;
    /** Maximum depth of stars. */
    maxdepth: number;
    /** Image source to be used as a single star. */
    sprites: Sprite[];

    private _stars: Star[] = [];

    constructor(bounds: Rect, nstars: number,
                maxdepth=3, sprites: Sprite[]=null) {
        this.bounds = bounds
        this.maxdepth = maxdepth;
        if (sprites === null) {
            sprites = [new RectSprite('white', new Rect(0,0,1,1))];
        }
        this.sprites = sprites;
        for (let i = 0; i < nstars; i++) {
            let star = new Star();
            star.sprite = choice(sprites);
            star.init(this.maxdepth);
            star.p = this.bounds.rndPt();
            this._stars.push(star);
        }
    }

    /** Returns the bounds of the image at a given pos. */
    getBounds(): Rect {
        return this.bounds;
    }

    /** Renders this image in the given context. */
    render(ctx: CanvasRenderingContext2D) {
        for (let star of this._stars) {
            ctx.save();
            ctx.translate(star.p.x, star.p.y);
            ctx.scale(star.s, star.s);
            star.sprite.render(ctx);
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
                star.p = this.bounds.modPt(star.p);
            }
        }
    }
}


/** Object that stores multiple Sprite objects.
 *  Each cell on the grid represents an individual Sprite.
 */
class SpriteSheet {

    constructor() {
    }

    /** Returns an Sprite at the given cell. */
    get(x:number, y=0, w=1, h=1, origin: Vec2=null): Sprite {
        return null as Sprite;
    }
}


/** Array of Sprites.
 */
class ArraySpriteSheet extends SpriteSheet {

    sprites: Sprite[];

    constructor(sprites: Sprite[]) {
        super();
        this.sprites = sprites;
    }

    /** Returns an Sprite at the given cell. */
    get(x:number, y=0, w=1, h=1, origin: Vec2=null): Sprite {
        if (x < 0 || this.sprites.length <= x || y != 0) return null;
        return this.sprites[x];
    }

    /** Sets an Sprite at the given cell. */
    set(i:number, sprite:Sprite) {
        this.sprites[i] = sprite;
    }
}


/** SpriteSheet that is based on a single HTML image.
 */
class ImageSpriteSheet extends SpriteSheet {

    /** Source image. */
    image: HTMLImageElement;
    /** Size of each cell. */
    size: Vec2;
    /** Origin of each Sprite. */
    origin: Vec2;

    constructor(image: HTMLImageElement, size: Vec2, origin: Vec2=null) {
        super();
        this.image = image;
        this.size = size;
        this.origin = origin;
    }

    /** Returns an Sprite at the given cell. */
    get(x:number, y=0, w=1, h=1, origin: Vec2=null): Sprite {
        if (origin === null) {
            origin = this.origin;
            if (origin === null) {
                origin = new Vec2(w*this.size.x/2, h*this.size.y/2);
            }
        }
        let srcRect = new Rect(
            x*this.size.x, y*this.size.y,
            w*this.size.x, h*this.size.y);
        let dstRect = new Rect(
            -origin.x, -origin.y,
            w*this.size.x, h*this.size.y);
        return new ImageSprite(this.image, srcRect, dstRect);
    }
}


/** Renders sprites with the specific parameters.
 * @param ctx CanvasRenderingContext2D.
 * @param sprites Array of Sprites.
 * @param pos Position Vec2.
 * @param rotation Rotation.
 * @param scale Scale Vec2.
 * @param alpha Alpha.
 */
function renderSprites(
    ctx: CanvasRenderingContext2D,
    sprites: Sprite[],
    pos: Vec2=null,
    rotation: number=0,
    scale: Vec2=null,
    alpha: number=1.0) {
    ctx.save();
    if (pos !== null) {
        ctx.translate(pos.x, pos.y);
    }
    if (rotation != 0) {
        ctx.rotate(rotation);
    }
    if (scale !== null) {
        ctx.scale(scale.x, scale.y);
    }
    ctx.globalAlpha = alpha;
    for (let sprite of sprites) {
        sprite.render(ctx);
    }
    ctx.restore();
}
