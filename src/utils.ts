// Misc. routines.

// log(...): display a thing in the console (Firefox only, maybe)
function log(...params: any[])
{
    if (window.console !== undefined) {
	window.console.log.apply(window.console, params);
    }
}

// assert(x, msg): throw an exception if the condition is not met.
function assert(x: boolean, msg: string)
{
    if (!x) {
	throw new Error(msg);
    }
}

// applyMixins(class, [baseclass, ...]): create a mixin class.
function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
	Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
	    derivedCtor.prototype[name] = baseCtor.prototype[name];
	});
    });
}

// fmod(x, y):
function fmod(x: number, y: number)
{
    const v = x % y;
    return (0 <= v)? v : v+y;
}

// int(x):
const int = Math.floor;

// upperbound(x):
const upperbound = Math.min;

// lowerbound(x):
const lowerbound = Math.max;

// clamp(v0, v, v1): limit the value within v0-v1.
function clamp(v0: number, v: number, v1: number)
{
    return Math.min(Math.max(v, v0), v1);
}

// sign(v): return -1, 0, +1
function sign(v: number)
{
    if (v < 0) {
	return -1;
    } else if (0 < v) {
	return +1;
    } else {
	return 0;
    }
}

// blink(t, d): returns true if t is within the on interval.
function blink(t: number, d: number)
{
    if (d === 0) return true;
    return ((t % d) < d/2);
}

// rnd(a, b): returns a random number.
function frnd(a: number, b=0)
{
    if (b < a) {
	const c = a;
	a = b;
	b = c;
    }
    return a+(Math.random()*(b-a));
}

function rnd(a: number, b=0)
{
    return int(frnd(a, b));
}

// choice(a)
function choice<T>(a: [T])
{
    return a[rnd(a.length)];
}

// format: pretty print a number.
function format(v: number, n=3, c=' ')
{
    let s = '';
    while (s.length < n) {
	s = (v % 10)+s;
	v = int(v/10);
	if (v <= 0) break;
    }
    while (s.length < n) {
	s = c+s;
    }
    return s;
}

// removeElement(a, obj): remove an element from a.
function removeElement<T>(a: [T], obj: T)
{
    const i = a.indexOf(obj);
    if (0 <= i) {
	a.splice(i, 1);
    }
    return a;
}

// removeElements(a, f): remove elements from a.
function removeElements<T>(a: [T], f: (x:T)=>void)
{
    for (let i = a.length-1; 0 <= i; i--) {
	if (f(a[i])) {
	    a.splice(i, 1);
	}
    }
    return a;
}

// removeChildren(n, name): remove all child nodes with the given name.
function removeChildren(n: Node, name: string)
{
    name = name.toLowerCase();
    // Iterate backwards to simplify array removal. (thanks to @the31)
    for (let i = n.childNodes.length-1; 0 <= i; i--) {
	const c = n.childNodes[i];
	if (c.nodeName.toLowerCase() === name) {
	    n.removeChild(c);
	}
    }
}

// createCanvas(width, height): create a canvas with the given size.
function createCanvas(width: number, height: number): HTMLCanvasElement
{
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

// getEdgeyContext(canvas): returns a pixellated canvas 2D context.
function getEdgeyContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D
{
    const ctx = canvas.getContext('2d');
    (ctx as any).imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;
    return ctx;
}

// image2array(img): converts an image to 2D array.
function image2array(img: HTMLImageElement)
{
    interface ColorMap {
	[index:number]: number;
    }
    const header = 1;
    const width = img.width;
    const height = img.height;
    const canvas = createCanvas(width, height);
    const ctx = getEdgeyContext(canvas);
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;
    let i = 0;
    let c2v:ColorMap = {} as ColorMap;
    for (let y = 0; y < header; y++) {
	for (let x = 0; x < width; x++, i+=4) {
	    let c = ((data[i] << 16) | (data[i+1] << 8) | data[i+2]); // RGBA
	    if (!c2v.hasOwnProperty(c.toString())) {
		c2v[c] = y*width + x;
	    }
	}
    }
    const map = new Array(height-header);
    for (let y = 0; y < height-header; y++) {
	const a = new Array(width);
	for (let x = 0; x < width; x++, i+=4) {
	    let c = ((data[i] << 16) | (data[i+1] << 8) | data[i+2]); // RGBA
	    a[x] = c2v[c];
	}
	map[y] = a;
    }
    return map;
}

// drawImageScaled: draw a scaled image.
function drawImageScaled(
    ctx: CanvasRenderingContext2D,
    src: HTMLImageElement,
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number)
{
    ctx.save();
    ctx.translate(dx+((0 < dw)? 0 : -dw),
		  dy+((0 < dh)? 0 : -dh));
    ctx.scale((0 < dw)? 1 : -1,
	      (0 < dh)? 1 : -1);
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0,
		  Math.abs(dw), Math.abs(dh));
    ctx.restore();
}

