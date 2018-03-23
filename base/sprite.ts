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

    /** Returns true if the sprite can respond to mouse event. 
     * @param p Mouse pointer.
     */
    mouseSelectable(p: Vec2): boolean {
        if (!this.isVisible()) return false;
        let bounds = this.getBounds();
	return (bounds !== null && bounds.containsPt(p));
    }

    /** Returns the bounds of the sprite at a given pos. 
     * @param pos Location.
     */
    getBounds(pos: Vec2=null): Rect {
	let skin = this.getSkin();
	if (skin === null) return null;
	if (pos === null) {
	    pos = this.getPos();
	    if (pos === null) return null;
	}
	return skin.getBounds().add(pos);
    }

    /** Renders itself in the given context. 
     * @param ctx Rendering context.
     */
    render(ctx: CanvasRenderingContext2D) {
	ctx.save();
	this.setupContext(ctx);
	this.renderImage(ctx);
	ctx.restore();
    }

    /** Prepares the context for drawing. 
     * @param ctx Rendering context.
     */
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

    /** Renders its image.
     * @param ctx Rendering context.
     */
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

    /** Creates a fixed sprite.
     * @param skin ImageSource.
     * @param pos Location.
     */
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


/** Task that has one or more Sprites.
 */
class Widget extends Task {

    /** List to which this widget belongs (assigned by World). */
    layer: SpriteLayer = null;

    /** Invoked when the task is started. */
    init() {
        super.init();
	this.layer.add(this);
    }

    /** Invoked when the task is stopped. */
    cleanup() {
	this.layer.remove(this);
	super.cleanup();
    }

    /** Returns a list of Sprites that are owned by this widget. */
    getSprites(): Sprite[] {
	return [];
    }
}


/** Widget that has exactly one Sprite.
 */
class SingleWidget extends Widget {

    /** Single sprite */
    sprite: Sprite;

    /** Creates a Widget with a single sprite.
     * @param sprite Sprite.
     */
    constructor(sprite: Sprite) {
        super();
        this.sprite = sprite;
    }

    /** Returns the list of Sprites that are owned by this widget. */
    getSprites(): Sprite[] {
	return [this.sprite];
    }    
}


/** Single layer of Sprites that are displayed.
 */
class SpriteLayer {

    /** List of widgets. */
    widgets: Widget[] = [];

    constructor() {
        this.init();
    }
    
    toString() {
	return ('<SpriteLayer: widgets='+this.widgets+'>');
    }

    /** Empties the widget list. */
    init() {
	this.widgets = [];
    }

    /** Add a new Widget to the list.
     * @param widget Widget to add.
     */
    add(widget: Widget) {
        this.widgets.push(widget);
    }

    /** Remove an existing Widget from the list.
     * @param task Task to remove.
     */
    remove(widget: Widget) {
	removeElement(this.widgets, widget);
    }

    /** Returns a list of all Sprites contained. */
    getSprites(): Sprite[] {
	let sprites = [];
	for (let widget of this.widgets) {
	    for (let sprite of widget.getSprites()) {
		sprites.push(sprite);
	    }
	}
	return sprites;
    }

    /** Applies a given function to each sprite in the list.
     * @param f Function to apply.
     * @param window Window to limit the area.
     */
    apply(f: (s:Sprite)=>boolean, window: Rect=null): Sprite {
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
        return null;
    }

    /** Renders itself in the given context. 
     * @param ctx Rendering context.
     * @param window Window to limit the area.
     */
    render(ctx: CanvasRenderingContext2D, window: Rect=null) {
        this.apply((sprite: Sprite) => {
	    if (sprite.isVisible()) {
		sprite.render(ctx);
	    }
            return false;
        }, window);
    }
}
