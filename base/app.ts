/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="text.ts" />
/// <reference path="scene.ts" />


//  App
//  handles the event loop and global state management.
//  It also has shared resources (images, audios, etc.)
//
class App {

    size: Vec2;
    framerate: number;
    elem: HTMLElement;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    ticks: number = 0;
    scene: Scene = null;
    active: boolean = false;
    keys: { [index: number]: boolean } = {};
    keyDir: Vec2 = new Vec2();
    mousePos: Vec2 = new Vec2();
    mouseButton: boolean = false;
    
    private _keylock: number = 0;
    private _msgs: Action[] = [];
    private _music: HTMLAudioElement = null;
    private _loop_start: number = 0;
    private _loop_end: number = 0;
    private _touch_id: any = null;
    
    constructor(size: Vec2,
		framerate: number,
		elem: HTMLElement) {
	this.size = size;
	this.framerate = framerate;
	this.elem = elem;

	// Initialize the off-screen bitmap.
	this.canvas = createCanvas(this.size.x, this.size.y);
	this.ctx = getEdgeyContext(this.canvas);
    }

    addElement(bounds: Rect) {
	let e = document.createElement('div');
	e.style.position = 'absolute';
	e.style.left = bounds.x+'px';
	e.style.top = bounds.y+'px';
	e.style.width = bounds.width+'px';
	e.style.height = bounds.height+'px';
	e.style.padding = '0px';
	this.elem.appendChild(e);
	return e;
    }

    removeElement(e: HTMLElement) {
	e.parentNode.removeChild(e);
    }

    lockKeys() {
	this._keylock = this.framerate;
    }

    keydown(ev: KeyboardEvent) {
	if (0 < this._keylock) return;
	let keysym = getKeySym(ev.keyCode);
	switch (keysym) {
	case KeySym.Left:
	    this.keyDir.x = -1;
	    this.scene.onDirChanged(this.keyDir);
	    break;
	case KeySym.Right:
	    this.keyDir.x = +1;
	    this.scene.onDirChanged(this.keyDir);
	    break;
	case KeySym.Up:
	    this.keyDir.y = -1;
	    this.scene.onDirChanged(this.keyDir);
	    break;
	case KeySym.Down:
	    this.keyDir.y = +1;
	    this.scene.onDirChanged(this.keyDir);
	    break;
	case KeySym.Action:
	case KeySym.Cancel:
	    if (!this.keys[keysym]) {
		this.scene.onButtonPressed(keysym);
	    }
	    break;
	default:
	    switch (ev.keyCode) {
	    case 112:			// F1
		break;
	    case 27:			// ESC
		if (this.active) {
		    this.blur();
		} else {
		    this.focus();
		}
		break;
	    }
	    break;
	}
	this.keys[keysym] = true;
	this.scene.onKeyDown(ev.keyCode);
    }

    keyup(ev: KeyboardEvent) {
	let keysym = getKeySym(ev.keyCode);
	switch (keysym) {
	case KeySym.Left:
	    this.keyDir.x = (this.keys[KeySym.Right]) ? +1 : 0;
	    this.scene.onDirChanged(this.keyDir);
	    break;
	case KeySym.Right:
	    this.keyDir.x = (this.keys[KeySym.Left]) ? -1 : 0;
	    this.scene.onDirChanged(this.keyDir);
	    break;
	case KeySym.Up:
	    this.keyDir.y = (this.keys[KeySym.Down]) ? +1 : 0;
	    this.scene.onDirChanged(this.keyDir);
	    break;
	case KeySym.Down:
	    this.keyDir.y = (this.keys[KeySym.Up]) ? -1 : 0;
	    this.scene.onDirChanged(this.keyDir);
	    break;
	case KeySym.Action:
	case KeySym.Cancel:
	    if (this.keys[keysym]) {
		this.scene.onButtonReleased(keysym);
	    }
	    break;
	}
	this.keys[keysym] = false;
	this.scene.onKeyUp(ev.keyCode);
    }

    keypress(ev: KeyboardEvent) {
	this.scene.onKeyPress(ev.charCode);
    }

    updateMousePos(ev: MouseEvent|Touch) {
	let bounds = this.elem.getBoundingClientRect();
	this.mousePos = new Vec2(
	    (ev.clientX-bounds.left)*this.canvas.width/bounds.width,
	    (ev.clientY-bounds.top)*this.canvas.height/bounds.height);
    }