// playSound(sound): play a sound resource.
function playSound(sound: HTMLAudioElement)
{
    sound.currentTime = 0;
    sound.play();
}

// getKeySym(keyCode): convert directional keys to symbol.
// cf. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
function getKeySym(keyCode: number): string
{
    switch (keyCode) {
    case 37:			// LEFT
    case 65:			// A
    case 72:			// H
    case 81:			// Q (AZERTY)
	return 'left';
    case 39:			// RIGHT
    case 68:			// D
    case 76:			// L
	return 'right';
    case 38:			// UP
    case 87:			// W
    case 75:			// K
	return 'up';
    case 40:			// DOWN
    case 83:			// S
    case 74:			// J
	return 'down';
    case 13:			// ENTER
    case 16:			// SHIFT
    case 32:			// SPACE
    case 90:			// Z
	return 'action';
    case 8:			// BACKSPACE
    case 27:			// ESCAPE
    case 88:			// X
	return 'cancel';
    default:
	return null;
    }
}


//  Slot: an event system
//
interface Action {
    (...params:any[]): any;
}
class Slot {

    object: any;
    receivers: [Action] = [] as [Action];
    
    constructor(object: any) {
	this.object = object;
    }
	
    toString() {
	return ('<Slot('+this.object+') '+this.receivers+'>');
    }
  
    subscribe(recv: Action) {
	this.receivers.push(recv);
    }
  
    unsubscribe(recv: Action) {
	removeElement(this.receivers, recv);
    }
  
    signal(...params: any[]) {
	for (let i = 0; i < this.receivers.length; i++) {
	    const args = Array.prototype.slice.call(arguments);
	    args.unshift(this.object);
	    this.receivers[i].apply(null, args);
	}
    }

}


//  Color
//
class Color {

    r: number;
    g: number;
    b: number;
    a: number;

    constructor(r: number, g: number, b: number, a=-1.0) {
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
    }
    
    toString() {
	if (0 <= this.a) {
	    return ('rgba('+
		    int(255*clamp(0,this.r,1))+','+
		    int(255*clamp(0,this.g,1))+','+
		    int(255*clamp(0,this.b,1))+','+
		    clamp(0,this.a,1)+')');
	} else {
	    return ('rgb('+
		    int(255*clamp(0,this.r,1))+','+
		    int(255*clamp(0,this.g,1))+','+
		    int(255*clamp(0,this.b,1))+')');
	}
    }

    setAlpha(a: number) {
	return new Color(this.r, this.g, this.b, a);
    }

}


//  ImageSource
//
class ImageSource {
    constructor() {
    }
}

class HTMLImageSource extends ImageSource {
    image: HTMLImageElement;
    bounds: Rect;
    offset: Vec2;
    
    constructor(image: HTMLImageElement, bounds: Rect, offset: Vec2=null) {
	super();
	this.image = image;
	this.bounds = bounds;
	this.offset = (offset !== null)? offset : new Vec2();
    }
}

class DummyImageSource extends ImageSource {
    color: string;
    
    constructor(color: string) {
	super();
	this.color = color;
    }
}


//  SpriteSheet
// 
class SpriteSheet {
    constructor() {
    }
    
    get(x:number, y=0) {
	return null as ImageSource;
    }
}

class ImageSpriteSheet extends SpriteSheet {
    image: HTMLImageElement;
    size: Vec2;
    offset: Vec2;

    constructor(image: HTMLImageElement, size: Vec2, offset: Vec2=null) {
	super();
	this.image = image;
	this.size = size;
	this.offset = offset;
    }

    get(x:number, y=0) {
	let rect = new Rect(x*this.size.x, y*this.size.y, this.size.x, this.size.y);
	return new HTMLImageSource(this.image, rect, this.offset);
    }
}

class DummySpriteSheet extends SpriteSheet {
    colors: [string];

    constructor(colors: [string]) {
	super();
	this.colors = colors;
    }

    get(x:number, y=0) {
	return new DummyImageSource(this.colors[x]);
    }
}
