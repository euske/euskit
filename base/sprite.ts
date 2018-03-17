/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />


/** Object that has a size and rotation and draws itself on screen.
 *  It can also interact with mouse/touch.
 */
class Sprite {

    /** True if this sprite is rendered. */
    visible: boolean = true;
    /** Image scaling. Negative values can be used for flipped images. */
    scale: Vec2 = new Vec2(1, 1);
    /** Image rotation (in radian). */
    rotation: number = 0;
    alpha: number = 1.0;

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
	return this.visible && this.getBounds().containsPt(p);
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

    start(taskList: TaskList) {
	super.start(taskList);
	this.layer.addWidget(this);
    }

    stop() {
	this.layer.removeWidget(this);
	super.stop();
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

    clear() {
	this.sprites = [];
	this.widgets = [];
    }

    addSprite(sprite: Sprite) {
	this.sprites.push(sprite);
    }

    removeSprite(sprite: Sprite) {
	removeElement(this.sprites, sprite);
    }

    addWidget(widget: Widget) {
	this.widgets.push(widget);
    }

    removeWidget(widget: Widget) {
	removeElement(this.widgets, widget);
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
	    if (sprite.visible) {
		sprite.render(ctx);
	    }
            return false;
        }, window);
    }
}


//  Camera
//
class Camera {

    mouseFocus: Sprite = null;
    mouseActive: Sprite = null;
    mousedown: Signal;
    mouseup: Signal;

    layers: SpriteLayer[] = [];
    window: Rect;

    constructor(window: Rect) {
	this.mousedown = new Signal(this);
	this.mouseup = new Signal(this);
	this.window = window.copy();
    }

    toString() {
	return '<Camera: '+this.window+'>';
    }

    newLayer(): SpriteLayer {
        let layer = new SpriteLayer();
        this.layers.push(layer);
        return layer;
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

    render(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.translate(-this.window.x, -this.window.y);
        for (let layer of this.layers) {
            layer.render(ctx, this.window);
        }
	ctx.restore();
    }

    findSpriteAt(p: Vec2) {
	// check in the reversed order.
        let f = ((sprite: Sprite) => { return sprite.mouseSelectable(p); });
        for (let i = this.layers.length; 0 < i; i--) {
            let layer = this.layers[i-1];
            let sprite = layer.apply(f);
            if (sprite !== null) {
                return sprite;
            }
        }
	return null;
    }

    onMouseDown(p: Vec2, button: number) {
	if (button == 0) {
	    this.mouseFocus = this.findSpriteAt(p);
	    this.mouseActive = this.mouseFocus;
	    if (this.mouseActive !== null) {
		this.mousedown.fire(this.mouseActive, p);
	    }
	}
    }

    onMouseUp(p: Vec2, button: number) {
	if (button == 0) {
	    this.mouseFocus = this.findSpriteAt(p);
	    if (this.mouseActive !== null) {
		this.mouseup.fire(this.mouseActive, p);
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
