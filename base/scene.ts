/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="entity.ts" />
/// <reference path="layer.ts" />


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

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
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
  
    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
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

    tasklist: TaskList;
    layer: ScrollLayer;

    constructor() {
	super();
	this.tasklist = new TaskList();
	this.layer = new ScrollLayer(this.screen);
    }

    init() {
	super.init();
	this.tasklist.init();
	this.layer.init();
    }

    tick() {
	super.tick();
	this.tasklist.tick();
	this.layer.tick();
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	super.render(ctx, bx, by);
	this.layer.render(ctx, bx, by);
    }

    add(task: Task) {
	this.tasklist.add(task);
	if (task instanceof Widget) {
	    task.layer = this.layer;
	}
    }

    onMouseDown(p: Vec2, button: number) {
	super.onMouseDown(p, button);
	this.layer.onMouseDown(p, button);
    }

    onMouseUp(p: Vec2, button: number) {
	super.onMouseUp(p, button);
	this.layer.onMouseUp(p, button);
    }
    
    onMouseMove(p: Vec2) {
	super.onMouseMove(p);
	this.layer.onMouseMove(p);
    }
}
