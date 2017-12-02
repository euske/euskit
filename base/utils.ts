/** 
 * Utility functions.
 */

/** Alias of window.console.log() */
const log = window.console.log.bind(window.console);

/** Raises an exception if the condition is not met. */
function assert(x: boolean, msg="assertion error")
{
    if (!x) {
	throw new Error(msg);
    }
}

/** Creates a mixin class. */
function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
	Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
	    derivedCtor.prototype[name] = baseCtor.prototype[name];
	});
    });
}

/** Simulates the C fmod() function. */
function fmod(x: number, y: number): number
{
    let v = x % y;
    return (0 <= v)? v : v+y;
}

/** Alias of Math.floor */
const int = Math.floor;

/** Alias of Math.min */
const upperbound = Math.min;

/** Alias of Math.max */
const lowerbound = Math.max;

/** Limits the value so that v0 <= v <= v1.
 * @param v0 Minimum value.
 * @param v Number to limit.
 * @param v1 Maximum value.
 */
function clamp(v0: number, v: number, v1: number): number
{
    return Math.min(Math.max(v, v0), v1);
}

/** Returns -1, 0, or +1 depending on the sign. */
function sign(v: number): number
{
    if (v < 0) {
	return -1;
    } else if (0 < v) {
	return +1;
    } else {
	return 0;
    }
}

/** Returns the phase for t with the given interval.
 * @param t Current time.
 * @param interval Interval.
 * @param n Number of phrases.
 */
function phase(t: number, interval: number, n=2): number
{
    if (interval === 0) return 0;
    return int(n*t/interval) % n;
}

/** Generates a random number in [0,a) or [a,b). */
function frnd(a: number, b=0): number
{
    if (b < a) {
	let c = a;
	a = b;
	b = c;
    }
    return a+(Math.random()*(b-a));
}

/** Generates an integer random number in [0,a) or [a,b). */
function rnd(a: number, b=0): number
{
    return int(frnd(a, b));
}

/** Return the current time in seconds. */
function getTime(): number
{
    return Date.now()*0.001;
}

/** Returns a pretty printed string. 
 * @param v Number to format.
 * @param n Number of digits to fill.
 * @param c Filler character.
 */
function format(v: number, n=3, c=' '): string
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

/** Picks a random element. */
function choice<T>(a: T[]): T
{
    return a[rnd(a.length)];
}

/** Removes an element. */
function removeElement<T>(a: T[], obj: T): T[]
{
    let i = a.indexOf(obj);
    if (0 <= i) {
	a.splice(i, 1);
    }
    return a;
}

/** Returns an array filled with a sequence. */
function range(n: number): number[]
{
    let a = Array.apply(null, new Array(n));
    return a.map((_:any,i:number) => { return i });
}

/** Creates an array from a string.
 * @param s Source string.
 * @param f Conversion function.
 */
function str2array(s: string, f: (c:string)=>number=parseInt): Int32Array
{
    let a = new Int32Array(s.length);
    for (let i = 0; i < s.length; i++) {
	a[i] = f(s[i]);
    }
    return a;
}

/** Creates a 2D array for a given size.
 * @param rows Number of rows.
 * @param cols Number of columns.
 * @param value Initial value (default=0).
 */
function makeMatrix(rows: number, cols: number, value=0): Int32Array[] {
    return range(rows).map(() => {
	return new Int32Array(cols).fill(value);
    });
}

/** Removes all child DOM Nodes with the given name. 
 * @param node Parent DOM Node.
 * @param name Name of child Nodes to be removed.
 */
function removeChildren(node: Node, name: string)
{
    name = name.toLowerCase();
    // Iterate backwards to simplify array removal. (thanks to @the31)
    for (let i = node.childNodes.length-1; 0 <= i; i--) {
	let c = node.childNodes[i];
	if (c.nodeName.toLowerCase() === name) {
	    node.removeChild(c);
	}
    }
}

/** Creates a canvas with the given size.
 * @param width Width.
 * @param height Height.
 */
