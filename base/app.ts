/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="text.ts" />
/// <reference path="scene.ts" />


interface ImageDictionary {
    [index: string]: HTMLImageElement;
}
interface AudioDictionary {
    [index: string]: HTMLAudioElement;
}
interface DivDictionary {
    [index: string]: HTMLDivElement;
}


//  App
//  handles the event loop and global state management.
//  It also has shared resources (images, audios, etc.)
//
class App {

    framerate: number;
    frame: HTMLCanvasElement;
    images: ImageDictionary;
    audios: AudioDictionary;
    labels: DivDictionary;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    ticks: number = 0;
    scene: Scene = null;
    active: boolean = false;
    keyDir: Vec2 = new Vec2();
    keyAction: boolean = false;
    keyCancel: boolean = false;
    mousePos: Vec2 = new Vec2();
    mouseButton: boolean = false;
    
    private _keylock: number = 0;
    private _msgs: Action[] = [];
    private _music: HTMLAudioElement = null;
    private _loop_start: number = 0;
    private _loop_end: number = 0;

    private _key_left: boolean = false;
    private _key_right: boolean = false;
    private _key_up: boolean = false;
    private _key_down: boolean = false;
    
    constructor(framerate: number,
		scale: number,
		frame: HTMLCanvasElement,
		images: ImageDictionary,
		audios: AudioDictionary,
		labels: DivDictionary) {
	this.framerate = framerate;
	this.frame = frame;
	this.images = images;
	this.audios = audios;
	this.labels = labels;

	// Initialize the off-screen bitmap.
	this.canvas = createCanvas(this.frame.width/scale,
				   this.frame.height/scale);
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
	this.frame.parentNode.appendChild(e);
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
	// [OVERRIDE]
	// [GAME SPECIFIC CODE]
	let keysym = getKeySym(ev.keyCode);
	switch (keysym) {
	case KeySym.Left:
	    this._key_left = true;
	    this.keyDir.x = -1;
	    this.scene.setDir(this.keyDir);
	    break;
	case KeySym.Right:
	    this._key_right = true;
	    this.keyDir.x = +1;
	    this.scene.setDir(this.keyDir);
	    break;
	case KeySym.Up:
	    this._key_up = true;
	    this.keyDir.y = -1;
	    this.scene.setDir(this.keyDir);
	    break;
	case KeySym.Down:
	    this._key_down = true;
	    this.keyDir.y = +1;
	    this.scene.setDir(this.keyDir);
	    break;
	case KeySym.Action:
	    if (!this.keyAction) {
		this.keyAction = true;
		this.scene.setAction(this.keyAction);
	    }
	    break;
	case KeySym.Cancel:
	    if (!this.keyCancel) {
		this.keyCancel = true;
		this.scene.setCancel(this.keyCancel);
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
	this.scene.keydown(ev.keyCode);
    }

    keyup(ev: KeyboardEvent) {
	// [OVERRIDE]
	// [GAME SPECIFIC CODE]
	let keysym = getKeySym(ev.keyCode);
	switch (keysym) {
	case KeySym.Left:
	    this._key_left = false;
	    this.keyDir.x = (this._key_right) ? +1 : 0;
	    this.scene.setDir(this.keyDir);
	    break;
	case KeySym.Right:
	    this._key_right = false;
	    this.keyDir.x = (this._key_left) ? -1 : 0;
	    this.scene.setDir(this.keyDir);
	    break;
	case KeySym.Up:
	    this._key_up = false;
	    this.keyDir.y = (this._key_down) ? +1 : 0;
	    this.scene.setDir(this.keyDir);
	    break;
	case KeySym.Down:
	    this._key_down = false;
	    this.keyDir.y = (this._key_up) ? -1 : 0;
	    this.scene.setDir(this.keyDir);
	    break;
	case KeySym.Action:
	    if (this.keyAction) {
		this.keyAction = false;
		this.scene.setAction(this.keyAction);
	    }
	    break;
	case KeySym.Cancel:
	    if (this.keyCancel) {
		this.keyCancel = false;
		this.scene.setCancel(this.keyCancel);
	    }
	    break;
	}
	this.scene.keyup(ev.keyCode);
    }

    updateMousePos(ev: MouseEvent) {
	let bounds = this.frame.getBoundingClientRect();
	this.mousePos = new Vec2(
	    (ev.clientX-bounds.left)*this.canvas.width/bounds.width,
	    (ev.clientY-bounds.top)*this.canvas.height/bounds.height);
    }

    mousedown(ev: MouseEvent) {
	// [OVERRIDE]
	if (ev.target === this.frame) {
	    this.updateMousePos(ev);
	    switch (ev.button) {
	    case 0:
		this.mouseButton = true;
		break;
	    }
	    this.scene.mousedown(this.mousePos.x, this.mousePos.y, ev.button);
	}
    }

    mouseup(ev: MouseEvent) {
	// [OVERRIDE]
	if (ev.target === this.frame) {
	    this.updateMousePos(ev);
	    switch (ev.button) {
	    case 0:
		this.mouseButton = false;
		break;
	    }
	    this.scene.mouseup(this.mousePos.x, this.mousePos.y, ev.button);
	}
    }

    mousemove(ev: MouseEvent) {
	// [OVERRIDE]
	if (ev.target === this.frame) {
	    this.updateMousePos(ev);
	    this.scene.mousemove(this.mousePos.x, this.mousePos.y);
	}
    }

    focus() {
	// [OVERRIDE]
	this.active = true;
	if (this._music !== null && 0 < this._music.currentTime) {
	    this._music.play();
	}
    }

    blur() {
	// [OVERRIDE]
	if (this._music !== null) {
	    this._music.pause();
	}
	this.active = false;
    }

    init(scene: Scene) {
	// [OVERRIDE]
	removeChildren(this.frame.parentNode, 'div');
	
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
		this._music.currentTime = 0;
	    }
	    this._music.play();
	}
    }
  