    mousedown(ev: MouseEvent) {
	this.updateMousePos(ev);
	switch (ev.button) {
	case 0:
	    this.mouseButton = true;
	    break;
	}
	this.scene.onMouseDown(this.mousePos, ev.button);
    }

    mouseup(ev: MouseEvent) {
	this.updateMousePos(ev);
	switch (ev.button) {
	case 0:
	    this.mouseButton = false;
	    break;
	}
	this.scene.onMouseUp(this.mousePos, ev.button);
    }

    mousemove(ev: MouseEvent) {
	this.updateMousePos(ev);
	this.scene.onMouseMove(this.mousePos);
    }

    touchstart(ev: TouchEvent) {
	let touches = ev.changedTouches;
	for (let i = 0; i < touches.length; i++) {
	    let t = touches[i];
	    if (this._touch_id === null) {
		this._touch_id = t.identifier;
		this.mouseButton = true;
		this.updateMousePos(t);
		this.scene.onMouseDown(this.mousePos, 0);
	    }
	}
    }

    touchend(ev: TouchEvent) {
	let touches = ev.changedTouches;
	for (let i = 0; i < touches.length; i++) {
	    let t = touches[i];
	    if (this._touch_id !== null) {
		this._touch_id = null;
		this.mouseButton = false;
		this.updateMousePos(t);
		this.scene.onMouseUp(this.mousePos, 0);
	    }
	}
    }

    touchmove(ev: TouchEvent) {
	let touches = ev.changedTouches;
	for (let i = 0; i < touches.length; i++) {
	    let t = touches[i];
	    if (this._touch_id == t.identifier) {
		this.updateMousePos(t);
		this.scene.onMouseMove(this.mousePos);
	    }
	}
    }

    focus() {
	this.active = true;
	if (this._music !== null && 0 < this._music.currentTime) {
	    this._music.play();
	}
    }

    blur() {
	if (this._music !== null) {
	    this._music.pause();
	}
	this.active = false;
    }

    init(scene: Scene) {
	removeChildren(this.elem, 'div');
	this.setMusic();
	this.scene = scene;
	this.scene.init();
    }

    setMusic(music: HTMLAudioElement=null, start=0, end=0) {
	if (this._music !== null) {
	    this._music.pause();
	}
	this._music = music;
	this._loop_start = start;
	this._loop_end = end;
	if (this._music !== null) {
	    if (0 < this._music.readyState) { // for IE bug
		this._music.currentTime = start;
	    }
	    this._music.play();
	}
    }
  
    post(msg: Action) {
	this._msgs.push(msg);
    }

    tick() {
	this.scene.tick(this.ticks/this.framerate);
	this.ticks++;
	if (0 < this._keylock) {
	    this._keylock--;
	}

	if (this._music !== null &&
	    this._loop_start < this._loop_end &&
	    this._loop_end <= this._music.currentTime) {
	    this._music.currentTime = this._loop_start;
	}

	while (0 < this._msgs.length) {
	    let msg = this._msgs.shift();
	    msg();
	}
    }

    repaint() {
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.ctx.save();
	this.scene.render(this.ctx, 0, 0);
	this.ctx.restore();
    }

}


//  Global asset variables.
interface ImageAsset {
    [index: string]: HTMLImageElement;
}
interface SoundAsset {
    [index: string]: HTMLAudioElement;
}
interface TextAsset {
    [index: string]: HTMLDivElement;
}
interface InitHook {
    (): any;
}

var IMAGES: ImageAsset = {};
var SOUNDS: SoundAsset = {};
var TEXTS: TextAsset = {};
var HOOKS: InitHook[] = [];
var APP: App = null;

// addInitHook: adds an initialization hoook.
function addInitHook(hook: InitHook) {
    HOOKS.push(hook);
}