function createCanvas(width: number, height: number): HTMLCanvasElement
{
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/** Creates a pixellated canvas 2D context.
 * @param canvas Target Canvas object.
 */
function getEdgeyContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D
{
    let ctx = canvas.getContext('2d');
    (ctx as any).imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;
    return ctx;
}

/** Creates a 2D array from an image. */
function image2array(img: HTMLImageElement, header=0): Int32Array[]
{
    interface ColorMap {
	[index:number]: number;
    }
    let width = img.width;
    let height = img.height;
    let canvas = createCanvas(width, height);
    let ctx = getEdgeyContext(canvas);
    ctx.drawImage(img, 0, 0);
    let data = ctx.getImageData(0, 0, width, height).data;
    let i = 0;
    let c2v:ColorMap = null;
    if (0 < header) {
	c2v = {}
	for (let y = 0; y < header; y++) {
	    for (let x = 0; x < width; x++, i+=4) {
		let c = ((data[i] << 16) | (data[i+1] << 8) | data[i+2]); // RGBA
		if (!c2v.hasOwnProperty(c.toString())) {
		    c2v[c] = y*width + x;
		}
	    }
	}
    }
    let map = new Array(height-header);
    for (let y = 0; y < height-header; y++) {
	let a = new Int32Array(width);
	for (let x = 0; x < width; x++, i+=4) {
	    let c = ((data[i] << 16) | (data[i+1] << 8) | data[i+2]); // RGBA
	    a[x] = (c2v !== null)? c2v[c] : c;
	}
	map[y] = a;
    }
    return map;
}

/** Fill a rectangle.
 * @param ctx Context to draw.
 * @param rect Rectangle.
 */
function fillRect(
    ctx: CanvasRenderingContext2D,
    rect: Rect) {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

/** Draw a rectangle.
 * @param ctx Context to draw.
 * @param rect Rectangle.
 */
function strokeRect(
    ctx: CanvasRenderingContext2D,
    rect: Rect) {
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

/** Draw an ellipse.
 * @param ctx Context to draw.
 * @param cx Center X.
 * @param cy Center Y.
 * @param rx Radius X.
 * @param ry Radius Y.
 */
function ellipse(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, rx: number, ry: number) {
    ctx.save();
    ctx.translate(cx, cy);
    if (ry < rx) {
	ctx.scale(1, ry/rx);
    } else {
	ctx.scale(rx/ry, 1);
    }
    ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI*2);
    ctx.restore();
}

/** Draw a scaled image. 
 *  When the destination width/height is negative, 
 *  the image is flipped.
 * @param ctx Context to draw.
 * @param src Source image.
 * @param sx Source rectangle X.
 * @param sy Source rectangle Y.
 * @param sw Source rectangle width.
 * @param sh Source rectangle height.
 * @param dx Destination rectangle X.
 * @param dy Destination rectangle Y.
 * @param dw Destination rectangle width.
 * @param dh Destination rectangle height.
 */
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

/** Key Symbol */
enum KeySym {
    Unknown = 0,
    Left,
    Right,
    Up,
    Down,
    Action1,
    Action2,
    Cancel,
}

/** Returns the key symbol for the key.
 * cf. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
 */
function getKeySym(keyCode: number): KeySym
{
    switch (keyCode) {
    case 37:			// LEFT
    case 65:			// A
    case 72:			// H
    case 81:			// Q (AZERTY)
	return KeySym.Left;
    case 39:			// RIGHT
    case 68:			// D
    case 76:			// L
	return KeySym.Right;
    case 38:			// UP
    case 87:			// W
    case 75:			// K
    case 90:			// Z (AZERTY)
	return KeySym.Up;
    case 40:			// DOWN
    case 83:			// S
    case 74:			// J
	return KeySym.Down;
    case 16:			// SHIFT
    case 32:			// SPACE
    case 88:			// X
	return KeySym.Action1;
    case 13:			// ENTER
    case 69:			// E
    case 67:			// C
	return KeySym.Action2;
    case 8:			// BACKSPACE
    case 27:			// ESCAPE
	return KeySym.Cancel;
    default:
	return KeySym.Unknown;
    }
}


interface Action {
    (...params:any[]): void;
}

/** Subscribable event object.
 *  A Signal object can have multiple receivers.
 */
class Signal {

    /** Base arguments. */
    baseargs: any;
    /** List of receivers. */
    receivers: Action[] = [];

    /** Creates a new Signal.
     * @param params Base arguments.
     */
    constructor(...params: any[]) {
	this.baseargs = Array.prototype.slice.call(arguments);
    }
	
    toString() {
	return ('<Signal('+this.baseargs+') '+this.receivers+'>');
    }
  
    /** Adds a receiver function for the signal.
     * @param recv Receiver function to add.
     */
    subscribe(recv: Action) {
	this.receivers.push(recv);
    }
  
    /** Removes a receiver function for the signal.
     * @param recv Receiver function to remove.
     */
    unsubscribe(recv: Action) {
	removeElement(this.receivers, recv);
    }

    /** Notifies all the receivers with the given arguments.
     * @param params Extra arguments.
     */
    fire(...params: any[]) {
	for (let receiver of this.receivers) {
	    let args = Array.prototype.slice.call(arguments);
	    receiver.apply(null, this.baseargs.concat(args));
	}
    }
}


/** Convenience object for generating/mixing RGB values.
 */
class Color {

    /** Red. */
    r: number;
    /** Green. */
    g: number;
    /** Blue. */
    b: number;
    /** Alpha. */
    a: number;

    /** Generates a Color value. 
     * @param h Hue.
     * @param v Brightness.
     */
    static generate(h: number, v: number=1.0) {
	h *= 2*Math.PI;
	v *= 0.5;
	return new Color(
	    (Math.sin(h)+1)*v,
	    (Math.sin(h+2*Math.PI/3)+1)*v,
	    (Math.sin(h+4*Math.PI/3)+1)*v,
	    1.0);
    }

    /** Creates a new Color.
     * @param r Red.
     * @param g Green.
     * @param b Blue.
     * @param a Alpha.
     */
    constructor(r: number, g: number, b: number, a=1.0) {
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

    /** Changes the alpha value. */
    setAlpha(a: number): Color {
	return new Color(this.r, this.g, this.b, a);
    }

    /** Multiplies the brightness. */
    multiply(t: number): Color {
	return new Color(this.r*t, this.g*t, this.b*t, this.a);
    }

    /** Blends with another Color. 
     * @param color Color to bland.
     * @param t Blending ratio.
     */
    blend(color: Color, t: number): Color {
	return new Color(
	    this.r*(1-t) + color.r*t,
	    this.g*(1-t) + color.g*t,
	    this.b*(1-t) + color.b*t,
	    this.a*(1-t) + color.a*t);
    }
}
