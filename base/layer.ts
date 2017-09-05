/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="sprite.ts" />
/// <reference path="entity.ts" />


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
    clicked: Signal;

    layers: SpriteLayer[] = [];
    window: Rect;

    constructor(window: Rect) {
	this.clicked = new Signal(this);
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
        let f = ((sprite: Sprite) => {
            return sprite.visible && sprite.mouseSelectable(p);
        });
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
