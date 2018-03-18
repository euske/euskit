/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="sprite.ts" />
/// <reference path="entity.ts" />


//  World
//
class World extends ParallelTaskList {

    mouseFocus: Sprite = null;
    mouseActive: Sprite = null;
    mousedown: Signal;
    mouseup: Signal;
    window: Rect;

    field: EntityField;
    layers: SpriteLayer[];
    layer0: SpriteLayer;

    constructor(window: Rect) {
        super();
	this.mousedown = new Signal(this);
	this.mouseup = new Signal(this);
	this.window = window.copy();
        this.init();
    }

    toString() {
	return '<World: '+this.window+'>';
    }

    init() {
        super.init();
	this.field = new EntityField();
        this.layers = [];
	this.layer0 = this.newLayer();
    }

    tick() {
	super.tick();
	this.field.tick();
    }

    add(task: Task, layer: SpriteLayer=null, field: EntityField=null) {
	if (task instanceof Widget) {
	    task.layer = (layer !== null)? layer : this.layer0;
	}
	if (task instanceof Entity) {
	    task.field = (field !== null)? field : this.field;
	}
	super.add(task);
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.translate(-this.window.x, -this.window.y);
        for (let layer of this.layers) {
            layer.render(ctx, this.window);
        }
	ctx.restore();
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


//  Scene
//
class Scene {

    screen: Rect;

    constructor() {
	this.screen = new Rect(0, 0, APP.canvas.width, APP.canvas.height);
    }

    changeScene(scene: Scene) {
	APP.post(function () { APP.init(scene); });
    }

    init() {
	// [OVERRIDE]
    }

    tick() {
	this.update()
    }

    update() {
	// [OVERRIDE]
    }

    render(ctx: CanvasRenderingContext2D) {
	// [OVERRIDE]
    }

    onDirChanged(v: Vec2) {
	// [OVERRIDE]
    }

    onButtonPressed(keysym: KeySym) {
	// [OVERRIDE]
    }

    onButtonReleased(keysym: KeySym) {
	// [OVERRIDE]
    }

    onKeyDown(key: number) {
	// [OVERRIDE]
    }

    onKeyUp(key: number) {
	// [OVERRIDE]
    }

    onKeyPress(char: number) {
	// [OVERRIDE]
    }

    onMouseDown(p: Vec2, button: number) {
	// [OVERRIDE]
    }

    onMouseUp(p: Vec2, button: number) {
	// [OVERRIDE]
    }

    onMouseMove(p: Vec2) {
	// [OVERRIDE]
    }

    onFocus() {
	// [OVERRIDE]
    }

    onBlur() {
	// [OVERRIDE]
    }
}


//  HTMLScene
//
class HTMLScene extends Scene {

    text: string;

    constructor(text: string) {
	super();
	this.text = text;
    }

    init() {
	super.init();
	let scene = this;
	let bounds = APP.elem.getBoundingClientRect();
	let e = APP.addElement(
	    new Rect(bounds.width/8, bounds.height/4,
		     3*bounds.width/4, bounds.height/2));
	e.align = 'left';
	e.style.padding = '10px';
	e.style.color = 'black';
	e.style.background = 'white';
	e.style.border = 'solid black 2px';
	e.innerHTML = this.text;
	e.onmousedown = (function (e) { scene.change(); });
    }

    render(ctx: CanvasRenderingContext2D) {
	ctx.fillStyle = 'rgb(0,0,0)';
	fillRect(ctx, this.screen);
    }

    change() {
	// [OVERRIDE]
    }

    onMouseDown(p: Vec2, button: number) {
	this.change();
    }

    onKeyDown(key: number) {
	this.change();
    }

}


//  GameScene
//
class GameScene extends Scene {

    world: World = null;

    init() {
	super.init();
        this.world = new World(this.screen);
    }

    tick() {
	super.tick();
	this.world.tick();
    }

    render(ctx: CanvasRenderingContext2D) {
	super.render(ctx);
	this.world.render(ctx);
    }

    add(task: Task, layer: SpriteLayer=null, field: EntityField=null) {
	this.world.add(task, layer, field);
    }

    onMouseDown(p: Vec2, button: number) {
	super.onMouseDown(p, button);
	this.world.onMouseDown(p, button);
    }

    onMouseUp(p: Vec2, button: number) {
	super.onMouseUp(p, button);
	this.world.onMouseUp(p, button);
    }

    onMouseMove(p: Vec2) {
	super.onMouseMove(p);
	this.world.onMouseMove(p);
    }
}
