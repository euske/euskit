/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="sprite.ts" />
/// <reference path="task.ts" />


//  Widget
//
class Widget extends Task {

    layer: Layer = null;
    
    chain(task: Task, signal: Signal=null): Task {
	if (task instanceof Widget) {
	    task.layer = this.layer;
	}
	return super.chain(task, signal);
    }

    init() {
	super.init();
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


//  Layer
// 
class Layer {

    sprites: Sprite[] = [];
    widgets: Widget[] = [];
    
    mouseFocus: Sprite = null;
    mouseActive: Sprite = null;
    clicked: Signal;

    constructor() {
	this.clicked = new Signal(this);
    }

    toString() {
	return ('<Layer: sprites='+this.sprites+'>');
    }
  
    init() {
	this.sprites = [];
	this.widgets = [];
	this.mouseFocus = null;
	this.mouseActive = null;
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

    getAllSprites(): Sprite[] {
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

    render(ctx: CanvasRenderingContext2D) {
	for (let sprite of this.getAllSprites()) {
	    if (sprite.visible) {
		sprite.render(ctx);
	    }
	}
    }

    findSpriteAt(p: Vec2) {
	for (let i = this.sprites.length-1; 0 <= i; i--) {
	    let sprite = this.sprites[i]; // from reversed order.
	    if (sprite.mouseSelectable(p)) {
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
	this.window = window.copy();
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

    render(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.translate(-this.window.x, -this.window.y);
	for (let sprite of this.getAllSprites()) {
	    if (sprite.visible) {
		let bounds = sprite.getBounds()
		if (bounds === null || bounds.overlaps(this.window)) {
		    sprite.render(ctx);
		}
	    }
	}
	ctx.restore();
    }
}
