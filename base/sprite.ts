/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />


/** Object that has a size and rotation and draws itself on screen.
 *  It can also interact with mouse/touch.
 */
class Sprite {

    /** Image scaling. Negative values can be used for flipped images. */
    scale: Vec2 = new Vec2(1, 1);
    /** Image rotation (in radian). */
    rotation: number = 0;
    /** Image alpha (0.0: transparent, 1.0: opaque). */
    alpha: number = 1.0;

    /** Returns true if the sprite is visible. */
    isVisible(): boolean {
        return true;
    }

    /** Returns the image source of the sprite. */
    getSkin(): ImageSource {
	// [OVERRIDE]
	return null as ImageSource;
    }

    /** Returns the position of the sprite. */
    getPos(): Vec2 {
	// [OVERRIDE]
	return null as Vec2;
    }

    /** Returns true if the sprite can respond to mouse event. */
    mouseSelectable(p: Vec2): boolean {
        if (!this.isVisible()) return false;
        let bounds = this.getBounds();
	return (bounds !== null && bounds.containsPt(p));
    }

    /** Returns the bounds of the sprite at a given pos. */
    getBounds(pos: Vec2=null): Rect {
	let skin = this.getSkin();
	if (skin === null) return null;
	if (pos === null) {
	    pos = this.getPos();
	    if (pos === null) return null;
	}
	return skin.getBounds().add(pos);
    }

    /** Renders itself in the given context. */
    render(ctx: CanvasRenderingContext2D) {
	ctx.save();
	this.setupContext(ctx);
	this.renderImage(ctx);
	ctx.restore();
    }

    setupContext(ctx: CanvasRenderingContext2D) {
	let pos = this.getPos();
	if (pos !== null) {
	    ctx.translate(pos.x, pos.y);
	}
	if (this.rotation) {
	    ctx.rotate(this.rotation);
	}
	ctx.scale(this.scale.x, this.scale.y);
	ctx.globalAlpha = this.alpha;
    }

    /** Renders its image. */
    renderImage(ctx: CanvasRenderingContext2D) {
	let skin = this.getSkin();
	if (skin !== null) {
    	    skin.render(ctx);
	}
    }
}


/** Sprite that consists of a single image that is
 *  fixed to a certain location.
 */
class FixedSprite extends Sprite {

    /** Visibility */
    visible: boolean = true;
    /** Image source to display. */
    skin: ImageSource;
    /** Sprite position. */
    pos: Vec2;

    constructor(skin: ImageSource=null, pos: Vec2=null) {
	super();
	this.skin = skin;
	this.pos = pos;
    }

    toString() {
	return '<FixedSprite: '+this.skin+'>';
    }

    /** Returns true if the sprite is visible. */
    isVisible(): boolean {
        return this.visible;
    }

    /** Returns the image source of the sprite. */
    getSkin(): ImageSource {
	return this.skin;
    }

    /** Returns the position of the sprite. */
    getPos(): Vec2 {
	return this.pos;
    }
}


//  Widget
//
class Widget extends Task {

    layer: SpriteLayer = null;

    chain(task: Task, signal: Signal=null): Task {
	if (task instanceof Widget) {
	    task.layer = this.layer;
	}
	return super.chain(task, signal);
    }

    init() {
        super.init();
	this.layer.add(this);
    }

    cleanup() {
	this.layer.remove(this);
	super.cleanup();
    }

    getSprites(): Sprite[] {
	return [];
    }
}


//  SpriteLayer
//
interface SpriteFunc {
    (sprite: Sprite): boolean;
}
class SpriteLayer {

    sprites: Sprite[] = [];
    widgets: Widget[] = [];

    toString() {
	return ('<SpriteLayer: sprites='+this.sprites+'>');
    }

    init() {
	this.sprites = [];
	this.widgets = [];
    }

    add(obj: Sprite|Widget) {
        if (obj instanceof Sprite) {
	    this.sprites.push(obj);
        } else if (obj instanceof Widget) {
            this.widgets.push(obj);
        }
    }

    remove(obj: Sprite|Widget) {
        if (obj instanceof Sprite) {
	    removeElement(this.sprites, obj);
        } else if (obj instanceof Widget) {
	    removeElement(this.widgets, obj);
        }
    }

    getSprites(): Sprite[] {
	let sprites = [];
	for (let widget of this.widgets) {
	    for (let sprite of widget.getSprites()) {
		sprites.push(sprite);
	    }
	}
	for (let sprite of this.sprites) {
	    sprites.push(sprite);
	}
	return sprites;
    }

    apply(f: SpriteFunc, window: Rect=null): Sprite {
	for (let widget of this.widgets) {
	    for (let sprite of widget.getSprites()) {
		let bounds = sprite.getBounds()
		if (window === null || bounds === null ||
                    bounds.overlaps(window)) {
                    if (f(sprite)) {
		        return sprite;
                    }
	        }
	    }
	}
	for (let sprite of this.sprites) {
	    let bounds = sprite.getBounds()
	    if (window === null || bounds === null ||
                bounds.overlaps(window)) {
                if (f(sprite)) {
		    return sprite;
                }
	    }
	}
        return null;
    }

    render(ctx: CanvasRenderingContext2D, window: Rect=null) {
        this.apply((sprite: Sprite) => {
	    if (sprite.isVisible()) {
		sprite.render(ctx);
	    }
            return false;
        }, window);
    }
}
