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
    font: Font;
    shadowfont: Font;
    colorfont: Font;

    screen: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    
    scene: Scene = null;
    active: boolean = false;
    keylock: number = 0 ;
    key_dir: Vec2 = new Vec2();
    key_action: boolean = false;
    
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
	this.font = new Font(this.images['font'], 'white');
	this.colorfont = new Font(this.images['font'], null);
	this.shadowfont = new ShadowFont(this.images['font'], 'white');

	// Initialize the off-screen bitmap.
	this.screen = createCanvas(this.frame.width/scale,
				   this.frame.height/scale);
	this.ctx = getEdgeyContext(this.screen);
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
	this.keylock = this.framerate;
    }

    keydown(ev: KeyboardEvent) {
	if (0 < this.keylock) return;
	// [OVERRIDE]
	// [GAME SPECIFIC CODE]
	let keysym = getKeySym(ev.keyCode);
	switch (keysym) {
	case 'left':
	    this._key_left = true;
	    this.key_dir.x = -1;
	    this.scene.set_dir(this.key_dir);
	    break;
	case 'right':
	    this._key_right = true;
	    this.key_dir.x = +1;
	    this.scene.set_dir(this.key_dir);
	    break;
	case 'up':
	    this._key_up = true;
	    this.key_dir.y = -1;
	    this.scene.set_dir(this.key_dir);
	    break;
	case 'down':
	    this._key_down = true;
	    this.key_dir.y = +1;
	    this.scene.set_dir(this.key_dir);
	    break;
	case 'action':
	    if (!this.key_action) {
		this.key_action = true;
		this.scene.set_action(this.key_action);
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
	case 'left':
	    this._key_left = false;
	    this.key_dir.x = (this._key_right) ? +1 : 0;
	    this.scene.set_dir(this.key_dir);
	    break;
	case 'right':
	    this._key_right = false;
	    this.key_dir.x = (this._key_left) ? -1 : 0;
	    this.scene.set_dir(this.key_dir);
	    break;
	case 'up':
	    this._key_up = false;
	    this.key_dir.y = (this._key_down) ? +1 : 0;
	    this.scene.set_dir(this.key_dir);
	    break;
	case 'down':
	    this._key_down = false;
	    this.key_dir.y = (this._key_up) ? -1 : 0;
	    this.scene.set_dir(this.key_dir);
	    break;
	case 'action':
	    if (this.key_action) {
		this.key_action = false;
		this.scene.set_action(this.key_action);
	    }
	    break;
	}
	this.scene.keyup(ev.keyCode);
    }

    mousedown(ev: MouseEvent) {
	// [OVERRIDE]
	if (ev.target === this.frame) {
	    this.scene.mousedown(
		ev.layerX*this.screen.width/this.frame.width,
		ev.layerY*this.screen.height/this.frame.height,
		ev.button);
	}
    }

    mouseup(ev: MouseEvent) {
	// [OVERRIDE]
	if (ev.target === this.frame) {
	    this.scene.mouseup(
		ev.layerX*this.screen.width/this.frame.width,
		ev.layerY*this.screen.height/this.frame.height,
		ev.button);
	}
    }

    mousemove(ev: MouseEvent) {
	// [OVERRIDE]
	if (ev.target === this.frame) {
	    this.scene.mousemove(
		ev.layerX*this.screen.width/this.frame.width,
		ev.layerY*this.screen.height/this.frame.height);
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
	
	this.set_music();
	this.scene = scene;
	this.scene.init();
    }

    set_music(music: HTMLAudioElement=null, start=0, end=0) {
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
	this.scene.tick();
	if (0 < this.keylock) {
	    this.keylock--;
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
	this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);
	this.ctx.save();
	this.scene.render(this.ctx, 0, 0);
	this.ctx.restore();
    }

}


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
    let app = new App(framerate, scale, frame, images, audios, labels);
    let ctx = getEdgeyContext(frame);
    let timer: number;
  
    function repaint() {
	ctx.drawImage(app.screen,
		      0, 0, app.screen.width, app.screen.height,
		      0, 0, frame.width, frame.height);
    }    
    
    function tick() {
	if (app.active) {
	    app.tick();
	    app.repaint();
	    repaint();
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
    
    function focus(e: FocusEvent) {
	if (!app.active) {
	    app.focus();
	    repaint();
	}
    }
    
    function blur(e: FocusEvent) {
	if (app.active) {
	    app.blur();
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

    app.init(new scene0(app));
    app.focus();
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
