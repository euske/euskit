/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="text.ts" />
/// <reference path="scene.ts" />


/** Initial gap of lame-encded MP3 files */
const MP3_GAP = 0.025;

interface ImageAsset {
    [index: string]: HTMLImageElement;
}
interface AudioAsset {
    [index: string]: HTMLAudioElement;
}
interface TextAsset {
    [index: string]: HTMLDivElement;
}

function getprops(a: NodeListOf<Element>) {
    let d:any = {};
    for (let i = 0; i < a.length; i++) {
	d[a[i].id] = a[i];
    }
    return d;
}
  

//  App
//  handles the event loop and global state management.
//  It also has shared resources (images, sounds, etc.)
//
class App {

    size: Vec2;
    framerate: number;
    elem: HTMLElement;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    audioContext: AudioContext;

    images: ImageAsset;
    sounds: AudioAsset;
    labels: TextAsset;
    
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

	// WebAudio!
	try {
	    this.audioContext = new AudioContext();
	} catch (e) {
	    this.audioContext = null;
	}

	// Resources;
	this.images = getprops(document.getElementsByTagName('img')) as ImageAsset;
	this.sounds = getprops(document.getElementsByTagName('audio')) as AudioAsset;
	this.labels = getprops(document.getElementsByClassName('label')) as TextAsset;
    }

    init(scene: Scene) {
	removeChildren(this.elem, 'div');
	this.setMusic();
	this.scene = scene;
	this.scene.init();
    }

    post(msg: Action) {
	this._msgs.push(msg);
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

    lockKeys(t: number=1) {
	this._keylock = getTime()+t;
    }

    keyDown(ev: KeyboardEvent) {
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
	case KeySym.Action1:
	case KeySym.Action2:
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

    keyUp(ev: KeyboardEvent) {
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
	case KeySym.Action1:
	case KeySym.Action2:
	case KeySym.Cancel:
	    if (this.keys[keysym]) {
		this.scene.onButtonReleased(keysym);
	    }
	    break;
	}
	this.keys[keysym] = false;
	this.scene.onKeyUp(ev.keyCode);
    }

    keyPress(ev: KeyboardEvent) {
	this.scene.onKeyPress(ev.charCode);
    }

    updateMousePos(ev: MouseEvent|Touch) {
	let bounds = this.elem.getBoundingClientRect();
	this.mousePos = new Vec2(
	    (ev.clientX-bounds.left)*this.canvas.width/bounds.width,
	    (ev.clientY-bounds.top)*this.canvas.height/bounds.height);
    }

    mouseDown(ev: MouseEvent) {
	this.updateMousePos(ev);
	switch (ev.button) {
	case 0:
	    this.mouseButton = true;
	    break;
	}
	this.scene.onMouseDown(this.mousePos, ev.button);
    }

    mouseUp(ev: MouseEvent) {
	this.updateMousePos(ev);
	switch (ev.button) {
	case 0:
	    this.mouseButton = false;
	    break;
	}
	this.scene.onMouseUp(this.mousePos, ev.button);
    }

    mouseMove(ev: MouseEvent) {
	this.updateMousePos(ev);
	this.scene.onMouseMove(this.mousePos);
    }

    touchStart(ev: TouchEvent) {
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

    touchEnd(ev: TouchEvent) {
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

    touchMove(ev: TouchEvent) {
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
	this.scene.onFocus();
    }

    blur() {
	this.scene.onBlur();
	if (this._music !== null) {
	    this._music.pause();
	}
	this.active = false;
    }

    tick() {
	this.scene.tick();
	if (0 < this._keylock && this._keylock < getTime()) {
	    this._keylock = 0;
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
	this.scene.render(this.ctx);
	this.ctx.restore();
    }

    setMusic(name: string=null, start=MP3_GAP, end=0) {
	if (this._music !== null) {
	    this._music.pause();
	}
	if (name === null) {
	    this._music = null;
	} else {
	    let sound = this.sounds[name];
	    this._loop_start = start;
	    this._loop_end = (end < 0)? sound.duration : end;
	    if (0 < sound.readyState) { // for IE bug
		sound.currentTime = MP3_GAP;
	    }
	    this._music = sound;
	    this._music.play();
	}
    }
  
    /** Play a sound resource. 
     * @param sound Sound name.
     * @param start Start position.
     */
    playSound(name: string, start=MP3_GAP) {
	let elem = this.sounds[name];
	elem.currentTime = start;
	elem.play();
    }
}


//  Global hook.
interface InitHook {
    (): any;
}
var HOOKS: InitHook[] = [];
// addInitHook: adds an initialization hoook.
function addInitHook(hook: InitHook) {
    HOOKS.push(hook);
}

var APP: App = null;

// main: sets up the browser interaction.
function main<T extends Scene>(
    scene0: { new():T; },
    width=320, height=240, elemId='game', framerate=30)
{
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
		app.keyDown(e);
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
		app.keyUp(e);
		break;
	    }
	}
    }

    function keypress(e: KeyboardEvent) {
	if (app.active) {
	    app.keyPress(e);
	}
    }
    
    function mousedown(e: MouseEvent) {
	if (app.active) {
	    app.mouseDown(e);
	}
    }
    
    function mouseup(e: MouseEvent) {
	if (app.active) {
	    app.mouseUp(e);
	}
    }
    
    function mousemove(e: MouseEvent) {
	if (app.active) {
	    app.mouseMove(e);
	}
    }
    
    function touchstart(e: TouchEvent) {
	if (app.active) {
	    app.touchStart(e);
	    e.preventDefault();
	}
    }
    
    function touchend(e: TouchEvent) {
	if (app.active) {
	    app.touchEnd(e);
	    e.preventDefault();
	}
    }
    
    function touchmove(e: TouchEvent) {
	if (app.active) {
	    app.touchMove(e);
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
    if (APP.audioContext !== null) {
	for (let id in APP.sounds) {
	    let source = APP.audioContext.createMediaElementSource(APP.sounds[id]);
	    source.connect(APP.audioContext.destination);
	}
    }
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