// main: sets up the browser interaction.
function main<T extends Scene>(
    scene0: { new():T; },
    width=320, height=240, elemId='game', framerate=30)
{
    function getprops(a: NodeListOf<Element>) {
	let d:any = {};
	for (let i = 0; i < a.length; i++) {
	    d[a[i].id] = a[i];
	}
	return d;
    }
  
    let elem = document.getElementById(elemId);
    let size = new Vec2(width, height);
    let app = new App(size, framerate, elem);
    let canvas = app.canvas;

    function tick() {
	if (app.active) {
	    app.tick();
	    app.repaint();
	}
    }
    
    function keydown(e: KeyboardEvent) {
	if (app.active) {
	    switch (e.keyCode) {
	    case 17:			// Control
	    case 18:			// Meta
		break;
	    default:
		app.keydown(e);
		break;
	    }
	    switch (e.keyCode) {
	    case 8:			// Backspace
	    case 9:			// Tab
	    case 13:			// Return
	    case 14:			// Enter
	    case 32:			// Space
	    case 33:			// PageUp
	    case 34:			// PageDown
	    case 35:			// End
	    case 36:			// Home
	    case 37:			// Left
	    case 38:			// Up
	    case 39:			// Right
	    case 40:			// Down
		e.preventDefault();
		break;
	    }
	}
    }
    
    function keyup(e: KeyboardEvent) {
	if (app.active) {
	    switch (e.keyCode) {
	    case 17:			// Control
	    case 18:			// Meta
		break;
	    default:
		app.keyup(e);
		break;
	    }
	}
    }

    function keypress(e: KeyboardEvent) {
	if (app.active) {
	    app.keypress(e);
	}
    }
    
    function mousedown(e: MouseEvent) {
	if (app.active) {
	    app.mousedown(e);
	}
    }
    
    function mouseup(e: MouseEvent) {
	if (app.active) {
	    app.mouseup(e);
	}
    }
    
    function mousemove(e: MouseEvent) {
	if (app.active) {
	    app.mousemove(e);
	}
    }
    
    function touchstart(e: TouchEvent) {
	if (app.active) {
	    app.touchstart(e);
	    e.preventDefault();
	}
    }
    
    function touchend(e: TouchEvent) {
	if (app.active) {
	    app.touchend(e);
	    e.preventDefault();
	}
    }
    
    function touchmove(e: TouchEvent) {
	if (app.active) {
	    app.touchmove(e);
	    e.preventDefault();
	}
    }
    
    function focus(e: FocusEvent) {
	log("app.focus");
	if (!app.active) {
	    app.focus();
	}
    }
    
    function blur(e: FocusEvent) {
	log("app.blur");
	if (app.active) {
	    app.blur();
	}
	let size = Math.min(canvas.width, canvas.height)/8;
	let ctx = canvas.getContext('2d');
	ctx.save();
	ctx.fillStyle = 'rgba(0,0,64, 0.5)'; // gray out.
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'lightgray';
	ctx.beginPath();		// draw a play button.
	ctx.moveTo(canvas.width/2-size, canvas.height/2-size);
	ctx.lineTo(canvas.width/2-size, canvas.height/2+size);
	ctx.lineTo(canvas.width/2+size, canvas.height/2);
	ctx.fill();
	ctx.restore();
    }

    function resize(e: Event) {
	log("app.resize");
	let bounds = elem.getBoundingClientRect();
	// Center the canvas.
	let cw = bounds.width, ch = bounds.height;
	if (canvas.height*bounds.width < canvas.width*bounds.height) {
	    ch = int(canvas.height * bounds.width / canvas.width);
	} else {
	    cw = int(canvas.width * bounds.height / canvas.height);
	}
	canvas.style.position = 'absolute';
	canvas.style.padding = '0px';
	canvas.style.left = ((bounds.width-cw)/2)+'px';
	canvas.style.top = ((bounds.height-ch)/2)+'px';
	canvas.style.width = cw+'px';
	canvas.style.height = ch+'px';
    }

    APP = app;
    IMAGES = getprops(document.getElementsByTagName('img')) as ImageAsset;
    SOUNDS = getprops(document.getElementsByTagName('audio')) as SoundAsset;
    TEXTS = getprops(document.getElementsByClassName('label')) as TextAsset;
    for (let hook of HOOKS) {
	hook();
    }
    
    app.init(new scene0());
    app.focus();
    elem.appendChild(canvas);
    elem.addEventListener('mousedown', mousedown, false);
    elem.addEventListener('mouseup', mouseup, false);
    elem.addEventListener('mousemove', mousemove, false);
    elem.addEventListener('touchstart', touchstart, false);
    elem.addEventListener('touchend', touchend, false);
    elem.addEventListener('touchmove', touchmove, false);
    elem.focus();
    resize(null);
    window.addEventListener('focus', focus);
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('keypress', keypress);
    window.addEventListener('resize', resize);
    window.setInterval(tick, 1000/framerate);
    window.focus();
}