    post(msg: Action) {
	this._msgs.push(msg);
    }

    tick() {
	// [OVERRIDE]
	// [GAME SPECIFIC CODE]
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
	// [OVERRIDE]
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.ctx.save();
	this.scene.render(this.ctx, 0, 0);
	this.ctx.restore();
    }

}


//  Global App instance.
var APP: App;

// main: sets up the browser interaction.
function main<T extends Scene>(
    scene0: { new(app:App):T; },
    canvasId='game', scale=2, framerate=30)
{
    function getprops(a: NodeListOf<Element>) {
	let d:any = {};
	for (let i = 0; i < a.length; i++) {
	    d[a[i].id] = a[i];
	}
	return d;
    }
  
    let images = getprops(document.getElementsByTagName('img')) as ImageDictionary;
    let audios = getprops(document.getElementsByTagName('audio')) as AudioDictionary;
    let labels = getprops(document.getElementsByClassName('label')) as DivDictionary;
    let frame = document.getElementById(canvasId) as HTMLCanvasElement;
    let ctx = getEdgeyContext(frame);
    APP = new App(framerate, scale, frame, images, audios, labels);
    let timer: number;

    function repaint() {
	ctx.drawImage(APP.canvas,
		      0, 0, APP.canvas.width, APP.canvas.height,
		      0, 0, frame.width, frame.height);
    }    
    
    function tick() {
	if (APP.active) {
	    APP.tick();
	    APP.repaint();
	    repaint();
	}
    }
    
    function keydown(e: KeyboardEvent) {
	if (APP.active) {
	    switch (e.keyCode) {
	    case 17:			// Control
	    case 18:			// Meta
		break;
	    default:
		APP.keydown(e);
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
	if (APP.active) {
	    switch (e.keyCode) {
	    case 17:			// Control
	    case 18:			// Meta
		break;
	    default:
		APP.keyup(e);
		break;
	    }
	}
    }
    
    function mousedown(e: MouseEvent) {
	if (APP.active) {
	    APP.mousedown(e);
	}
    }
    
    function mouseup(e: MouseEvent) {
	if (APP.active) {
	    APP.mouseup(e);
	}
    }
    
    function mousemove(e: MouseEvent) {
	if (APP.active) {
	    APP.mousemove(e);
	}
    }
    
    function focus(e: FocusEvent) {
	if (!APP.active) {
	    APP.focus();
	    repaint();
	}
    }
    
    function blur(e: FocusEvent) {
	if (APP.active) {
	    APP.blur();
	    repaint();
	}
	let size = 50;
	ctx.save();
	ctx.fillStyle = 'rgba(0,0,64, 0.5)'; // gray out.
	ctx.fillRect(0, 0, frame.width, frame.height);
	ctx.fillStyle = 'lightgray';
	ctx.beginPath();		// draw a play button.
	ctx.moveTo(frame.width/2-size, frame.height/2-size);
	ctx.lineTo(frame.width/2-size, frame.height/2+size);
	ctx.lineTo(frame.width/2+size, frame.height/2);
	ctx.fill();
	ctx.restore();
    }

    APP.init(new scene0(APP));
    APP.focus();
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('mousedown', mousedown);
    window.addEventListener('mouseup', mouseup);
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('focus', focus);
    window.addEventListener('blur', blur);
    timer = window.setInterval(tick, 1000/framerate);
    frame.focus();
}
