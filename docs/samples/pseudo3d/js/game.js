"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Utility functions.
 */
/** Alias of window.console.log() */
var debug = window.console.debug.bind(window.console);
var info = window.console.info.bind(window.console);
var error = window.console.error.bind(window.console);
var assert = window.console.assert.bind(window.console);
/** Creates a mixin class. */
function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach(function (baseCtor) {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(function (name) {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
/** Simulates the C fmod() function. */
function fmod(x, y) {
    var v = x % y;
    return (0 <= v) ? v : v + y;
}
/** Alias of Math.floor */
var int = Math.floor;
/** Alias of Math.min */
var upperbound = Math.min;
/** Alias of Math.max */
var lowerbound = Math.max;
/** Limits the value so that v0 <= v <= v1.
 * @param v0 Minimum value.
 * @param v Number to limit.
 * @param v1 Maximum value.
 */
function clamp(v0, v, v1) {
    return Math.min(Math.max(v, v0), v1);
}
/** Returns -1, 0, or +1 depending on the sign. */
function sign(v) {
    if (v < 0) {
        return -1;
    }
    else if (0 < v) {
        return +1;
    }
    else {
        return 0;
    }
}
/** Returns the phase for t with the given interval.
 * @param t Current time.
 * @param interval Interval.
 * @param n Number of phrases.
 */
function phase(t, interval, n) {
    if (n === void 0) { n = 2; }
    if (interval === 0)
        return 0;
    return int(n * t / interval) % n;
}
/** Linear interpolation.
 * @param t Current time.
 * @param a Start value.
 * @param b End value.
 */
function lerp(t, a, b) {
    return a + t * (b - a);
}
/** Generates a random number in [0,a) or [a,b). */
function frnd(a, b) {
    if (b === void 0) { b = 0; }
    if (b < a) {
        var c = a;
        a = b;
        b = c;
    }
    return a + (Math.random() * (b - a));
}
/** Generates an integer random number in [0,a) or [a,b). */
function rnd(a, b) {
    if (b === void 0) { b = 0; }
    return int(frnd(a, b));
}
/** Return the current time in seconds. */
function getTime() {
    return Date.now() * 0.001;
}
/** Returns a pretty printed string.
 * @param v Number to format.
 * @param n Number of digits to fill.
 * @param c Filler character.
 */
function format(v, n, c) {
    if (n === void 0) { n = 3; }
    if (c === void 0) { c = ' '; }
    var s = '';
    while (s.length < n) {
        s = (v % 10) + s;
        v = int(v / 10);
        if (v <= 0)
            break;
    }
    while (s.length < n) {
        s = c + s;
    }
    return s;
}
/** Picks a random element. */
function choice(a) {
    return a[rnd(a.length)];
}
/** Removes an element. */
function removeElement(a, obj) {
    var i = a.indexOf(obj);
    if (0 <= i) {
        a.splice(i, 1);
    }
    return a;
}
/** Returns an array filled with a sequence. */
function range(n) {
    var a = Array.apply(null, new Array(n));
    return a.map(function (_, i) { return i; });
}
/** Creates an array from a string.
 * @param s Source string.
 * @param f Conversion function.
 */
function str2array(s, f) {
    if (f === void 0) { f = parseInt; }
    var a = new Int32Array(s.length);
    for (var i = 0; i < s.length; i++) {
        a[i] = f(s[i]);
    }
    return a;
}
/** Creates a 2D array for a given size.
 * @param rows Number of rows.
 * @param cols Number of columns.
 * @param value Initial value (default=0).
 */
function makeMatrix(rows, cols, value) {
    if (value === void 0) { value = 0; }
    return range(rows).map(function () {
        return new Int32Array(cols).fill(value);
    });
}
/** Removes all child DOM Nodes with the given name.
 * @param node Parent DOM Node.
 * @param name Name of child Nodes to be removed.
 */
function removeChildren(node, name) {
    name = name.toLowerCase();
    // Iterate backwards to simplify array removal. (thanks to @the31)
    for (var i = node.childNodes.length - 1; 0 <= i; i--) {
        var c = node.childNodes[i];
        if (c.nodeName.toLowerCase() === name) {
            node.removeChild(c);
        }
    }
}
/** Creates a canvas with the given size.
 * @param width Width.
 * @param height Height.
 */
function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
/** Creates a pixellated canvas 2D context.
 * @param canvas Target Canvas object.
 */
function getEdgeyContext(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    return ctx;
}
/** Creates a 2D array from an image. */
function image2array(img, header) {
    if (header === void 0) { header = 0; }
    var width = img.width;
    var height = img.height;
    var canvas = createCanvas(width, height);
    var ctx = getEdgeyContext(canvas);
    ctx.drawImage(img, 0, 0);
    var data = ctx.getImageData(0, 0, width, height).data;
    var i = 0;
    var c2v = null;
    if (0 < header) {
        c2v = {};
        for (var y = 0; y < header; y++) {
            for (var x = 0; x < width; x++, i += 4) {
                var c = ((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]); // RGBA
                if (!c2v.hasOwnProperty(c.toString())) {
                    c2v[c] = y * width + x;
                }
            }
        }
    }
    var map = new Array(height - header);
    for (var y = 0; y < height - header; y++) {
        var a = new Int32Array(width);
        for (var x = 0; x < width; x++, i += 4) {
            var c = ((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]); // RGBA
            a[x] = (c2v !== null) ? c2v[c] : c;
        }
        map[y] = a;
    }
    return map;
}
/** Fill a rectangle.
 * @param ctx Context to draw.
 * @param rect Rectangle.
 */
function fillRect(ctx, rect) {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}
/** Draw a rectangle.
 * @param ctx Context to draw.
 * @param rect Rectangle.
 */
function strokeRect(ctx, rect) {
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}
/** Draw an ellipse.
 * @param ctx Context to draw.
 * @param cx Center X.
 * @param cy Center Y.
 * @param rx Radius X.
 * @param ry Radius Y.
 */
function ellipse(ctx, cx, cy, rx, ry) {
    ctx.save();
    ctx.translate(cx, cy);
    if (ry < rx) {
        ctx.scale(1, ry / rx);
    }
    else {
        ctx.scale(rx / ry, 1);
    }
    ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
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
function drawImageScaled(ctx, src, sx, sy, sw, sh, dx, dy, dw, dh) {
    ctx.save();
    ctx.translate(dx + ((0 < dw) ? 0 : -dw), dy + ((0 < dh) ? 0 : -dh));
    ctx.scale((0 < dw) ? 1 : -1, (0 < dh) ? 1 : -1);
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, Math.abs(dw), Math.abs(dh));
    ctx.restore();
}
/** Key Symbol */
var KeySym;
(function (KeySym) {
    KeySym[KeySym["Unknown"] = 0] = "Unknown";
    KeySym[KeySym["Left"] = 1] = "Left";
    KeySym[KeySym["Right"] = 2] = "Right";
    KeySym[KeySym["Up"] = 3] = "Up";
    KeySym[KeySym["Down"] = 4] = "Down";
    KeySym[KeySym["Action1"] = 5] = "Action1";
    KeySym[KeySym["Action2"] = 6] = "Action2";
    KeySym[KeySym["Cancel"] = 7] = "Cancel";
})(KeySym || (KeySym = {}));
/** Returns the key symbol for the key.
 * cf. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
 */
function getKeySym(keyCode) {
    switch (keyCode) {
        case 37: // LEFT
        case 65: // A
        case 72: // H
        case 81: // Q (AZERTY)
            return KeySym.Left;
        case 39: // RIGHT
        case 68: // D
        case 76: // L
            return KeySym.Right;
        case 38: // UP
        case 87: // W
        case 75: // K
        case 90: // Z (AZERTY)
            return KeySym.Up;
        case 40: // DOWN
        case 83: // S
        case 74: // J
            return KeySym.Down;
        case 16: // SHIFT
        case 32: // SPACE
        case 88: // X
            return KeySym.Action1;
        case 13: // ENTER
        case 69: // E
        case 67: // C
            return KeySym.Action2;
        case 8: // BACKSPACE
        case 27: // ESCAPE
            return KeySym.Cancel;
        default:
            return KeySym.Unknown;
    }
}
/** Subscribable event object.
 *  A Signal object can have multiple receivers.
 */
var Signal = /** @class */ (function () {
    /** Creates a new Signal.
     * @param params Base arguments.
     */
    function Signal() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        /** List of receivers. */
        this.receivers = [];
        this.baseargs = Array.prototype.slice.call(arguments);
    }
    Signal.prototype.toString = function () {
        return ('<Signal(' + this.baseargs + ') ' + this.receivers + '>');
    };
    /** Adds a receiver function for the signal.
     * @param recv Receiver function to add.
     */
    Signal.prototype.subscribe = function (recv) {
        this.receivers.push(recv);
    };
    /** Removes a receiver function for the signal.
     * @param recv Receiver function to remove.
     */
    Signal.prototype.unsubscribe = function (recv) {
        removeElement(this.receivers, recv);
    };
    /** Notifies all the receivers with the given arguments.
     * @param params Extra arguments.
     */
    Signal.prototype.fire = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        for (var _a = 0, _b = this.receivers; _a < _b.length; _a++) {
            var receiver = _b[_a];
            var args = Array.prototype.slice.call(arguments);
            receiver.apply(null, this.baseargs.concat(args));
        }
    };
    return Signal;
}());
/** Convenience object for generating/mixing RGB values.
 */
var Color = /** @class */ (function () {
    /** Creates a new Color.
     * @param r Red.
     * @param g Green.
     * @param b Blue.
     * @param a Alpha.
     */
    function Color(r, g, b, a) {
        if (a === void 0) { a = 1.0; }
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    /** Generates a Color value.
     * @param h Hue.
     * @param v Brightness.
     */
    Color.generate = function (h, v) {
        if (v === void 0) { v = 1.0; }
        h *= 2 * Math.PI;
        v *= 0.5;
        return new Color((Math.sin(h) + 1) * v, (Math.sin(h + 2 * Math.PI / 3) + 1) * v, (Math.sin(h + 4 * Math.PI / 3) + 1) * v, 1.0);
    };
    Color.prototype.toString = function () {
        if (0 <= this.a) {
            return ('rgba(' +
                int(255 * clamp(0, this.r, 1)) + ',' +
                int(255 * clamp(0, this.g, 1)) + ',' +
                int(255 * clamp(0, this.b, 1)) + ',' +
                clamp(0, this.a, 1) + ')');
        }
        else {
            return ('rgb(' +
                int(255 * clamp(0, this.r, 1)) + ',' +
                int(255 * clamp(0, this.g, 1)) + ',' +
                int(255 * clamp(0, this.b, 1)) + ')');
        }
    };
    /** Changes the alpha value. */
    Color.prototype.setAlpha = function (a) {
        return new Color(this.r, this.g, this.b, a);
    };
    /** Multiplies the brightness. */
    Color.prototype.multiply = function (t) {
        return new Color(this.r * t, this.g * t, this.b * t, this.a);
    };
    /** Blends with another Color.
     * @param color Color to bland.
     * @param t Blending ratio.
     */
    Color.prototype.blend = function (color, t) {
        return new Color(this.r * (1 - t) + color.r * t, this.g * (1 - t) + color.g * t, this.b * (1 - t) + color.b * t, this.a * (1 - t) + color.a * t);
    };
    return Color;
}());
/** Simplified Perlin Noise function.
 */
var PERMS = [
    28, 25, 0, 12, 2, 33, 59, 26, 62, 7, 9, 39, 66, 10, 57, 1, 58,
    15, 56, 77, 70, 47, 96, 93, 53, 84, 80, 76, 67, 64, 30, 92, 88, 91,
    74, 51, 8, 86, 97, 82, 38, 65, 17, 18, 52, 81, 87, 21, 61, 34, 68, 35,
    71, 3, 16, 4, 27, 19, 13, 37, 41, 60, 83, 43, 31, 23, 14, 32, 48, 98,
    50, 99, 36, 5, 54, 20, 49, 45, 72, 29, 42, 75, 44, 89, 6, 46, 94, 78,
    90, 73, 95, 79, 85, 63, 55, 24, 69, 22, 40, 11
];
function perm(t) { return PERMS[t % PERMS.length]; }
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function grad(h, p, q) {
    return ((h & 1) == 0 ? p : -p) + ((h & 2) == 0 ? q : -q);
}
function noise2d(x, y) {
    var bx = Math.floor(x);
    var by = Math.floor(y);
    var dx = x - bx;
    var dy = y - by;
    var u = fade(dx);
    var v = fade(dy);
    var a = perm(bx);
    var b = perm(bx + 1);
    var s = lerp(v, lerp(u, grad(perm(a + by), dx, dy), grad(perm(b + by), dx - 1, dy)), lerp(u, grad(perm(a + by + 1), dx, dy - 1), grad(perm(b + by + 1), dx - 1, dy - 1)));
    return (s + 1) / 2.0;
}
/// <reference path="utils.ts" />
/**
 * Geometric objects and functions.
 */
/** Sufficiently small number that can be considered as zero. */
var EPSILON = 0.0001;
/**  Vec2
 *   2-element vector that can be used for a position or size.
 */
var Vec2 = /** @class */ (function () {
    function Vec2(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
    }
    Vec2.prototype.toString = function () {
        return '(' + this.x + ', ' + this.y + ')';
    };
    /** Returns a copy of the object. */
    Vec2.prototype.copy = function () {
        return new Vec2(this.x, this.y);
    };
    /** Returns true if p is equivalent to the object. */
    Vec2.prototype.equals = function (p) {
        return (this.x == p.x && this.y == p.y);
    };
    /** Returns true if p.x == 0 and p.y == 0. */
    Vec2.prototype.isZero = function () {
        return (this.x == 0 && this.y == 0);
    };
    /** Returns the squared length of the vector. */
    Vec2.prototype.len2 = function () {
        return (this.x * this.x + this.y * this.y);
    };
    /** Returns the length of the vector. */
    Vec2.prototype.len = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    /** Returns a new vector consisting of the sign of each element. */
    Vec2.prototype.sign = function () {
        return new Vec2(sign(this.x), sign(this.y));
    };
    /** Returns a new vector (this + v). */
    Vec2.prototype.add = function (v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    };
    /** Returns a new vector (this - v). */
    Vec2.prototype.sub = function (v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    };
    /** Returns a new scaled vector by n. */
    Vec2.prototype.scale = function (n) {
        return new Vec2(this.x * n, this.y * n);
    };
    /** Returns |this - p|. */
    Vec2.prototype.distance = function (p) {
        return this.sub(p).len();
    };
    /** Clamp the position within a given rectangle. */
    Vec2.prototype.clamp = function (bounds) {
        return new Vec2(clamp(-bounds.x, this.x, +bounds.x), clamp(-bounds.y, this.y, +bounds.y));
    };
    /** Returns a new point that is moved by (dx, dy). */
    Vec2.prototype.move = function (dx, dy) {
        return new Vec2(this.x + dx, this.y + dy);
    };
    /** Returns a new interpolated vector between this and p.
     * @param p The other point.
     * @param t Interpolation value.
     *          When t=0.0 the new vector would be the same as this.
     *          When t=1.0 the new vector would be the same as p.
     */
    Vec2.prototype.lerp = function (p, t) {
        return new Vec2(lerp(t, this.x, p.x), lerp(t, this.y, p.y));
    };
    /** Returns a new vector rotated clockwise by d radian. */
    Vec2.prototype.rotate = function (d) {
        var s = Math.sin(d);
        var c = Math.cos(d);
        return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
    };
    /** Returns a new vector rotated clockwise by d*90 degree. */
    Vec2.prototype.rot90 = function (d) {
        d = d % 4;
        d = (0 <= d) ? d : d + 4;
        switch (d) {
            case 1:
                return new Vec2(-this.y, this.x);
            case 2:
                return new Vec2(-this.x, -this.y);
            case 3:
                return new Vec2(this.y, -this.x);
            default:
                return this.copy();
        }
    };
    /** Create a new rectangle based on this point.
     * @param dw Width.
     * @param dh Height.
     */
    Vec2.prototype.inflate = function (dw, dh) {
        return this.expand(dw * 2, dh * 2);
    };
    /** Create a new rectangle based on this point.
     * @param dw Width.
     * @param dh Height.
     * @param anchor Anchor point.
     */
    Vec2.prototype.expand = function (dw, dh, anchor) {
        if (anchor === void 0) { anchor = 'c'; }
        return new Rect(this.x, this.y).expand(dw, dh, anchor);
    };
    return Vec2;
}());
/**  Vec3
 *   3-element vector that can be used for a position or size.
 */
var Vec3 = /** @class */ (function () {
    function Vec3(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vec3.prototype.toString = function () {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ')';
    };
    /** Returns a copy of the object. */
    Vec3.prototype.copy = function () {
        return new Vec3(this.x, this.y, this.z);
    };
    /** Returns true if p is equivalent to the object. */
    Vec3.prototype.equals = function (p) {
        return (this.x == p.x && this.y == p.y && this.z == p.z);
    };
    /** Returns true if p.x == 0, p.y == 0 and p.z == 0. */
    Vec3.prototype.isZero = function () {
        return (this.x == 0 && this.y == 0 && this.z == 0);
    };
    /** Returns the squared length of the vector. */
    Vec3.prototype.len2 = function () {
        return (this.x * this.x + this.y * this.y + this.z * this.z);
    };
    /** Returns the length of the vector. */
    Vec3.prototype.len = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };
    /** Returns a new vector consisting of the sign of each element. */
    Vec3.prototype.sign = function () {
        return new Vec3(sign(this.x), sign(this.y), sign(this.z));
    };
    /** Returns a new vector (this + v). */
    Vec3.prototype.add = function (v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    };
    /** Returns a new vector (this - v). */
    Vec3.prototype.sub = function (v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    };
    /** Returns a new scaled vector by n. */
    Vec3.prototype.scale = function (n) {
        return new Vec3(this.x * n, this.y * n, this.z * n);
    };
    /** Returns |this - p|. */
    Vec3.prototype.distance = function (p) {
        return this.sub(p).len();
    };
    /** Clamp the position within a given rectangle. */
    Vec3.prototype.clamp = function (bounds) {
        return new Vec3(clamp(-bounds.x, this.x, +bounds.x), clamp(-bounds.y, this.y, +bounds.y), clamp(-bounds.z, this.z, +bounds.z));
    };
    /** Returns a new point that is moved by (dx, dy, dz). */
    Vec3.prototype.move = function (dx, dy, dz) {
        return new Vec3(this.x + dx, this.y + dy, this.z + dz);
    };
    /** Returns a new interpolated vector between this and p.
     * @param p The other point.
     * @param t Interpolation value.
     *          When t=0.0 the new vector would be the same as this.
     *          When t=1.0 the new vector would be the same as p.
     */
    Vec3.prototype.lerp = function (p, t) {
        return new Vec3(lerp(t, this.x, p.x), lerp(t, this.y, p.y), lerp(t, this.z, p.z));
    };
    return Vec3;
}());
/**  AALine
 *   Axis-aligned line
 */
var AALine = /** @class */ (function () {
    function AALine(x0, y0, x1, y1) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
    }
    /** Returns a copy of the object. */
    AALine.prototype.copy = function () {
        return new AALine(this.x0, this.y0, this.x1, this.y1);
    };
    /** Returns true if line is equivalent to the object. */
    AALine.prototype.equals = function (line) {
        return (this.x0 == line.x0 && this.y0 == line.y0 &&
            this.x1 == line.x1 && this.y1 == line.y1);
    };
    /** Returns a new AALine that is moved by (dx, dy). */
    AALine.prototype.move = function (dx, dy) {
        return new AALine(this.x0 + dx, this.y0 + dy, this.x1 + dx, this.y1 + dy);
    };
    /** Returns a new AALine that is moved by v. */
    AALine.prototype.add = function (v) {
        return new AALine(this.x0 + v.x, this.y0 + v.y, this.x1 + v.x, this.y1 + v.y);
    };
    /** Returns a new AALine that is moved by -v. */
    AALine.prototype.sub = function (v) {
        return new AALine(this.x0 - v.x, this.y0 - v.y, this.x1 - v.x, this.y1 - v.y);
    };
    /** Returns true if the given object is overlapping with this line. */
    AALine.prototype.overlaps = function (collider) {
        if (collider instanceof Rect) {
            return this.overlapsRect(collider);
        }
        else if (collider instanceof Circle) {
            return this.overlapsCircle(collider);
        }
        else {
            return false;
        }
    };
    /** Returns true if the rect is overlapping with this line. */
    AALine.prototype.overlapsRect = function (rect) {
        return !(this.x1 < rect.x || this.y1 < rect.y ||
            rect.x1() < this.x0 || rect.y1() < this.y0);
    };
    /** Returns true if the circle is overlapping with this line. */
    AALine.prototype.overlapsCircle = function (circle) {
        if (this.x1 <= circle.center.x - circle.radius ||
            this.y1 <= circle.center.y - circle.radius ||
            circle.center.x + circle.radius <= this.x0 ||
            circle.center.y + circle.radius <= this.y0) {
            return false;
        }
        return (this.x0 < circle.center.x && circle.center.x < this.x1 ||
            this.y0 < circle.center.y && circle.center.y < this.y1 ||
            circle.containsPt(new Vec2(this.x0, this.y0)) ||
            circle.containsPt(new Vec2(this.x1, this.y1)));
    };
    /** Trims a vector so that the given object does not collide with this line. */
    AALine.prototype.contact = function (v, collider) {
        if (collider instanceof Rect) {
            return this.contactRect(v, collider);
        }
        else if (collider instanceof Circle) {
            return this.contactCircle(v, collider);
        }
        else {
            return v;
        }
    };
    /** Trims a vector so that the rect does not collide with this line. */
    AALine.prototype.contactRect = function (v, rect) {
        if (this.y0 == this.y1) {
            return this.contactRectH(v, rect, this.y0);
        }
        else if (this.x0 == this.x1) {
            return this.contactRectV(v, rect, this.x0);
        }
        else {
            return v;
        }
    };
    /** Calculate a contact point when this line is horizontal. */
    AALine.prototype.contactRectH = function (v, rect, y) {
        var y0 = rect.y;
        var y1 = y0 + rect.height;
        var dy;
        if (y <= y0 && y0 + v.y < y) {
            dy = y - y0;
        }
        else if (y1 <= y && y < y1 + v.y) {
            dy = y - y1;
        }
        else {
            return v;
        }
        var dx = v.x * dy / v.y;
        var x0 = rect.x + dx;
        var x1 = x0 + rect.width;
        if (x1 < this.x0 || this.x1 < x0 ||
            (x1 == this.x0 && v.x <= 0) ||
            (x0 == this.x1 && 0 <= v.x)) {
            return v;
        }
        return new Vec2(dx, dy);
    };
    /** Calculate a contact point when this line is vertical. */
    AALine.prototype.contactRectV = function (v, rect, x) {
        var x0 = rect.x;
        var x1 = x0 + rect.width;
        var dx;
        if (x <= x0 && x0 + v.x < x) {
            dx = x - x0;
        }
        else if (x1 <= x && x < x1 + v.x) {
            dx = x - x1;
        }
        else {
            return v;
        }
        var dy = v.y * dx / v.x;
        var y0 = rect.y + dy;
        var y1 = y0 + rect.height;
        if (y1 < this.y0 || this.y1 < y0 ||
            (y1 == this.y0 && v.y <= 0) ||
            (y0 == this.y1 && 0 <= v.y)) {
            return v;
        }
        return new Vec2(dx, dy);
    };
    /** Trims a vector so that the circle does not collide with this line. */
    AALine.prototype.contactCircle = function (v, circle) {
        if (this.y0 == this.y1) {
            return this.contactCircleH(v, circle, this.y0);
        }
        else if (this.x0 == this.x1) {
            return this.contactCircleV(v, circle, this.x0);
        }
        else {
            return v;
        }
    };
    /** Calculate a contact point when this line is horizontal. */
    AALine.prototype.contactCircleH = function (v, circle, y) {
        var x = circle.center.x + v.x;
        if (this.x0 < x && x < this.x1) {
            y += (v.y < 0) ? circle.radius : -circle.radius;
            var dy = y - circle.center.y;
            var dt = dy / v.y;
            if (0 <= dt && dt <= 1) {
                return new Vec2(v.x * dt, dy);
            }
        }
        return v;
    };
    /** Calculate a contact point when this line is vertical. */
    AALine.prototype.contactCircleV = function (v, circle, x) {
        var y = circle.center.y + v.y;
        if (this.y0 < y && y < this.y1) {
            x += (v.x < 0) ? circle.radius : -circle.radius;
            var dx = x - circle.center.x;
            var dt = dx / v.x;
            if (0 <= dt && dt <= 1) {
                return new Vec2(dx, v.y * dt);
            }
        }
        return v;
    };
    /** Returns the boundary box of this line. */
    AALine.prototype.getAABB = function () {
        return new Rect(this.x0, this.y0, this.x1 - this.x0, this.y1 - this.y0);
    };
    /** Returns a random point on the line. */
    AALine.prototype.rndPt = function () {
        return new Vec2(rnd(this.x0, this.x1), rnd(this.y0, this.y1));
    };
    return AALine;
}());
/**  Rect
 *   Rectangle.
 */
var Rect = /** @class */ (function () {
    function Rect(x, y, width, height) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (width === void 0) { width = 0; }
        if (height === void 0) { height = 0; }
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    Rect.prototype.toString = function () {
        return '(' + this.x + ', ' + this.y + ', ' + this.width + ', ' + this.height + ')';
    };
    /** Returns a copy of the object. */
    Rect.prototype.copy = function () {
        return new Rect(this.x, this.y, this.width, this.height);
    };
    /** Returns true if rect is equivalent to the object. */
    Rect.prototype.equals = function (rect) {
        return (this.x == rect.x && this.y == rect.y &&
            this.width == rect.width && this.height == rect.height);
    };
    /** Returns true if rect has zero or negative size. */
    Rect.prototype.isZero = function () {
        return (this.width <= 0 && this.height <= 0);
    };
    /** Returns the x-coords of the right edge of the rectangle. */
    Rect.prototype.x1 = function () {
        return this.x + this.width;
    };
    /** Returns the y-coords of the bottom edge of the rectangle. */
    Rect.prototype.y1 = function () {
        return this.y + this.height;
    };
    /** Returns the x-coords of the center. */
    Rect.prototype.cx = function () {
        return this.x + this.width / 2;
    };
    /** Returns the y-coords of the center. */
    Rect.prototype.cy = function () {
        return this.y + this.height / 2;
    };
    /** Returns the center of the rectangle. */
    Rect.prototype.center = function () {
        return new Vec2(this.x + this.width / 2, this.y + this.height / 2);
    };
    /** Returns the top left corner of the rectangle. */
    Rect.prototype.topLeft = function () {
        return new Vec2(this.x, this.y);
    };
    /** Returns the top right corner of the rectangle. */
    Rect.prototype.topRight = function () {
        return new Vec2(this.x + this.width, this.y);
    };
    /** Returns the bottom left corner of the rectangle. */
    Rect.prototype.bottomLeft = function () {
        return new Vec2(this.x, this.y + this.height);
    };
    /** Returns the bottom right corner of the rectangle. */
    Rect.prototype.bottomRight = function () {
        return new Vec2(this.x + this.width, this.y + this.height);
    };
    /** Returns an anchor point of the rectangle. */
    Rect.prototype.anchor = function (anchor) {
        switch (anchor) {
            case 'nw':
                return new Vec2(this.x, this.y);
            case 'ne':
                return new Vec2(this.x + this.width, this.y);
            case 'sw':
                return new Vec2(this.x, this.y + this.height);
            case 'se':
                return new Vec2(this.x + this.width, this.y + this.height);
            case 'n':
                return new Vec2(this.x + this.width / 2, this.y);
            case 's':
                return new Vec2(this.x + this.width / 2, this.y + this.height);
            case 'e':
                return new Vec2(this.x, this.y + this.height / 2);
            case 'w':
                return new Vec2(this.x + this.width, this.y + this.height / 2);
            default:
                return new Vec2(this.x + this.width / 2, this.y + this.height / 2);
        }
    };
    /** Returns an edge of the rectangle. */
    Rect.prototype.edge = function (direction) {
        switch (direction) {
            case 'w':
                return new AALine(this.x, this.y, this.x, this.y + this.height);
            case 'e':
                return new AALine(this.x + this.width, this.y, this.x + this.width, this.y + this.height);
            case 'n':
                return new AALine(this.x, this.y, this.x + this.width, this.y);
            case 's':
                return new AALine(this.x, this.y + this.height, this.x + this.width, this.y + this.height);
            default:
                return null;
        }
    };
    Rect.prototype.move = function (dx, dy) {
        return new Rect(this.x + dx, this.y + dy, this.width, this.height);
    };
    Rect.prototype.add = function (v) {
        return new Rect(this.x + v.x, this.y + v.y, this.width, this.height);
    };
    Rect.prototype.sub = function (v) {
        return new Rect(this.x - v.x, this.y - v.y, this.width, this.height);
    };
    Rect.prototype.inflate = function (dw, dh) {
        return this.expand(dw * 2, dh * 2);
    };
    Rect.prototype.scale = function (n, anchor) {
        if (anchor === void 0) { anchor = 'c'; }
        return this.expand(this.width * (n - 1), this.height * (n - 1), anchor);
    };
    Rect.prototype.expand = function (dw, dh, anchor) {
        if (anchor === void 0) { anchor = 'c'; }
        switch (anchor) {
            case 'nw':
                return new Rect(this.x, this.y, this.width + dw, this.height + dh);
            case 'ne':
                return new Rect(this.x - dw, this.y, this.width + dw, this.height + dh);
            case 'sw':
                return new Rect(this.x, this.y - dh, this.width + dw, this.height + dh);
            case 'se':
                return new Rect(this.x - dw, this.y - dh, this.width + dw, this.height + dh);
            case 'n':
                return new Rect(this.x - dw / 2, this.y, this.width + dw, this.height + dh);
            case 's':
                return new Rect(this.x - dw / 2, this.y - dh, this.width + dw, this.height + dh);
            case 'e':
                return new Rect(this.x - dw, this.y - dh / 2, this.width + dw, this.height + dh);
            case 'w':
                return new Rect(this.x, this.y - dh / 2, this.width + dw, this.height + dh);
            default:
                return new Rect(this.x - dw / 2, this.y - dh / 2, this.width + dw, this.height + dh);
        }
    };
    Rect.prototype.resize = function (w, h, anchor) {
        if (anchor === void 0) { anchor = 'c'; }
        switch (anchor) {
            case 'nw':
                return new Rect(this.x, this.y, w, h);
            case 'ne':
                return new Rect(this.x + this.width - w, this.y, w, h);
            case 'sw':
                return new Rect(this.x, this.y + this.height - h, w, h);
            case 'se':
                return new Rect(this.x + this.width - w, this.y + this.height - h, w, h);
            case 'n':
                return new Rect(this.x + (this.width - w) / 2, this.y, w, h);
            case 's':
                return new Rect(this.x + (this.width - w) / 2, this.y + this.height - h, w, h);
            case 'e':
                return new Rect(this.x, this.y + (this.height - h) / 2, w, h);
            case 'w':
                return new Rect(this.x + this.width - w, this.y + (this.height - h) / 2, w, h);
            default:
                return new Rect(this.x + (this.width - w) / 2, this.y + (this.height - h) / 2, w, h);
        }
    };
    Rect.prototype.xdistance = function (rect) {
        return Math.max(rect.x - (this.x + this.width), this.x - (rect.x + rect.width));
    };
    Rect.prototype.ydistance = function (rect) {
        return Math.max(rect.y - (this.y + this.height), this.y - (rect.y + rect.height));
    };
    Rect.prototype.containsPt = function (p) {
        return (this.x <= p.x && this.y <= p.y &&
            p.x < this.x + this.width && p.y < this.y + this.height);
    };
    Rect.prototype.containsRect = function (rect) {
        return (this.x <= rect.x &&
            this.y <= rect.y &&
            rect.x + rect.width <= this.x + this.width &&
            rect.y + rect.height <= this.y + this.height);
    };
    Rect.prototype.overlapsRect = function (rect) {
        return (rect.x < this.x + this.width &&
            rect.y < this.y + this.height &&
            this.x < rect.x + rect.width &&
            this.y < rect.y + rect.height);
    };
    Rect.prototype.overlapsCircle = function (circle) {
        var x0 = this.x;
        var x1 = this.x1();
        var y0 = this.y;
        var y1 = this.y1();
        var cx = circle.center.x;
        var cy = circle.center.y;
        var r = circle.radius;
        return (circle.containsPt(new Vec2(x0, y0)) ||
            circle.containsPt(new Vec2(x1, y0)) ||
            circle.containsPt(new Vec2(x0, y1)) ||
            circle.containsPt(new Vec2(x1, y1)) ||
            ((x0 < cx && cx < x1) &&
                (Math.abs(y0 - cy) < r ||
                    Math.abs(y1 - cy) < r)) ||
            ((y0 < cy && cy < y1) &&
                (Math.abs(x0 - cx) < r ||
                    Math.abs(x1 - cx) < r)));
    };
    Rect.prototype.union = function (rect) {
        var x0 = Math.min(this.x, rect.x);
        var y0 = Math.min(this.y, rect.y);
        var x1 = Math.max(this.x + this.width, rect.x + rect.width);
        var y1 = Math.max(this.y + this.height, rect.y + rect.height);
        return new Rect(x0, y0, x1 - x0, y1 - y0);
    };
    Rect.prototype.intersection = function (rect) {
        var x0 = Math.max(this.x, rect.x);
        var y0 = Math.max(this.y, rect.y);
        var x1 = Math.min(this.x + this.width, rect.x + rect.width);
        var y1 = Math.min(this.y + this.height, rect.y + rect.height);
        return new Rect(x0, y0, x1 - x0, y1 - y0);
    };
    Rect.prototype.clamp = function (bounds) {
        var x = ((bounds.width < this.width) ? bounds.cx() :
            clamp(bounds.x, this.x, bounds.x + bounds.width - this.width));
        var y = ((bounds.height < this.height) ? bounds.cy() :
            clamp(bounds.y, this.y, bounds.y + bounds.height - this.height));
        return new Rect(x, y, this.width, this.height);
    };
    Rect.prototype.edgePt = function (t) {
        t = fmod(t, this.width * 2 + this.height * 2);
        if (t < this.width) {
            return new Vec2(this.x + t, this.y);
        }
        t -= this.width;
        if (t < this.height) {
            return new Vec2(this.x + this.width, this.y + t);
        }
        t -= this.height;
        if (t < this.width) {
            return new Vec2(this.x + this.width - t, this.y + this.height);
        }
        // assert(t <= this.height);
        return new Vec2(this.x, this.y + this.height - t);
    };
    Rect.prototype.rndPt = function () {
        return new Vec2(this.x + frnd(this.width), this.y + frnd(this.height));
    };
    Rect.prototype.rndPtEdge = function () {
        var t = frnd(this.width * 2 + this.height * 2);
        return this.edgePt(t);
    };
    Rect.prototype.modPt = function (p) {
        return new Vec2(this.x + fmod(p.x - this.x, this.width), this.y + fmod(p.y - this.y, this.height));
    };
    Rect.prototype.contactRect = function (v, rect) {
        if (this.overlapsRect(rect)) {
            return new Vec2();
        }
        if (0 < v.x) {
            v = this.edge('w').contactRect(v, rect);
        }
        else if (v.x < 0) {
            v = this.edge('e').contactRect(v, rect);
        }
        if (0 < v.y) {
            v = this.edge('n').contactRect(v, rect);
        }
        else if (v.y < 0) {
            v = this.edge('s').contactRect(v, rect);
        }
        return v;
    };
    Rect.prototype.contactCircle = function (v, circle) {
        if (this.overlapsCircle(circle)) {
            return new Vec2();
        }
        if (0 < v.x) {
            v = this.edge('w').contactCircle(v, circle);
        }
        else if (v.x < 0) {
            v = this.edge('e').contactCircle(v, circle);
        }
        if (0 < v.y) {
            v = this.edge('n').contactCircle(v, circle);
        }
        else if (v.y < 0) {
            v = this.edge('s').contactCircle(v, circle);
        }
        if (circle.center.x < this.x || circle.center.y < this.y) {
            v = circle.contactCircle(v, new Circle(new Vec2(this.x, this.y)));
        }
        if (this.x1() < circle.center.x || circle.center.y < this.y) {
            v = circle.contactCircle(v, new Circle(new Vec2(this.x1(), this.y)));
        }
        if (circle.center.x < this.x || this.y1() < circle.center.y) {
            v = circle.contactCircle(v, new Circle(new Vec2(this.x, this.y1())));
        }
        if (this.x1() < circle.center.x || this.y1() < circle.center.y) {
            v = circle.contactCircle(v, new Circle(new Vec2(this.x1(), this.y1())));
        }
        return v;
    };
    Rect.prototype.boundRect = function (v, rect) {
        if (!this.overlapsRect(rect)) {
            return new Vec2();
        }
        var x = (v.x < 0) ? this.x : this.x + this.width;
        v = new AALine(x, -Infinity, x, +Infinity).contactRect(v, rect);
        var y = (v.y < 0) ? this.y : this.y + this.height;
        v = new AALine(-Infinity, y, +Infinity, y).contactRect(v, rect);
        return v;
    };
    Rect.prototype.overlaps = function (collider) {
        if (collider instanceof Rect) {
            return this.overlapsRect(collider);
        }
        else if (collider instanceof Circle) {
            return this.overlapsCircle(collider);
        }
        else {
            return false;
        }
    };
    Rect.prototype.contact = function (v, collider) {
        if (collider instanceof Rect) {
            return this.contactRect(v, collider);
        }
        else if (collider instanceof Circle) {
            return this.contactCircle(v, collider);
        }
        else {
            return v;
        }
    };
    Rect.prototype.getAABB = function () {
        return this;
    };
    return Rect;
}());
/**  Circle
 */
var Circle = /** @class */ (function () {
    function Circle(center, radius) {
        if (radius === void 0) { radius = 0; }
        this.center = center;
        this.radius = radius;
    }
    Circle.prototype.toString = function () {
        return 'Circle(center=' + this.center + ', radius=' + this.radius + ')';
    };
    Circle.prototype.copy = function () {
        return new Circle(this.center.copy(), this.radius);
    };
    Circle.prototype.equals = function (circle) {
        return (this.center.equals(circle.center) &&
            this.radius == circle.radius);
    };
    Circle.prototype.isZero = function () {
        return this.radius == 0;
    };
    Circle.prototype.move = function (dx, dy) {
        return new Circle(this.center.move(dx, dy), this.radius);
    };
    Circle.prototype.add = function (v) {
        return new Circle(this.center.add(v), this.radius);
    };
    Circle.prototype.sub = function (v) {
        return new Circle(this.center.sub(v), this.radius);
    };
    Circle.prototype.inflate = function (dr) {
        return new Circle(this.center, this.radius + dr);
    };
    Circle.prototype.resize = function (radius) {
        return new Circle(this.center, radius);
    };
    Circle.prototype.distance = function (p) {
        return this.center.sub(p).len();
    };
    Circle.prototype.containsPt = function (p) {
        return this.distance(p) < this.radius;
    };
    Circle.prototype.containsCircle = function (circle) {
        var d = this.distance(circle.center);
        return d + circle.radius < this.radius;
    };
    Circle.prototype.overlapsCircle = function (circle) {
        var d = this.distance(circle.center);
        return d < this.radius + circle.radius;
    };
    Circle.prototype.overlapsRect = function (rect) {
        return rect.overlapsCircle(this);
    };
    Circle.prototype.clamp = function (bounds) {
        var x = ((bounds.width < this.radius) ? bounds.cx() :
            clamp(bounds.x, this.center.x, bounds.x + bounds.width - this.radius));
        var y = ((bounds.height < this.radius) ? bounds.cy() :
            clamp(bounds.y, this.center.y, bounds.y + bounds.height - this.radius));
        return new Circle(new Vec2(x, y), this.radius);
    };
    Circle.prototype.edgePt = function (t) {
        return new Vec2(this.center.x + this.radius * Math.cos(t), this.center.y + this.radius * Math.sin(t));
    };
    Circle.prototype.rndPt = function () {
        var r = frnd(this.radius);
        var t = frnd(Math.PI * 2);
        return new Vec2(this.center.x + r * Math.cos(t), this.center.y + r * Math.sin(t));
    };
    Circle.prototype.rndPtEdge = function () {
        var t = frnd(Math.PI * 2);
        return this.edgePt(t);
    };
    Circle.prototype.contactCircle = function (v, circle) {
        if (this.overlapsCircle(circle)) {
            return new Vec2();
        }
        var d = circle.center.sub(this.center);
        var dv = d.x * v.x + d.y * v.y;
        var v2 = v.len2();
        var d2 = d.len2();
        var R = (this.radius + circle.radius);
        // |d - t*v|^2 = (r1+r2)^2
        // t = { (d*v) + sqrt((d*v)^2 - v^2(d^2-R^2)) } / v^2
        var s = dv * dv - v2 * (d2 - R * R);
        if (0 < s) {
            var t = (dv - Math.sqrt(s)) / v2;
            if (t < -EPSILON) {
                ;
            }
            else if (t < EPSILON) {
                v = new Vec2();
            }
            else if (t < 1 + EPSILON) {
                v = v.scale(t / (1 + EPSILON));
            }
        }
        return v;
    };
    Circle.prototype.overlaps = function (collider) {
        if (collider instanceof Circle) {
            return this.overlapsCircle(collider);
        }
        else if (collider instanceof Rect) {
            return this.overlapsRect(collider);
        }
        else {
            return false;
        }
    };
    Circle.prototype.contact = function (v, collider) {
        if (collider instanceof Circle) {
            return this.contactCircle(v, collider);
        }
        else if (collider instanceof Rect) {
            return collider.contactCircle(v.scale(-1), this).scale(-1);
        }
        else {
            return v;
        }
    };
    Circle.prototype.getAABB = function () {
        return new Rect(this.center.x - this.radius, this.center.y - this.radius, this.radius * 2, this.radius * 2);
    };
    return Circle;
}());
//  AAPlane
//  Axis-aligned plane
//
var AAPlane = /** @class */ (function () {
    function AAPlane(p0, p1) {
        this.p0 = p0;
        this.p1 = p1;
    }
    AAPlane.prototype.contactBox = function (v, box) {
        if (this.p0.x == this.p1.x) {
            return this.contactBoxYZ(v, box, this.p0.x);
        }
        else if (this.p0.y == this.p1.y) {
            return this.contactBoxZX(v, box, this.p0.y);
        }
        else if (this.p0.z == this.p1.z) {
            return this.contactBoxXY(v, box, this.p0.z);
        }
        else {
            return v;
        }
    };
    AAPlane.prototype.contactBoxYZ = function (v, box, x) {
        var x0 = box.origin.x;
        var x1 = x0 + box.size.x;
        var dx;
        if (x <= x0 && x0 + v.x < x) {
            dx = x - x0;
        }
        else if (x1 <= x && x < x1 + v.x) {
            dx = x - x1;
        }
        else {
            return v;
        }
        var dy = v.y * dx / v.x;
        var dz = v.z * dx / v.x;
        var y0 = box.origin.y + dy;
        var y1 = y0 + box.size.y;
        var z0 = box.origin.z + dz;
        var z1 = z0 + box.size.z;
        if (y1 < this.p0.y || this.p1.y < y0 ||
            z1 < this.p0.z || this.p1.z < z0 ||
            (y1 == this.p0.y && v.y <= 0) || (this.p1.y == y0 && 0 <= v.y) ||
            (z1 == this.p0.z && v.z <= 0) || (this.p1.z == z0 && 0 <= v.z)) {
            return v;
        }
        return new Vec3(dx, dy, dz);
    };
    AAPlane.prototype.contactBoxZX = function (v, box, y) {
        var y0 = box.origin.y;
        var y1 = y0 + box.size.y;
        var dy;
        if (y <= y0 && y0 + v.y < y) {
            dy = y - y0;
        }
        else if (y1 <= y && y < y1 + v.y) {
            dy = y - y1;
        }
        else {
            return v;
        }
        var dz = v.z * dy / v.y;
        var dx = v.x * dy / v.y;
        var z0 = box.origin.z + dx;
        var z1 = z0 + box.size.z;
        var x0 = box.origin.x + dy;
        var x1 = x0 + box.size.x;
        if (z1 < this.p0.z || this.p1.z < z0 ||
            x1 < this.p0.x || this.p1.x < x0 ||
            (z1 == this.p0.z && v.z <= 0) || (z0 == this.p1.z && 0 <= v.z) ||
            (x1 == this.p0.x && v.x <= 0) || (x0 == this.p1.x && 0 <= v.x)) {
            return v;
        }
        return new Vec3(dx, dy, dz);
    };
    AAPlane.prototype.contactBoxXY = function (v, box, z) {
        var z0 = box.origin.z;
        var z1 = z0 + box.size.z;
        var dz;
        if (z <= z0 && z0 + v.z < z) {
            dz = z - z0;
        }
        else if (z1 <= z && z < z1 + v.z) {
            dz = z - z1;
        }
        else {
            return v;
        }
        var dx = v.x * dz / v.z;
        var dy = v.y * dz / v.z;
        var x0 = box.origin.x + dx;
        var x1 = x0 + box.size.x;
        var y0 = box.origin.y + dy;
        var y1 = y0 + box.size.y;
        if (x1 < this.p0.x || this.p1.x < x0 ||
            y1 < this.p0.y || this.p1.y < y0 ||
            (x1 == this.p0.x && v.x <= 0) || (x0 == this.p1.x && 0 <= v.x) ||
            (y1 == this.p0.y && v.y <= 0) || (y0 == this.p1.y && 0 <= v.y)) {
            return v;
        }
        return new Vec3(dx, dy, dz);
    };
    return AAPlane;
}());
//  Box
//
var Box = /** @class */ (function () {
    function Box(origin, size) {
        if (size === void 0) { size = null; }
        this.origin = origin;
        this.size = (size !== null) ? size : new Vec3();
    }
    Box.prototype.toString = function () {
        return '(' + this.origin + ', ' + this.size + ')';
    };
    Box.prototype.copy = function () {
        return new Box(this.origin.copy(), this.size.copy());
    };
    Box.prototype.equals = function (box) {
        return (this.origin.equals(box.origin) &&
            this.size.equals(box.size));
    };
    Box.prototype.isZero = function () {
        return this.size.isZero();
    };
    Box.prototype.center = function () {
        return new Vec3(this.origin.x + this.size.x / 2, this.origin.y + this.size.y / 2, this.origin.z + this.size.z / 2);
    };
    Box.prototype.surface = function (vx, vy, vz) {
        if (vx < 0) {
            return new AAPlane(this.origin, this.origin.move(0, this.size.y, this.size.z));
        }
        else if (0 < vx) {
            return new AAPlane(this.origin.move(this.size.x, 0, 0), this.origin.add(this.size));
        }
        else if (vy < 0) {
            return new AAPlane(this.origin, this.origin.move(this.size.x, 0, this.size.z));
        }
        else if (0 < vy) {
            return new AAPlane(this.origin.move(0, this.size.y, 0), this.origin.add(this.size));
        }
        else if (vz < 0) {
            return new AAPlane(this.origin, this.origin.move(this.size.x, this.size.y, 0));
        }
        else if (0 < vz) {
            return new AAPlane(this.origin.move(0, 0, this.size.z), this.origin.add(this.size));
        }
        else {
            return null;
        }
    };
    Box.prototype.anchor = function (vx, vy, vz) {
        if (vx === void 0) { vx = 0; }
        if (vy === void 0) { vy = 0; }
        if (vz === void 0) { vz = 0; }
        var x, y, z;
        if (vx < 0) {
            x = this.origin.x;
        }
        else if (0 < vx) {
            x = this.origin.x + this.size.x;
        }
        else {
            x = this.origin.x + this.size.x / 2;
        }
        if (vy < 0) {
            y = this.origin.y;
        }
        else if (0 < vy) {
            y = this.origin.y + this.size.y;
        }
        else {
            y = this.origin.y + this.size.y / 2;
        }
        if (vz < 0) {
            z = this.origin.z;
        }
        else if (0 < vz) {
            z = this.origin.z + this.size.z;
        }
        else {
            z = this.origin.z + this.size.z / 2;
        }
        return new Vec3(x, y, z);
    };
    Box.prototype.move = function (dx, dy, dz) {
        return new Box(this.origin.move(dx, dy, dz), this.size);
    };
    Box.prototype.add = function (v) {
        return new Box(this.origin.add(v), this.size);
    };
    Box.prototype.sub = function (v) {
        return new Box(this.origin.sub(v), this.size);
    };
    Box.prototype.inflate = function (dx, dy, dz) {
        return new Box(this.origin.move(-dx, -dy, -dz), this.size.move(dx * 2, dy * 2, dz * 2));
    };
    Box.prototype.xdistance = function (box) {
        return Math.max(box.origin.x - (this.origin.x + this.size.x), this.origin.x - (box.origin.x + box.size.x));
    };
    Box.prototype.ydistance = function (box) {
        return Math.max(box.origin.y - (this.origin.y + this.size.y), this.origin.y - (box.origin.y + box.size.y));
    };
    Box.prototype.zdistance = function (box) {
        return Math.max(box.origin.z - (this.origin.z + this.size.z), this.origin.z - (box.origin.z + box.size.z));
    };
    Box.prototype.containsPt = function (p) {
        return (this.origin.x <= p.x && this.origin.y <= p.y && this.origin.z <= p.z &&
            p.x < this.origin.x + this.size.x &&
            p.y < this.origin.y + this.size.y &&
            p.z < this.origin.z + this.size.z);
    };
    Box.prototype.overlapsBox = function (box) {
        return (this.xdistance(box) < 0 &&
            this.ydistance(box) < 0 &&
            this.zdistance(box) < 0);
    };
    Box.prototype.union = function (box) {
        var x0 = Math.min(this.origin.x, box.origin.x);
        var y0 = Math.min(this.origin.y, box.origin.y);
        var z0 = Math.min(this.origin.z, box.origin.z);
        var x1 = Math.max(this.origin.x + this.size.x, box.origin.x + box.size.x);
        var y1 = Math.max(this.origin.y + this.size.y, box.origin.y + box.size.y);
        var z1 = Math.max(this.origin.z + this.size.z, box.origin.z + box.size.z);
        return new Box(new Vec3(x0, y0, z0), new Vec3(x1 - x0, y1 - y0, z1 - z0));
    };
    Box.prototype.intersection = function (box) {
        var x0 = Math.max(this.origin.x, box.origin.x);
        var y0 = Math.max(this.origin.y, box.origin.y);
        var z0 = Math.max(this.origin.z, box.origin.z);
        var x1 = Math.min(this.origin.x + this.size.x, box.origin.x + box.size.x);
        var y1 = Math.min(this.origin.y + this.size.y, box.origin.y + box.size.y);
        var z1 = Math.min(this.origin.z + this.size.z, box.origin.z + box.size.z);
        return new Box(new Vec3(x0, y0, z0), new Vec3(x1 - x0, y1 - y0, z1 - z0));
    };
    Box.prototype.clamp = function (bounds) {
        var x = ((bounds.size.x < this.size.x) ?
            (bounds.origin.x + bounds.size.x / 2) :
            clamp(bounds.origin.x, this.origin.x, bounds.origin.x + bounds.size.x - this.size.x));
        var y = ((bounds.size.y < this.size.y) ?
            (bounds.origin.y + bounds.size.y / 2) :
            clamp(bounds.origin.y, this.origin.y, bounds.origin.y + bounds.size.y - this.size.y));
        var z = ((bounds.size.z < this.size.z) ?
            (bounds.origin.z + bounds.size.z / 2) :
            clamp(bounds.origin.z, this.origin.z, bounds.origin.z + bounds.size.z - this.size.z));
        return new Box(new Vec3(x, y, z), this.size);
    };
    Box.prototype.rndPt = function () {
        return new Vec3(this.origin.x + frnd(this.size.x), this.origin.y + frnd(this.size.y), this.origin.z + frnd(this.size.z));
    };
    Box.prototype.contactBox = function (v, box) {
        if (this.overlapsBox(box)) {
            return new Vec3();
        }
        if (0 < v.x) {
            v = this.surface(-1, 0, 0).contactBox(v, box);
        }
        else if (v.x < 0) {
            v = this.surface(+1, 0, 0).contactBox(v, box);
        }
        if (0 < v.y) {
            v = this.surface(0, -1, 0).contactBox(v, box);
        }
        else if (v.y < 0) {
            v = this.surface(0, +1, 0).contactBox(v, box);
        }
        if (0 < v.z) {
            v = this.surface(0, 0, -1).contactBox(v, box);
        }
        else if (v.z < 0) {
            v = this.surface(0, 0, +1).contactBox(v, box);
        }
        return v;
    };
    return Box;
}());
// getContact: returns a motion vector that satisfies the given constraints.
function getContact(collider0, v, obstacles, fences) {
    if (fences === void 0) { fences = null; }
    if (obstacles !== null) {
        for (var _i = 0, obstacles_1 = obstacles; _i < obstacles_1.length; _i++) {
            var collider1 = obstacles_1[_i];
            v = collider1.contact(v, collider0);
        }
    }
    if (fences !== null) {
        for (var _a = 0, fences_1 = fences; _a < fences_1.length; _a++) {
            var rect = fences_1[_a];
            v = rect.boundRect(v, collider0.getAABB());
        }
    }
    return v;
}
/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/** Sprite that is a solid filled rectangle.
 *  Typically used as placeholders.
 */
var RectSprite = /** @class */ (function () {
    function RectSprite(color, dstRect) {
        this.color = color;
        this.dstRect = dstRect;
    }
    /** Returns the bounds of the image at (0, 0). */
    RectSprite.prototype.getBounds = function () {
        return this.dstRect;
    };
    /** Renders this image in the given context. */
    RectSprite.prototype.render = function (ctx) {
        if (this.color !== null) {
            ctx.fillStyle = this.color;
            fillRect(ctx, this.dstRect);
        }
    };
    return RectSprite;
}());
/** Sprite that is a solid filled oval.
 */
var OvalSprite = /** @class */ (function () {
    function OvalSprite(color, dstRect) {
        this.color = color;
        this.dstRect = dstRect;
    }
    /** Returns the bounds of the image at (0, 0). */
    OvalSprite.prototype.getBounds = function () {
        return this.dstRect;
    };
    /** Renders this image in the given context. */
    OvalSprite.prototype.render = function (ctx) {
        if (this.color !== null) {
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.translate(this.dstRect.cx(), this.dstRect.cy());
            ctx.scale(this.dstRect.width / 2, this.dstRect.height / 2);
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    };
    return OvalSprite;
}());
/** Sprite that uses a canvas object.
 */
var CanvasSprite = /** @class */ (function () {
    function CanvasSprite(canvas, srcRect, dstRect) {
        if (srcRect === void 0) { srcRect = null; }
        if (dstRect === void 0) { dstRect = null; }
        this.canvas = canvas;
        if (srcRect === null) {
            srcRect = new Rect(0, 0, canvas.width, canvas.height);
        }
        this.srcRect = srcRect;
        if (dstRect === null) {
            dstRect = new Rect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        }
        this.dstRect = dstRect;
    }
    /** Returns the bounds of the image at (0, 0). */
    CanvasSprite.prototype.getBounds = function () {
        return this.dstRect;
    };
    /** Renders this image in the given context. */
    CanvasSprite.prototype.render = function (ctx) {
        ctx.drawImage(this.canvas, this.srcRect.x, this.srcRect.y, this.srcRect.width, this.srcRect.height, this.dstRect.x, this.dstRect.y, this.dstRect.width, this.dstRect.height);
    };
    return CanvasSprite;
}());
/** Sprite that uses a (part of) HTML <img> element.
 */
var HTMLSprite = /** @class */ (function () {
    function HTMLSprite(image, srcRect, dstRect) {
        if (srcRect === void 0) { srcRect = null; }
        if (dstRect === void 0) { dstRect = null; }
        this.image = image;
        if (srcRect === null) {
            srcRect = new Rect(0, 0, image.width, image.height);
        }
        this.srcRect = srcRect;
        if (dstRect === null) {
            dstRect = new Rect(-image.width / 2, -image.height / 2, image.width, image.height);
        }
        this.dstRect = dstRect;
    }
    /** Returns the bounds of the image at (0, 0). */
    HTMLSprite.prototype.getBounds = function () {
        return this.dstRect;
    };
    /** Renders this image in the given context. */
    HTMLSprite.prototype.render = function (ctx) {
        ctx.drawImage(this.image, this.srcRect.x, this.srcRect.y, this.srcRect.width, this.srcRect.height, this.dstRect.x, this.dstRect.y, this.dstRect.width, this.dstRect.height);
    };
    return HTMLSprite;
}());
/** Sprite that consists of tiled images.
 *  A image is displayed repeatedly to fill up the specified bounds.
 */
var TiledSprite = /** @class */ (function () {
    function TiledSprite(sprite, bounds, offset) {
        if (offset === void 0) { offset = null; }
        this.sprite = sprite;
        this.bounds = bounds;
        this.offset = (offset !== null) ? offset : new Vec2();
    }
    /** Returns the bounds of the image at a given pos. */
    TiledSprite.prototype.getBounds = function () {
        return this.bounds;
    };
    /** Renders this image in the given context. */
    TiledSprite.prototype.render = function (ctx) {
        ctx.save();
        ctx.translate(int(this.bounds.x), int(this.bounds.y));
        ctx.beginPath();
        ctx.rect(0, 0, this.bounds.width, this.bounds.height);
        ctx.clip();
        var dstRect = this.sprite.getBounds();
        var w = dstRect.width;
        var h = dstRect.height;
        var dx0 = int(Math.floor(this.offset.x / w) * w - this.offset.x);
        var dy0 = int(Math.floor(this.offset.y / h) * h - this.offset.y);
        for (var dy = dy0; dy < this.bounds.height; dy += h) {
            for (var dx = dx0; dx < this.bounds.width; dx += w) {
                ctx.save();
                ctx.translate(dx, dy);
                this.sprite.render(ctx);
                ctx.restore();
            }
        }
        ctx.restore();
    };
    return TiledSprite;
}());
/** Internal object that represents a star. */
var Star = /** @class */ (function () {
    function Star() {
    }
    Star.prototype.init = function (maxdepth) {
        this.z = Math.random() * maxdepth + 1;
        this.s = (Math.random() * 2 + 1) / this.z;
    };
    return Star;
}());
/** Sprite for "star flowing" effects.
 *  A image is scattered across the area with a varied depth.
 */
var StarSprite = /** @class */ (function () {
    function StarSprite(bounds, nstars, maxdepth, sprites) {
        if (maxdepth === void 0) { maxdepth = 3; }
        if (sprites === void 0) { sprites = null; }
        this._stars = [];
        this.bounds = bounds;
        this.maxdepth = maxdepth;
        if (sprites === null) {
            sprites = [new RectSprite('white', new Rect(0, 0, 1, 1))];
        }
        this.sprites = sprites;
        for (var i = 0; i < nstars; i++) {
            var star = new Star();
            star.sprite = choice(sprites);
            star.init(this.maxdepth);
            star.p = this.bounds.rndPt();
            this._stars.push(star);
        }
    }
    /** Returns the bounds of the image at a given pos. */
    StarSprite.prototype.getBounds = function () {
        return this.bounds;
    };
    /** Renders this image in the given context. */
    StarSprite.prototype.render = function (ctx) {
        for (var _i = 0, _a = this._stars; _i < _a.length; _i++) {
            var star = _a[_i];
            ctx.save();
            ctx.translate(star.p.x, star.p.y);
            ctx.scale(star.s, star.s);
            star.sprite.render(ctx);
            ctx.restore();
        }
    };
    /** Moves the stars by the given offset. */
    StarSprite.prototype.move = function (offset) {
        for (var _i = 0, _a = this._stars; _i < _a.length; _i++) {
            var star = _a[_i];
            star.p.x += offset.x / star.z;
            star.p.y += offset.y / star.z;
            var rect = star.p.expand(star.s, star.s);
            if (!this.bounds.overlapsRect(rect)) {
                star.init(this.maxdepth);
                star.p = this.bounds.modPt(star.p);
            }
        }
    };
    return StarSprite;
}());
/** Object that stores multiple Sprite objects.
 *  Each cell on the grid represents an individual Sprite.
 */
var SpriteSheet = /** @class */ (function () {
    function SpriteSheet() {
    }
    /** Returns an Sprite at the given cell. */
    SpriteSheet.prototype.get = function (x, y, w, h, origin) {
        if (y === void 0) { y = 0; }
        if (w === void 0) { w = 1; }
        if (h === void 0) { h = 1; }
        if (origin === void 0) { origin = null; }
        return null;
    };
    return SpriteSheet;
}());
/** Array of Sprites.
 */
var ArraySpriteSheet = /** @class */ (function (_super) {
    __extends(ArraySpriteSheet, _super);
    function ArraySpriteSheet(sprites) {
        var _this = _super.call(this) || this;
        _this.sprites = sprites;
        return _this;
    }
    /** Returns an Sprite at the given cell. */
    ArraySpriteSheet.prototype.get = function (x, y, w, h, origin) {
        if (y === void 0) { y = 0; }
        if (w === void 0) { w = 1; }
        if (h === void 0) { h = 1; }
        if (origin === void 0) { origin = null; }
        if (x < 0 || this.sprites.length <= x || y != 0)
            return null;
        return this.sprites[x];
    };
    /** Sets an Sprite at the given cell. */
    ArraySpriteSheet.prototype.set = function (i, sprite) {
        this.sprites[i] = sprite;
    };
    return ArraySpriteSheet;
}(SpriteSheet));
/** SpriteSheet that is based on a single HTML image.
 */
var ImageSpriteSheet = /** @class */ (function (_super) {
    __extends(ImageSpriteSheet, _super);
    function ImageSpriteSheet(image, size, origin) {
        if (origin === void 0) { origin = null; }
        var _this = _super.call(this) || this;
        _this.image = image;
        _this.size = size;
        _this.origin = origin;
        return _this;
    }
    /** Returns an Sprite at the given cell. */
    ImageSpriteSheet.prototype.get = function (x, y, w, h, origin) {
        if (y === void 0) { y = 0; }
        if (w === void 0) { w = 1; }
        if (h === void 0) { h = 1; }
        if (origin === void 0) { origin = null; }
        if (origin === null) {
            origin = this.origin;
            if (origin === null) {
                origin = new Vec2(w * this.size.x / 2, h * this.size.y / 2);
            }
        }
        var srcRect = new Rect(x * this.size.x, y * this.size.y, w * this.size.x, h * this.size.y);
        var dstRect = new Rect(-origin.x, -origin.y, w * this.size.x, h * this.size.y);
        return new HTMLSprite(this.image, srcRect, dstRect);
    };
    return ImageSpriteSheet;
}(SpriteSheet));
/// <reference path="utils.ts" />
var TaskState;
(function (TaskState) {
    TaskState[TaskState["Scheduled"] = 0] = "Scheduled";
    TaskState[TaskState["Running"] = 1] = "Running";
    TaskState[TaskState["Finished"] = 2] = "Finished";
})(TaskState || (TaskState = {}));
/** Object that represents a continuous process.
 *  onTick() method is invoked at every frame.
 */
var Task = /** @class */ (function () {
    function Task() {
        /** List to which this task belongs (assigned by TaskList). */
        this.parent = null;
        /** True if the task is running. */
        this.state = TaskState.Scheduled;
        /** Lifetime.
         * This task automatically terminates itself after
         * the time specified here passes. */
        this.lifetime = Infinity;
        /** Start time. */
        this.startTime = Infinity;
        this.stopped = new Signal(this);
    }
    Task.prototype.toString = function () {
        return '<Task: time=' + this.getTime() + '>';
    };
    /** Returns the number of seconds elapsed since
     * this task has started. */
    Task.prototype.getTime = function () {
        return (getTime() - this.startTime);
    };
    /** Returns true if the task is scheduled but not yet running. */
    Task.prototype.isScheduled = function () {
        return (this.state == TaskState.Scheduled);
    };
    /** Returns true if the task is running. */
    Task.prototype.isRunning = function () {
        return (this.state == TaskState.Running);
    };
    /** Invoked when the task is started. */
    Task.prototype.onStart = function () {
        if (this.state == TaskState.Scheduled) {
            this.state = TaskState.Running;
            this.startTime = getTime();
        }
    };
    /** Invoked when the task is stopped. */
    Task.prototype.onStop = function () {
    };
    /** Invoked at every frame while the task is running. */
    Task.prototype.onTick = function () {
        if (this.lifetime <= this.getTime()) {
            this.stop();
        }
    };
    /** Terminates the task. */
    Task.prototype.stop = function () {
        if (this.state == TaskState.Running) {
            this.state = TaskState.Finished;
            this.stopped.fire();
        }
    };
    /** Schedules another task right after this task.
     * @param next Next Task.
     */
    Task.prototype.chain = function (next, signal) {
        var _this = this;
        if (signal === void 0) { signal = null; }
        switch (this.state) {
            case TaskState.Scheduled:
            case TaskState.Running:
                signal = (signal !== null) ? signal : this.stopped;
                signal.subscribe(function () {
                    if (_this.parent !== null) {
                        _this.parent.add(next);
                    }
                });
                break;
            case TaskState.Finished:
                // Start immediately if this task has already finished.
                if (this.parent !== null) {
                    this.parent.add(next);
                }
        }
        return next;
    };
    return Task;
}());
/** Task that plays a sound.
 */
var SoundTask = /** @class */ (function (_super) {
    __extends(SoundTask, _super);
    /** Constructor.
     * @param sound Sound object to play.
     * @param soundStart Start time of the sound.
     */
    function SoundTask(sound, soundStart, soundEnd) {
        if (soundStart === void 0) { soundStart = MP3_GAP; }
        if (soundEnd === void 0) { soundEnd = 0; }
        var _this = _super.call(this) || this;
        _this.sound = sound;
        _this.soundStart = soundStart;
        _this.soundEnd = soundEnd;
        return _this;
    }
    /** Invoked when the task is started. */
    SoundTask.prototype.onStart = function () {
        _super.prototype.onStart.call(this);
        // Start playing.
        this.sound.currentTime = this.soundStart;
        this.sound.play();
    };
    /** Invoked when the task is stopped. */
    SoundTask.prototype.onStop = function () {
        // Stop playing.
        this.sound.pause();
        _super.prototype.onStop.call(this);
    };
    /** Invoked at every frame while the task is running. */
    SoundTask.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        // Check if the playing is finished.
        if (0 < this.soundEnd && this.soundEnd <= this.sound.currentTime) {
            this.stop();
        }
        else if (this.sound.ended) {
            this.stop();
        }
    };
    return SoundTask;
}(Task));
/** List of Tasks that run parallely.
 */
var ParallelTaskList = /** @class */ (function (_super) {
    __extends(ParallelTaskList, _super);
    function ParallelTaskList() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /** List of current tasks. */
        _this.tasks = [];
        /** If true, this task is stopped when the list becomes empty. */
        _this.stopWhenEmpty = true;
        return _this;
    }
    ParallelTaskList.prototype.toString = function () {
        return ('<ParalellTaskList: tasks=' + this.tasks + '>');
    };
    /** Empties the task list. */
    ParallelTaskList.prototype.onStart = function () {
        _super.prototype.onStart.call(this);
        this.tasks = [];
    };
    /** Invoked at every frame. Update the current tasks. */
    ParallelTaskList.prototype.onTick = function () {
        for (var _i = 0, _a = this.tasks; _i < _a.length; _i++) {
            var task = _a[_i];
            if (task.isScheduled()) {
                task.onStart();
            }
            if (task.isRunning()) {
                task.onTick();
            }
        }
        // Remove the finished tasks from the list.
        var removed = this.tasks.filter(function (task) { return !task.isRunning(); });
        for (var _b = 0, removed_1 = removed; _b < removed_1.length; _b++) {
            var task = removed_1[_b];
            this.remove(task);
        }
        // Terminates itself then the list is empty.
        if (this.stopWhenEmpty && this.tasks.length == 0) {
            this.stop();
        }
    };
    /** Add a new Task to the list.
     * @param task Task to add.
     */
    ParallelTaskList.prototype.add = function (task) {
        task.parent = this;
        this.tasks.push(task);
    };
    /** Remove an existing Task from the list.
     * @param task Task to remove.
     */
    ParallelTaskList.prototype.remove = function (task) {
        if (!task.isScheduled()) {
            task.onStop();
        }
        removeElement(this.tasks, task);
    };
    return ParallelTaskList;
}(Task));
/** List of Tasks that run sequentially.
 */
var SequentialTaskList = /** @class */ (function (_super) {
    __extends(SequentialTaskList, _super);
    /** Constructor.
     * @param tasks List of tasks. (optional)
     */
    function SequentialTaskList(tasks) {
        if (tasks === void 0) { tasks = null; }
        var _this = _super.call(this) || this;
        /** List of current tasks. */
        _this.tasks = null;
        /** If true, this task is stopped when the list becomes empty. */
        _this.stopWhenEmpty = true;
        _this.tasks = tasks;
        return _this;
    }
    /** Empties the task list. */
    SequentialTaskList.prototype.onStart = function () {
        _super.prototype.onStart.call(this);
        if (this.tasks === null) {
            this.tasks = [];
        }
    };
    /** Add a new Task to the list.
     * @param task Task to add.
     */
    SequentialTaskList.prototype.add = function (task) {
        task.parent = this;
        this.tasks.push(task);
    };
    /** Remove an existing Task from the list.
     * @param task Task to remove.
     */
    SequentialTaskList.prototype.remove = function (task) {
        removeElement(this.tasks, task);
    };
    /** Returns the task that is currently running
     * (or null if empty) */
    SequentialTaskList.prototype.getCurrentTask = function () {
        return (0 < this.tasks.length) ? this.tasks[0] : null;
    };
    /** Invoked at every frame. Update the current tasks. */
    SequentialTaskList.prototype.onTick = function () {
        var task = null;
        while (true) {
            task = this.getCurrentTask();
            if (task === null)
                break;
            // Starts the next task.
            if (task.isScheduled()) {
                task.onStart();
            }
            if (task.isRunning()) {
                task.onTick();
                break;
            }
            // Finishes the current task.
            this.remove(task);
        }
        // Terminates itself then the list is empty.
        if (this.stopWhenEmpty && task === null) {
            this.stop();
        }
    };
    return SequentialTaskList;
}(Task));
/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="sprite.ts" />
//  TileMap
//
var TileMap = /** @class */ (function () {
    function TileMap(tilesize, width, height, map) {
        if (map === void 0) { map = null; }
        this._rangemap = {};
        this.tilesize = tilesize;
        this.width = width;
        this.height = height;
        if (map === null) {
            map = range(height).map(function () { return new Int32Array(width); });
        }
        this.map = map;
        this.bounds = new Rect(0, 0, this.width * this.tilesize, this.height * this.tilesize);
    }
    TileMap.prototype.toString = function () {
        return '<TileMap: ' + this.width + ',' + this.height + '>';
    };
    TileMap.prototype.get = function (x, y) {
        if (0 <= x && 0 <= y && x < this.width && y < this.height) {
            return this.map[y][x];
        }
        else {
            return -1;
        }
    };
    TileMap.prototype.set = function (x, y, c) {
        if (0 <= x && 0 <= y && x < this.width && y < this.height) {
            this.map[y][x] = c;
            this._rangemap = {};
        }
    };
    TileMap.prototype.fill = function (c, rect) {
        if (rect === void 0) { rect = null; }
        if (rect === null) {
            rect = new Rect(0, 0, this.width, this.height);
        }
        for (var dy = 0; dy < rect.height; dy++) {
            var y = rect.y + dy;
            for (var dx = 0; dx < rect.width; dx++) {
                var x = rect.x + dx;
                this.map[y][x] = c;
            }
        }
        this._rangemap = {};
    };
    TileMap.prototype.copy = function () {
        var map = [];
        for (var _i = 0, _a = this.map; _i < _a.length; _i++) {
            var a = _a[_i];
            map.push(a.slice());
        }
        return new TileMap(this.tilesize, this.width, this.height, map);
    };
    TileMap.prototype.coord2map = function (rect) {
        var ts = this.tilesize;
        if (rect instanceof Rect) {
            var x0 = Math.floor(rect.x / ts);
            var y0 = Math.floor(rect.y / ts);
            var x1 = Math.ceil((rect.x + rect.width) / ts);
            var y1 = Math.ceil((rect.y + rect.height) / ts);
            return new Rect(x0, y0, x1 - x0, y1 - y0);
        }
        else {
            var x = Math.floor(rect.x / ts);
            var y = Math.floor(rect.y / ts);
            return new Rect(x, y, 1, 1);
        }
    };
    TileMap.prototype.map2coord = function (rect) {
        var ts = this.tilesize;
        if (rect instanceof Vec2) {
            return new Rect(rect.x * ts, rect.y * ts, ts, ts);
        }
        else if (rect instanceof Rect) {
            return new Rect(rect.x * ts, rect.y * ts, rect.width * ts, rect.height * ts);
        }
        else {
            return null;
        }
    };
    TileMap.prototype.apply = function (f, rect) {
        if (rect === void 0) { rect = null; }
        if (rect === null) {
            rect = new Rect(0, 0, this.width, this.height);
        }
        for (var dy = 0; dy < rect.height; dy++) {
            var y = rect.y + dy;
            for (var dx = 0; dx < rect.width; dx++) {
                var x = rect.x + dx;
                var c = this.get(x, y);
                if (f(x, y, c)) {
                    return new Vec2(x, y);
                }
            }
        }
        return null;
    };
    TileMap.prototype.shift = function (vx, vy, rect) {
        if (rect === void 0) { rect = null; }
        if (rect === null) {
            rect = new Rect(0, 0, this.width, this.height);
        }
        var src = [];
        for (var dy = 0; dy < rect.height; dy++) {
            var a = new Int32Array(rect.width);
            for (var dx = 0; dx < rect.width; dx++) {
                a[dx] = this.map[rect.y + dy][rect.x + dx];
            }
            src.push(a);
        }
        for (var dy = 0; dy < rect.height; dy++) {
            for (var dx = 0; dx < rect.width; dx++) {
                var x = (dx + vx + rect.width) % rect.width;
                var y = (dy + vy + rect.height) % rect.height;
                this.map[rect.y + y][rect.x + x] = src[dy][dx];
            }
        }
    };
    TileMap.prototype.findTile = function (f0, rect) {
        if (rect === void 0) { rect = null; }
        return this.apply(function (x, y, c) { return f0(c); }, rect);
    };
    TileMap.prototype.findTileByCoord = function (f0, range) {
        var p = this.apply(function (x, y, c) { return f0(c); }, this.coord2map(range));
        return (p === null) ? null : this.map2coord(p);
    };
    TileMap.prototype.getTileRects = function (f0, range) {
        var ts = this.tilesize;
        var rects = [];
        var f = function (x, y, c) {
            if (f0(c)) {
                rects.push(new Rect(x * ts, y * ts, ts, ts));
            }
            return false;
        };
        this.apply(f, this.coord2map(range));
        return rects;
    };
    TileMap.prototype.getRangeMap = function (key, f) {
        var map = this._rangemap[key];
        if (map === undefined) {
            map = new RangeMap(this, f);
            this._rangemap[key] = map;
        }
        return map;
    };
    TileMap.prototype.render = function (ctx, sprites) {
        this.renderFromBottomLeft(ctx, function (x, y, c) { return sprites.get(c); });
    };
    TileMap.prototype.renderFromBottomLeft = function (ctx, ft, x0, y0, w, h) {
        if (x0 === void 0) { x0 = 0; }
        if (y0 === void 0) { y0 = 0; }
        if (w === void 0) { w = 0; }
        if (h === void 0) { h = 0; }
        // Align the pos to the bottom left corner.
        var ts = this.tilesize;
        w = (w != 0) ? w : this.width;
        h = (h != 0) ? h : this.height;
        // Draw tiles from the bottom-left first.
        for (var dy = h - 1; 0 <= dy; dy--) {
            var y = y0 + dy;
            for (var dx = 0; dx < w; dx++) {
                var x = x0 + dx;
                var c = this.get(x, y);
                var sprite = ft(x, y, c);
                if (sprite !== null) {
                    ctx.save();
                    ctx.translate(ts * dx, ts * dy);
                    sprite.render(ctx);
                    ctx.restore();
                }
            }
        }
    };
    TileMap.prototype.renderFromTopRight = function (ctx, ft, x0, y0, w, h) {
        if (x0 === void 0) { x0 = 0; }
        if (y0 === void 0) { y0 = 0; }
        if (w === void 0) { w = 0; }
        if (h === void 0) { h = 0; }
        // Align the pos to the bottom left corner.
        var ts = this.tilesize;
        w = (w != 0) ? w : this.width;
        h = (h != 0) ? h : this.height;
        // Draw tiles from the top-right first.
        for (var dy = 0; dy < h; dy++) {
            var y = y0 + dy;
            for (var dx = w - 1; 0 <= dx; dx--) {
                var x = x0 + dx;
                var c = this.get(x, y);
                var sprite = ft(x, y, c);
                if (sprite !== null) {
                    ctx.save();
                    ctx.translate(ts * dx, ts * dy);
                    sprite.render(ctx);
                    ctx.restore();
                }
            }
        }
    };
    TileMap.prototype.renderWindow = function (ctx, window, sprites) {
        this.renderWindowFromBottomLeft(ctx, window, function (x, y, c) { return sprites.get(c); });
    };
    TileMap.prototype.renderWindowFromBottomLeft = function (ctx, window, ft) {
        var ts = this.tilesize;
        var x0 = Math.floor(window.x / ts);
        var y0 = Math.floor(window.y / ts);
        var x1 = Math.ceil((window.x + window.width) / ts);
        var y1 = Math.ceil((window.y + window.height) / ts);
        ctx.save();
        ctx.translate(x0 * ts - window.x, y0 * ts - window.y);
        this.renderFromBottomLeft(ctx, ft, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
        ctx.restore();
    };
    TileMap.prototype.renderWindowFromTopRight = function (ctx, window, ft) {
        var ts = this.tilesize;
        var x0 = Math.floor(window.x / ts);
        var y0 = Math.floor(window.y / ts);
        var x1 = Math.ceil((window.x + window.width) / ts);
        var y1 = Math.ceil((window.y + window.height) / ts);
        ctx.save();
        ctx.translate(x0 * ts - window.x, y0 * ts - window.y);
        this.renderFromTopRight(ctx, ft, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
        ctx.restore();
    };
    return TileMap;
}());
//  RangeMap
//
var RangeMap = /** @class */ (function () {
    function RangeMap(tilemap, f) {
        var data = new Array(tilemap.height + 1);
        var row0 = new Int32Array(tilemap.width + 1);
        for (var x = 0; x < tilemap.width; x++) {
            row0[x + 1] = 0;
        }
        data[0] = row0;
        for (var y = 0; y < tilemap.height; y++) {
            var row1 = new Int32Array(tilemap.width + 1);
            var n = 0;
            for (var x = 0; x < tilemap.width; x++) {
                if (f(tilemap.get(x, y))) {
                    n++;
                }
                row1[x + 1] = row0[x + 1] + n;
            }
            data[y + 1] = row1;
            row0 = row1;
        }
        this.width = tilemap.width;
        this.height = tilemap.height;
        this._data = data;
    }
    RangeMap.prototype.get = function (x0, y0, x1, y1) {
        var t;
        if (x1 < x0) {
            t = x0;
            x0 = x1;
            x1 = t;
            // assert(x0 <= x1);
        }
        if (y1 < y0) {
            t = y0;
            y0 = y1;
            y1 = t;
            // assert(y0 <= y1);
        }
        x0 = clamp(0, x0, this.width);
        y0 = clamp(0, y0, this.height);
        x1 = clamp(0, x1, this.width);
        y1 = clamp(0, y1, this.height);
        return (this._data[y1][x1] - this._data[y1][x0] -
            this._data[y0][x1] + this._data[y0][x0]);
    };
    RangeMap.prototype.exists = function (rect) {
        return (this.get(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height) !== 0);
    };
    return RangeMap;
}());
/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="sprite.ts" />
/// <reference path="tilemap.ts" />
/** Entity: a thing that can interact with other things.
 */
var Entity = /** @class */ (function (_super) {
    __extends(Entity, _super);
    function Entity(pos) {
        var _this = _super.call(this) || this;
        _this.world = null;
        _this.collider = null;
        _this.sprites = [];
        _this.order = 0;
        _this.rotation = 0;
        _this.scale = null;
        _this.alpha = 1.0;
        _this.pos = (pos !== null) ? pos.copy() : pos;
        return _this;
    }
    Entity.prototype.toString = function () {
        return '<Entity: ' + this.pos + '>';
    };
    Entity.prototype.isVisible = function () {
        return this.isRunning();
    };
    Entity.prototype.render = function (ctx) {
        ctx.save();
        if (this.pos !== null) {
            ctx.translate(this.pos.x, this.pos.y);
        }
        if (this.rotation) {
            ctx.rotate(this.rotation);
        }
        if (this.scale !== null) {
            ctx.scale(this.scale.x, this.scale.y);
        }
        ctx.globalAlpha = this.alpha;
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.render(ctx);
        }
        ctx.restore();
    };
    Entity.prototype.movePos = function (v) {
        this.pos = this.pos.add(v);
    };
    Entity.prototype.getCollider = function (pos) {
        if (pos === void 0) { pos = null; }
        if (this.collider === null)
            return null;
        if (pos === null) {
            pos = this.pos;
            if (pos === null)
                return null;
        }
        return this.collider.add(pos);
    };
    Entity.prototype.canMove = function (v0, context) {
        if (context === void 0) { context = null; }
        var v1 = this.getMove(this.pos, v0, context);
        return v1.equals(v0);
    };
    Entity.prototype.getMove = function (pos, v, context) {
        if (context === void 0) { context = null; }
        if (this.collider === null)
            return v;
        var collider = this.collider.add(pos);
        var hitbox0 = collider.getAABB();
        var range = hitbox0.union(hitbox0.add(v));
        var obstacles = this.getObstaclesFor(range, v, context);
        var fences = this.getFencesFor(range, v, context);
        var d = getContact(collider, v, obstacles, fences);
        v = v.sub(d);
        collider = collider.add(d);
        if (v.x != 0) {
            d = getContact(collider, new Vec2(v.x, 0), obstacles, fences);
            v = v.sub(d);
            collider = collider.add(d);
        }
        if (v.y != 0) {
            d = getContact(collider, new Vec2(0, v.y), obstacles, fences);
            v = v.sub(d);
            collider = collider.add(d);
        }
        var hitbox1 = collider.getAABB();
        return new Vec2(hitbox1.x - hitbox0.x, hitbox1.y - hitbox0.y);
    };
    Entity.prototype.moveIfPossible = function (v, context) {
        if (context === void 0) { context = null; }
        v = this.getMove(this.pos, v, context);
        this.movePos(v);
        return v;
    };
    Entity.prototype.getObstaclesFor = function (range, v, context) {
        // [OVERRIDE]
        return null;
    };
    Entity.prototype.getFencesFor = function (range, v, context) {
        // [OVERRIDE]
        return null;
    };
    Entity.prototype.onCollided = function (entity) {
        // [OVERRIDE]
    };
    return Entity;
}(Task));
//  Particle
//
var Particle = /** @class */ (function (_super) {
    __extends(Particle, _super);
    function Particle() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.movement = null;
        return _this;
    }
    Particle.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        if (this.movement !== null) {
            this.movePos(this.movement);
            var frame = this.getFrame();
            if (frame !== null) {
                var collider = this.getCollider();
                if (collider !== null && !collider.overlaps(frame)) {
                    this.stop();
                }
            }
        }
    };
    Particle.prototype.getFrame = function () {
        // [OVERRIDE]
        return null;
    };
    return Particle;
}(Entity));
//  TileMapEntity
//
var TileMapEntity = /** @class */ (function (_super) {
    __extends(TileMapEntity, _super);
    function TileMapEntity(tilemap, isObstacle, pos) {
        var _this = _super.call(this, pos) || this;
        _this.tilemap = tilemap;
        _this.isObstacle = isObstacle;
        return _this;
    }
    TileMapEntity.prototype.hasTile = function (f, pos) {
        if (pos === void 0) { pos = null; }
        var range = this.getCollider(pos).getAABB();
        return (this.tilemap.findTileByCoord(f, range) !== null);
    };
    TileMapEntity.prototype.getObstaclesFor = function (range, v, context) {
        return this.tilemap.getTileRects(this.isObstacle, range);
    };
    return TileMapEntity;
}(Entity));
//  PhysicsConfig
//
var PhysicsConfig = /** @class */ (function () {
    function PhysicsConfig() {
        this.jumpfunc = (function (vy, t) {
            return (0 <= t && t <= 5) ? -4 : vy + 1;
        });
        this.maxspeed = new Vec2(6, 6);
        this.isObstacle = (function (c) { return false; });
        this.isGrabbable = (function (c) { return false; });
        this.isStoppable = (function (c) { return false; });
    }
    return PhysicsConfig;
}());
//  PhysicalEntity
//
var PhysicalEntity = /** @class */ (function (_super) {
    __extends(PhysicalEntity, _super);
    function PhysicalEntity(physics, pos) {
        var _this = _super.call(this, pos) || this;
        _this.velocity = new Vec2();
        _this._jumpt = Infinity;
        _this._jumpend = 0;
        _this._landed = false;
        _this.physics = physics;
        return _this;
    }
    PhysicalEntity.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        this.fall(this._jumpt);
        if (this.isJumping()) {
            this._jumpt++;
        }
        else {
            this._jumpt = Infinity;
        }
    };
    PhysicalEntity.prototype.setJump = function (jumpend) {
        if (0 < jumpend) {
            if (this.canJump()) {
                this._jumpt = 0;
                this.onJumped();
            }
        }
        this._jumpend = jumpend;
    };
    PhysicalEntity.prototype.fall = function (t) {
        if (this.canFall()) {
            var vy = this.physics.jumpfunc(this.velocity.y, t);
            var v = new Vec2(this.velocity.x, vy);
            v = this.moveIfPossible(v, 'fall');
            this.velocity = v.clamp(this.physics.maxspeed);
            var landed = (0 < vy && this.velocity.y == 0);
            if (!this._landed && landed) {
                this.onLanded();
            }
            this._landed = landed;
        }
        else {
            this.velocity = new Vec2();
            if (!this._landed) {
                this.onLanded();
            }
            this._landed = true;
        }
    };
    PhysicalEntity.prototype.canJump = function () {
        return this.isLanded();
    };
    PhysicalEntity.prototype.canFall = function () {
        return true;
    };
    PhysicalEntity.prototype.isJumping = function () {
        return (this._jumpt < this._jumpend);
    };
    PhysicalEntity.prototype.isLanded = function () {
        return this._landed;
    };
    PhysicalEntity.prototype.onJumped = function () {
        // [OVERRIDE]
    };
    PhysicalEntity.prototype.onLanded = function () {
        // [OVERRIDE]
    };
    return PhysicalEntity;
}(Entity));
//  PlatformerEntity
//
var PlatformerEntity = /** @class */ (function (_super) {
    __extends(PlatformerEntity, _super);
    function PlatformerEntity(tilemap, physics, pos) {
        var _this = _super.call(this, physics, pos) || this;
        _this.tilemap = tilemap;
        return _this;
    }
    PlatformerEntity.prototype.hasTile = function (f, pos) {
        if (pos === void 0) { pos = null; }
        var range = this.getCollider(pos).getAABB();
        return (this.tilemap.findTileByCoord(f, range) !== null);
    };
    PlatformerEntity.prototype.getObstaclesFor = function (range, v, context) {
        var f = ((context == 'fall') ?
            this.physics.isStoppable :
            this.physics.isObstacle);
        return this.tilemap.getTileRects(f, range);
    };
    return PlatformerEntity;
}(PhysicalEntity));
/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="sprite.ts" />
/// <reference path="entity.ts" />
function makeGlyphs(src, color, inverted) {
    if (color === void 0) { color = null; }
    if (inverted === void 0) { inverted = false; }
    var dst = createCanvas(src.width, src.height);
    var ctx = getEdgeyContext(dst);
    ctx.clearRect(0, 0, dst.width, dst.height);
    ctx.drawImage(src, 0, 0);
    if (color !== null) {
        ctx.globalCompositeOperation = (inverted) ? 'source-out' : 'source-in';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, dst.width, dst.height);
    }
    return dst;
}
//  Font
//
var Font = /** @class */ (function () {
    function Font(glyphs, color, scale) {
        if (color === void 0) { color = null; }
        if (scale === void 0) { scale = 1; }
        this.background = null;
        this._csize = glyphs.height;
        this.width = this._csize * scale;
        this.height = this._csize * scale;
        this.initGlyphs(glyphs, color);
    }
    Font.prototype.getSize = function (text) {
        return new Vec2(this.width * text.length, this.height);
    };
    Font.prototype.initGlyphs = function (glyphs, color) {
        if (color === void 0) { color = null; }
        this._glyphs = makeGlyphs(glyphs, color);
    };
    Font.prototype.renderString = function (ctx, text, x, y) {
        this.renderBackground(ctx, text, x, y);
        this.renderGlyphs(ctx, this._glyphs, this._csize, text, x, y);
    };
    Font.prototype.renderBackground = function (ctx, text, x, y) {
        if (this.background !== null) {
            var size = this.getSize(text);
            ctx.fillStyle = this.background;
            ctx.fillRect(x, y, size.x, size.y);
        }
    };
    Font.prototype.renderGlyphs = function (ctx, glyphs, csize, text, x, y) {
        for (var i = 0; i < text.length; i++) {
            var c = text.charCodeAt(i) - 32;
            if (0 <= c) {
                ctx.drawImage(glyphs, c * csize, 0, csize, glyphs.height, x + this.width * i, y, this.width, this.height);
            }
        }
    };
    return Font;
}());
//  InvertedFont
//
var InvertedFont = /** @class */ (function (_super) {
    __extends(InvertedFont, _super);
    function InvertedFont() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InvertedFont.prototype.initGlyphs = function (glyphs, color) {
        if (color === void 0) { color = null; }
        this._glyphs = makeGlyphs(glyphs, color, true);
    };
    return InvertedFont;
}(Font));
//  ShadowFont
//
var ShadowFont = /** @class */ (function (_super) {
    __extends(ShadowFont, _super);
    function ShadowFont(glyphs, color, scale, shadowColor, shadowDist) {
        if (color === void 0) { color = null; }
        if (scale === void 0) { scale = 1; }
        if (shadowColor === void 0) { shadowColor = 'black'; }
        if (shadowDist === void 0) { shadowDist = 1; }
        var _this = _super.call(this, glyphs, color, scale) || this;
        _this.shadowDist = shadowDist;
        _this._glyphs2 = makeGlyphs(glyphs, shadowColor);
        return _this;
    }
    ShadowFont.prototype.getSize2 = function (text) {
        var size = _super.prototype.getSize.call(this, text);
        return size.move(this.shadowDist, this.shadowDist);
    };
    ShadowFont.prototype.renderString = function (ctx, text, x, y) {
        this.renderBackground(ctx, text, x, y);
        this.renderGlyphs(ctx, this._glyphs2, this._csize, text, x + this.shadowDist, y + this.shadowDist);
        this.renderGlyphs(ctx, this._glyphs, this._csize, text, x, y);
    };
    return ShadowFont;
}(Font));
//  TextSegment
//
var TextSegment = /** @class */ (function () {
    function TextSegment(p, text, font) {
        var size = font.getSize(text);
        this.bounds = new Rect(p.x, p.y, size.x, size.y);
        this.text = text;
        this.font = font;
    }
    return TextSegment;
}());
//  TextBox
//
var TextBox = /** @class */ (function () {
    function TextBox(frame, font) {
        if (font === void 0) { font = null; }
        this.header = '';
        this.lineSpace = 0;
        this.padding = 0;
        this.background = null;
        this.borderColor = null;
        this.borderWidth = 2;
        this._segments = [];
        this.frame = frame.copy();
        this.font = font;
    }
    TextBox.prototype.toString = function () {
        return '<TextBox: ' + this.frame + '>';
    };
    TextBox.prototype.getBounds = function () {
        return this.frame;
    };
    TextBox.prototype.getInnerBounds = function () {
        return this.frame.inflate(-this.padding, -this.padding);
    };
    TextBox.prototype.render = function (ctx) {
        ctx.save();
        ctx.translate(int(this.frame.x), int(this.frame.y));
        if (this.background !== null) {
            ctx.fillStyle = this.background;
            ctx.fillRect(0, 0, this.frame.width, this.frame.height);
        }
        if (this.borderColor !== null) {
            var b = this.borderWidth;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = b;
            ctx.strokeRect(-b, -b, this.frame.width + b * 2, this.frame.height + b * 2);
        }
        for (var _i = 0, _a = this._segments; _i < _a.length; _i++) {
            var seg = _a[_i];
            seg.font.renderString(ctx, seg.text, this.padding + seg.bounds.x, this.padding + seg.bounds.y);
        }
        ctx.restore();
    };
    TextBox.prototype.clear = function () {
        this._segments = [];
    };
    TextBox.prototype.add = function (seg) {
        this._segments.push(seg);
    };
    TextBox.prototype.addSegment = function (p, text, font) {
        if (font === void 0) { font = null; }
        font = (font !== null) ? font : this.font;
        var seg = new TextSegment(p, text, font);
        this.add(seg);
        return seg;
    };
    TextBox.prototype.addNewline = function (font) {
        if (font === void 0) { font = null; }
        font = (font !== null) ? font : this.font;
        var height = this.frame.height - this.padding * 2;
        var y = 0;
        if (this._segments.length !== 0) {
            y = this._segments[this._segments.length - 1].bounds.y1() + this.lineSpace;
        }
        var newseg = this.addSegment(new Vec2(0, y), '', font);
        var dy = newseg.bounds.y1() - height;
        if (0 < dy) {
            // scrolling.
            this._segments = this._segments.filter(function (seg) {
                seg.bounds.y -= dy;
                return 0 <= seg.bounds.y;
            });
        }
        return newseg;
    };
    TextBox.prototype.getSize = function (lines, font) {
        if (font === void 0) { font = null; }
        font = (font !== null) ? font : this.font;
        var w = 0, h = 0;
        for (var i = 0; i < lines.length; i++) {
            var size = font.getSize(lines[i]);
            w = Math.max(w, size.x);
            h = h + size.y + this.lineSpace;
        }
        return new Vec2(w, h - this.lineSpace);
    };
    TextBox.prototype.addText = function (text, font) {
        if (font === void 0) { font = null; }
        font = (font !== null) ? font : this.font;
        var width = this.frame.width - this.padding * 2;
        for (var i = 0; i < text.length;) {
            if (text[i] == '\n') {
                this.addNewline(font);
                i++;
                continue;
            }
            var j = text.indexOf('\n', i);
            if (j < 0) {
                j = text.length;
            }
            var s = text.substring(i, j);
            var size = font.getSize(s);
            var last = ((this._segments.length === 0) ? null :
                this._segments[this._segments.length - 1]);
            if (last === null || width < last.bounds.x1() + size.x) {
                last = this.addNewline(font);
            }
            else if (last.font !== font) {
                var pt = new Vec2(last.bounds.x1(), last.bounds.y);
                last = this.addSegment(pt, '', font);
            }
            last.text += s;
            last.bounds.width += size.x;
            last.bounds.height = Math.max(last.bounds.height, size.y);
            i = j;
        }
    };
    TextBox.prototype.splitWords = function (x, text, font, header) {
        if (font === void 0) { font = null; }
        if (header === void 0) { header = null; }
        font = (font !== null) ? font : this.font;
        header = (header !== null) ? header : this.header;
        var line = '';
        var a = [];
        var word = /\w+\W*/;
        var width = this.frame.width - this.padding * 2;
        while (true) {
            var m = word.exec(text);
            if (m == null) {
                a.push(line + text);
                break;
            }
            var i = m.index + m[0].length;
            var w = text.substr(0, i);
            var size = font.getSize(w);
            if (width < x + size.x) {
                a.push(line);
                line = header;
                x = font.getSize(line).x;
            }
            line += w;
            x += size.x;
            text = text.substr(i);
        }
        return a;
    };
    TextBox.prototype.wrapLines = function (text, font, header) {
        if (font === void 0) { font = null; }
        if (header === void 0) { header = null; }
        var x = ((this._segments.length === 0) ? 0 :
            this._segments[this._segments.length - 1].bounds.x1());
        var a = this.splitWords(x, text, font, header);
        var s = '';
        for (var i = 0; i < a.length; i++) {
            if (i != 0) {
                s += '\n';
            }
            s += a[i];
        }
        return s;
    };
    TextBox.prototype.putText = function (lines, halign, valign, font) {
        if (halign === void 0) { halign = 'left'; }
        if (valign === void 0) { valign = 'top'; }
        if (font === void 0) { font = null; }
        font = (font !== null) ? font : this.font;
        var width = this.frame.width - this.padding * 2;
        var height = this.frame.height - this.padding * 2;
        var y = 0;
        switch (valign) {
            case 'center':
                y += (height - this.getSize(lines, font).y) / 2;
                break;
            case 'bottom':
                y += height - this.getSize(lines, font).y;
                break;
        }
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var text = lines_1[_i];
            var size = font.getSize(text);
            var x = 0;
            switch (halign) {
                case 'center':
                    x += (width - size.x) / 2;
                    break;
                case 'right':
                    x += width - size.x;
                    break;
            }
            var bounds = new Rect(x, y, size.x, size.y);
            this._segments.push({ bounds: bounds, text: text, font: font });
            y += size.y + this.lineSpace;
        }
    };
    return TextBox;
}());
//  BannerBox
//
var BannerBox = /** @class */ (function (_super) {
    __extends(BannerBox, _super);
    function BannerBox(frame, font, lines, lineSpace) {
        if (lines === void 0) { lines = null; }
        if (lineSpace === void 0) { lineSpace = 4; }
        var _this = _super.call(this, null) || this;
        _this.interval = 0;
        _this.textbox = new TextBox(frame, font);
        _this.textbox.lineSpace = lineSpace;
        _this.sprites = [_this.textbox];
        if (lines !== null) {
            _this.putText(lines);
        }
        return _this;
    }
    BannerBox.prototype.putText = function (lines, halign, valign) {
        if (halign === void 0) { halign = 'center'; }
        if (valign === void 0) { valign = 'center'; }
        this.textbox.putText(lines, halign, valign);
    };
    BannerBox.prototype.isVisible = function () {
        return (this.isRunning() &&
            ((this.interval <= 0) ||
                (phase(this.getTime(), this.interval) != 0)));
    };
    return BannerBox;
}(Entity));
//  TextParticle
//
var TextParticle = /** @class */ (function (_super) {
    __extends(TextParticle, _super);
    function TextParticle(pos, font, text, borderWidth) {
        if (borderWidth === void 0) { borderWidth = 1; }
        var _this = this;
        var size = font.getSize(text);
        var frame = new Vec2().expand(size.x + borderWidth * 2, size.y + borderWidth * 2);
        _this = _super.call(this, frame, font, [text], 0) || this;
        _this.pos = pos;
        _this.movement = null;
        return _this;
    }
    TextParticle.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        if (this.movement !== null) {
            this.movePos(this.movement);
        }
    };
    return TextParticle;
}(BannerBox));
//  TextTask
//
var TextTask = /** @class */ (function (_super) {
    __extends(TextTask, _super);
    function TextTask(dialog) {
        var _this = _super.call(this) || this;
        _this.dialog = dialog;
        return _this;
    }
    TextTask.prototype.ff = function () {
    };
    TextTask.prototype.onKeyDown = function (key) {
        this.ff();
    };
    TextTask.prototype.onMouseDown = function (p, button) {
        this.ff();
    };
    TextTask.prototype.onMouseUp = function (p, button) {
    };
    TextTask.prototype.onMouseMove = function (p) {
    };
    return TextTask;
}(Task));
//  PauseTask
//
var PauseTask = /** @class */ (function (_super) {
    __extends(PauseTask, _super);
    function PauseTask(dialog, duration) {
        var _this = _super.call(this, dialog) || this;
        _this.lifetime = duration;
        return _this;
    }
    PauseTask.prototype.ff = function () {
        this.stop();
    };
    return PauseTask;
}(TextTask));
//  DisplayTask
//
var DisplayTask = /** @class */ (function (_super) {
    __extends(DisplayTask, _super);
    function DisplayTask(dialog, text) {
        var _this = _super.call(this, dialog) || this;
        _this.speed = 0;
        _this.sound = null;
        _this._index = 0;
        _this.text = text;
        _this.font = dialog.textbox.font;
        return _this;
    }
    DisplayTask.prototype.onStart = function () {
        _super.prototype.onStart.call(this);
        this.text = this.dialog.textbox.wrapLines(this.text, this.font);
    };
    DisplayTask.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        if (this.text.length <= this._index) {
            this.stop();
        }
        else if (this.speed === 0) {
            this.ff();
        }
        else {
            var n = this.getTime() * this.speed;
            var sound = false;
            while (this._index < n) {
                var c = this.text.substr(this._index, 1);
                this.dialog.textbox.addText(c, this.font);
                this._index++;
                sound = sound || (/\w/.test(c));
            }
            if (sound && this.sound !== null) {
                APP.playSound(this.sound);
            }
        }
    };
    DisplayTask.prototype.ff = function () {
        while (this._index < this.text.length) {
            this.dialog.textbox.addText(this.text.substr(this._index, 1), this.font);
            this._index++;
        }
        this.stop();
    };
    return DisplayTask;
}(TextTask));
//  MenuTask
//
var MenuItem = /** @class */ (function () {
    function MenuItem(pos, text, value) {
        this.seg = null;
        this.pos = pos.copy();
        this.text = text;
        this.value = value;
    }
    return MenuItem;
}());
var MenuTask = /** @class */ (function (_super) {
    __extends(MenuTask, _super);
    function MenuTask(dialog) {
        var _this = _super.call(this, dialog) || this;
        _this.vertical = true;
        _this.items = [];
        _this.current = null;
        _this.focus = null;
        _this.sound = null;
        _this.selected = new Signal(_this);
        return _this;
    }
    MenuTask.prototype.addItem = function (pos, text, value) {
        if (value === void 0) { value = null; }
        value = (value !== null) ? value : text;
        var item = new MenuItem(pos, text, value);
        this.items.push(item);
        if (2 <= this.items.length) {
            var item0 = this.items[0];
            var item1 = this.items[this.items.length - 1];
            this.vertical = (Math.abs(item0.pos.x - item1.pos.x) <
                Math.abs(item0.pos.y - item1.pos.y));
        }
        return item;
    };
    MenuTask.prototype.onStart = function () {
        _super.prototype.onStart.call(this);
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            item.seg = this.dialog.textbox.addSegment(item.pos, item.text);
        }
        this.updateSelection();
    };
    MenuTask.prototype.onKeyDown = function (key) {
        var d = 0;
        var keysym = getKeySym(key);
        switch (keysym) {
            case KeySym.Left:
                d = (this.vertical) ? -Infinity : -1;
                break;
            case KeySym.Right:
                d = (this.vertical) ? +Infinity : +1;
                break;
            case KeySym.Up:
                d = (this.vertical) ? -1 : -Infinity;
                break;
            case KeySym.Down:
                d = (this.vertical) ? +1 : +Infinity;
                break;
            case KeySym.Action1:
            case KeySym.Action2:
                if (this.current !== null) {
                    this.stop();
                    this.selected.fire(this.current.value);
                }
                ;
                return;
            case KeySym.Cancel:
                this.stop();
                this.selected.fire(null);
                return;
        }
        var i = 0;
        if (this.current !== null) {
            i = this.items.indexOf(this.current);
            i = clamp(0, i + d, this.items.length - 1);
        }
        this.current = this.items[i];
        this.updateSelection();
        if (this.sound !== null) {
            APP.playSound(this.sound);
        }
    };
    MenuTask.prototype.onMouseDown = function (p, button) {
        this.updateFocus(p);
        this.updateSelection();
        if (button == 0 && this.focus !== null) {
            this.current = this.focus;
        }
    };
    MenuTask.prototype.onMouseUp = function (p, button) {
        this.updateFocus(p);
        this.updateSelection();
        if (button == 0 && this.focus !== null) {
            if (this.current === this.focus) {
                this.stop();
                this.selected.fire(this.current.value);
            }
        }
    };
    MenuTask.prototype.onMouseMove = function (p) {
        this.updateFocus(p);
        this.updateSelection();
    };
    MenuTask.prototype.updateFocus = function (p) {
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.seg !== null) {
                if (item.seg.bounds.inflate(1, 1).containsPt(p)) {
                    this.focus = item;
                    return;
                }
            }
        }
        this.focus = null;
    };
    MenuTask.prototype.updateSelection = function () {
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item === this.current ||
                item === this.focus) {
                item.seg.font = this.dialog.hiFont;
            }
            else {
                item.seg.font = this.dialog.textbox.font;
            }
        }
    };
    return MenuTask;
}(TextTask));
var WaitTask = /** @class */ (function (_super) {
    __extends(WaitTask, _super);
    function WaitTask(dialog) {
        var _this = _super.call(this, dialog) || this;
        _this.ended = new Signal(_this);
        return _this;
    }
    WaitTask.prototype.onKeyDown = function (key) {
        var keysym = getKeySym(key);
        switch (keysym) {
            case KeySym.Action1:
            case KeySym.Action2:
            case KeySym.Cancel:
                this.stop();
                this.ended.fire();
                return;
        }
    };
    WaitTask.prototype.onMouseUp = function (p, button) {
        if (button == 0) {
            this.stop();
            this.ended.fire();
        }
    };
    return WaitTask;
}(TextTask));
//  DialogBox
//
var DialogBox = /** @class */ (function (_super) {
    __extends(DialogBox, _super);
    function DialogBox(textbox, hiFont) {
        if (hiFont === void 0) { hiFont = null; }
        var _this = _super.call(this, new Vec2()) || this;
        _this.speed = 0;
        _this.autoHide = false;
        _this.sound = null;
        _this._tasks = [];
        _this.sprites = [textbox];
        _this.textbox = textbox;
        _this.hiFont = hiFont;
        return _this;
    }
    DialogBox.prototype.isVisible = function () {
        return (!this.autoHide || 0 < this._tasks.length);
    };
    DialogBox.prototype.clear = function () {
        this.textbox.clear();
        this._tasks = [];
    };
    DialogBox.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        var task = null;
        while (true) {
            task = this.getCurrentTask();
            if (task === null)
                break;
            if (task.isScheduled()) {
                task.onStart();
            }
            if (task.isRunning()) {
                task.onTick();
                break;
            }
            this.remove(task);
        }
    };
    DialogBox.prototype.onKeyDown = function (key) {
        var task = this.getCurrentTask();
        if (task !== null) {
            task.onKeyDown(key);
        }
    };
    DialogBox.prototype.onMouseDown = function (p, button) {
        var task = this.getCurrentTask();
        if (task !== null) {
            var bounds = this.textbox.getInnerBounds();
            p = p.move(-bounds.x, -bounds.y);
            task.onMouseDown(p, button);
        }
    };
    DialogBox.prototype.onMouseUp = function (p, button) {
        var task = this.getCurrentTask();
        if (task !== null) {
            var bounds = this.textbox.getInnerBounds();
            p = p.move(-bounds.x, -bounds.y);
            task.onMouseUp(p, button);
        }
    };
    DialogBox.prototype.onMouseMove = function (p) {
        var task = this.getCurrentTask();
        if (task !== null) {
            var bounds = this.textbox.getInnerBounds();
            p = p.move(-bounds.x, -bounds.y);
            task.onMouseMove(p);
        }
    };
    DialogBox.prototype.ff = function () {
        while (true) {
            var task = this.getCurrentTask();
            if (task === null)
                break;
            if (task.isScheduled()) {
                task.onStart();
            }
            task.ff();
            if (task.isRunning())
                break;
            this.remove(task);
        }
    };
    DialogBox.prototype.getCurrentTask = function () {
        return (0 < this._tasks.length) ? this._tasks[0] : null;
    };
    DialogBox.prototype.add = function (task) {
        task.parent = this;
        if (task instanceof TextTask) {
            this._tasks.push(task);
        }
    };
    DialogBox.prototype.remove = function (task) {
        removeElement(this._tasks, task);
    };
    DialogBox.prototype.addPause = function (duration) {
        var task = new PauseTask(this, duration);
        this.add(task);
        return task;
    };
    DialogBox.prototype.addDisplay = function (text, speed, sound, font) {
        if (speed === void 0) { speed = -1; }
        if (sound === void 0) { sound = null; }
        if (font === void 0) { font = null; }
        var task = new DisplayTask(this, text);
        task.speed = (0 <= speed) ? speed : this.speed;
        task.sound = (sound !== null) ? sound : this.sound;
        task.font = (font !== null) ? font : this.textbox.font;
        this.add(task);
        return task;
    };
    DialogBox.prototype.addMenu = function () {
        var task = new MenuTask(this);
        this.add(task);
        return task;
    };
    DialogBox.prototype.addWait = function () {
        var task = new WaitTask(this);
        this.add(task);
        return task;
    };
    return DialogBox;
}(Entity));
/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="entity.ts" />
//  World
//
var World = /** @class */ (function (_super) {
    __extends(World, _super);
    function World(area) {
        var _this = _super.call(this) || this;
        _this.mouseFocus = null;
        _this.mouseActive = null;
        _this.mouseDown = new Signal(_this);
        _this.mouseUp = new Signal(_this);
        _this.area = area.copy();
        _this.reset();
        return _this;
    }
    World.prototype.toString = function () {
        return '<World: ' + this.area + '>';
    };
    World.prototype.reset = function () {
        this.window = this.area.copy();
        this.entities = [];
    };
    World.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        this.checkEntityCollisions();
    };
    World.prototype.add = function (task) {
        if (task instanceof Entity) {
            task.world = this;
            this.entities.push(task);
            this.sortEntitiesByOrder();
        }
        _super.prototype.add.call(this, task);
    };
    World.prototype.remove = function (task) {
        if (task instanceof Entity) {
            removeElement(this.entities, task);
        }
        _super.prototype.remove.call(this, task);
    };
    World.prototype.render = function (ctx) {
        ctx.save();
        ctx.translate(-this.window.x, -this.window.y);
        for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
            var entity = _a[_i];
            if (!entity.isVisible())
                continue;
            if (entity.pos === null)
                continue;
            entity.render(ctx);
        }
        ctx.restore();
        for (var _b = 0, _c = this.entities; _b < _c.length; _b++) {
            var entity = _c[_b];
            if (!entity.isVisible())
                continue;
            if (entity.pos !== null)
                continue;
            entity.render(ctx);
        }
    };
    World.prototype.findEntityAt = function (p) {
        var found = null;
        for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
            var entity = _a[_i];
            if (!entity.isVisible())
                continue;
            var collider = entity.getCollider();
            if (collider instanceof Rect) {
                if (collider.containsPt(p)) {
                    if (found === null || entity.order < found.order) {
                        found = entity;
                    }
                }
            }
        }
        return found;
    };
    World.prototype.moveCenter = function (v) {
        this.window = this.window.add(v);
    };
    World.prototype.setCenter = function (target, bounds) {
        if (bounds === void 0) { bounds = null; }
        if (this.window.width < target.width) {
            this.window.x = (target.width - this.window.width) / 2;
        }
        else if (target.x < this.window.x) {
            this.window.x = target.x;
        }
        else if (this.window.x + this.window.width < target.x + target.width) {
            this.window.x = target.x + target.width - this.window.width;
        }
        if (this.window.height < target.height) {
            this.window.y = (target.height - this.window.height) / 2;
        }
        else if (target.y < this.window.y) {
            this.window.y = target.y;
        }
        else if (this.window.y + this.window.height < target.y + target.height) {
            this.window.y = target.y + target.height - this.window.height;
        }
        if (bounds !== null) {
            this.window = this.window.clamp(bounds);
        }
    };
    World.prototype.moveAll = function (v) {
        for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
            var entity = _a[_i];
            if (!entity.isRunning())
                continue;
            if (entity.pos === null)
                continue;
            entity.movePos(v);
        }
    };
    World.prototype.onMouseDown = function (p, button) {
        if (button == 0) {
            this.mouseFocus = this.findEntityAt(p);
            this.mouseActive = this.mouseFocus;
            if (this.mouseActive !== null) {
                this.mouseDown.fire(this.mouseActive, p);
            }
        }
    };
    World.prototype.onMouseUp = function (p, button) {
        if (button == 0) {
            this.mouseFocus = this.findEntityAt(p);
            if (this.mouseActive !== null) {
                this.mouseUp.fire(this.mouseActive, p);
            }
            this.mouseActive = null;
        }
    };
    World.prototype.onMouseMove = function (p) {
        if (this.mouseActive === null) {
            this.mouseFocus = this.findEntityAt(p);
        }
    };
    World.prototype.applyEntities = function (f, collider0) {
        if (collider0 === void 0) { collider0 = null; }
        for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
            var entity1 = _a[_i];
            if (!entity1.isRunning())
                continue;
            if (collider0 !== null) {
                var collider1 = entity1.getCollider();
                if (collider1 !== null && !collider1.overlaps(collider0))
                    continue;
            }
            if (f(entity1)) {
                return entity1;
            }
        }
        return null;
    };
    World.prototype.sortEntitiesByOrder = function () {
        this.entities.sort(function (a, b) { return a.order - b.order; });
    };
    World.prototype.getEntityColliders = function (f0, range) {
        if (range === void 0) { range = null; }
        var a = [];
        var f = function (entity) {
            if (f0(entity)) {
                var collider = entity.getCollider();
                if (collider != null) {
                    a.push(collider);
                }
            }
            return false;
        };
        this.applyEntities(f, range);
        return a;
    };
    World.prototype.checkEntityCollisions = function () {
        this.applyEntityPairs(function (e0, e1) {
            e0.onCollided(e1);
            e1.onCollided(e0);
        });
    };
    World.prototype.applyEntityPairs = function (f) {
        for (var i = 0; i < this.entities.length; i++) {
            var entity0 = this.entities[i];
            if (!entity0.isRunning())
                continue;
            var collider0 = entity0.getCollider();
            if (collider0 === null)
                continue;
            for (var j = i + 1; j < this.entities.length; j++) {
                var entity1 = this.entities[j];
                if (!entity1.isRunning())
                    continue;
                var collider1 = entity1.getCollider();
                if (collider1 === null)
                    continue;
                if (collider0.overlaps(collider1)) {
                    f(entity0, entity1);
                }
            }
        }
    };
    return World;
}(ParallelTaskList));
//  Scene
//
var Scene = /** @class */ (function () {
    function Scene() {
        this.screen = new Rect(0, 0, APP.canvas.width, APP.canvas.height);
    }
    Scene.prototype.changeScene = function (scene) {
        APP.post(function () { APP.init(scene); });
    };
    Scene.prototype.reset = function () {
        this.onStop();
        this.onStart();
    };
    Scene.prototype.onStart = function () {
        // [OVERRIDE]
    };
    Scene.prototype.onStop = function () {
        // [OVERRIDE]
    };
    Scene.prototype.onTick = function () {
        // [OVERRIDE]
    };
    Scene.prototype.render = function (ctx) {
        // [OVERRIDE]
    };
    Scene.prototype.onDirChanged = function (v) {
        // [OVERRIDE]
    };
    Scene.prototype.onButtonPressed = function (keysym) {
        // [OVERRIDE]
    };
    Scene.prototype.onButtonReleased = function (keysym) {
        // [OVERRIDE]
    };
    Scene.prototype.onKeyDown = function (key) {
        // [OVERRIDE]
    };
    Scene.prototype.onKeyUp = function (key) {
        // [OVERRIDE]
    };
    Scene.prototype.onKeyPress = function (char) {
        // [OVERRIDE]
    };
    Scene.prototype.onMouseDown = function (p, button) {
        // [OVERRIDE]
    };
    Scene.prototype.onMouseUp = function (p, button) {
        // [OVERRIDE]
    };
    Scene.prototype.onMouseMove = function (p) {
        // [OVERRIDE]
    };
    Scene.prototype.onFocus = function () {
        // [OVERRIDE]
    };
    Scene.prototype.onBlur = function () {
        // [OVERRIDE]
    };
    return Scene;
}());
//  HTMLScene
//
var HTMLScene = /** @class */ (function (_super) {
    __extends(HTMLScene, _super);
    function HTMLScene(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    HTMLScene.prototype.onStart = function () {
        _super.prototype.onStart.call(this);
        var scene = this;
        var bounds = APP.elem.getBoundingClientRect();
        var e = APP.addElement(new Rect(bounds.width / 8, bounds.height / 4, 3 * bounds.width / 4, bounds.height / 2));
        e.align = 'left';
        e.style.padding = '10px';
        e.style.color = 'black';
        e.style.background = 'white';
        e.style.border = 'solid black 2px';
        e.innerHTML = this.text;
        e.onmousedown = (function (e) { scene.onChanged(); });
    };
    HTMLScene.prototype.render = function (ctx) {
        ctx.fillStyle = 'rgb(0,0,0)';
        fillRect(ctx, this.screen);
    };
    HTMLScene.prototype.onChanged = function () {
        // [OVERRIDE]
    };
    HTMLScene.prototype.onMouseDown = function (p, button) {
        this.onChanged();
    };
    HTMLScene.prototype.onKeyDown = function (key) {
        this.onChanged();
    };
    return HTMLScene;
}(Scene));
//  GameScene
//
var GameScene = /** @class */ (function (_super) {
    __extends(GameScene, _super);
    function GameScene() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.world = null;
        return _this;
    }
    GameScene.prototype.onStart = function () {
        _super.prototype.onStart.call(this);
        this.world = new World(this.screen);
        this.world.onStart();
    };
    GameScene.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        this.world.onTick();
    };
    GameScene.prototype.render = function (ctx) {
        _super.prototype.render.call(this, ctx);
        this.world.render(ctx);
    };
    GameScene.prototype.add = function (task) {
        this.world.add(task);
    };
    GameScene.prototype.remove = function (task) {
        this.world.remove(task);
    };
    GameScene.prototype.onMouseDown = function (p, button) {
        _super.prototype.onMouseDown.call(this, p, button);
        this.world.onMouseDown(p, button);
    };
    GameScene.prototype.onMouseUp = function (p, button) {
        _super.prototype.onMouseUp.call(this, p, button);
        this.world.onMouseUp(p, button);
    };
    GameScene.prototype.onMouseMove = function (p) {
        _super.prototype.onMouseMove.call(this, p);
        this.world.onMouseMove(p);
    };
    return GameScene;
}(Scene));
/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="text.ts" />
/// <reference path="scene.ts" />
/** Initial gap of lame-encded MP3 files */
var MP3_GAP = 0.025;
function getprops(a) {
    var d = {};
    for (var i = 0; i < a.length; i++) {
        d[a[i].id] = a[i];
    }
    return d;
}
//  App
//  handles the event loop and global state management.
//  It also has shared resources (images, sounds, etc.)
//
var App = /** @class */ (function () {
    function App(size, framerate, elem) {
        this.scene = null;
        this.active = false;
        this.keys = {};
        this.keyDir = new Vec2();
        this.mousePos = new Vec2();
        this.mouseButton = false;
        this._keylock = 0;
        this._msgs = [];
        this._music = null;
        this._loop_start = 0;
        this._loop_end = 0;
        this._touch_id = null;
        this.size = size;
        this.framerate = framerate;
        this.elem = elem;
        // Initialize the off-screen bitmap.
        this.canvas = createCanvas(this.size.x, this.size.y);
        this.ctx = getEdgeyContext(this.canvas);
        // WebAudio!
        try {
            this.audioContext = new AudioContext();
        }
        catch (e) {
            this.audioContext = null;
        }
        // Resources;
        this.images = getprops(document.getElementsByTagName('img'));
        this.sounds = getprops(document.getElementsByTagName('audio'));
        this.labels = getprops(document.getElementsByClassName('label'));
    }
    App.prototype.init = function (scene) {
        removeChildren(this.elem, 'div');
        this.setMusic();
        if (this.scene !== null) {
            this.scene.onStop();
        }
        this.scene = scene;
        this.scene.onStart();
    };
    App.prototype.post = function (msg) {
        this._msgs.push(msg);
    };
    App.prototype.addElement = function (bounds) {
        var e = document.createElement('div');
        e.style.position = 'absolute';
        e.style.left = bounds.x + 'px';
        e.style.top = bounds.y + 'px';
        e.style.width = bounds.width + 'px';
        e.style.height = bounds.height + 'px';
        e.style.padding = '0px';
        this.elem.appendChild(e);
        return e;
    };
    App.prototype.removeElement = function (e) {
        e.parentNode.removeChild(e);
    };
    App.prototype.lockKeys = function (t) {
        if (t === void 0) { t = 1; }
        this._keylock = getTime() + t;
    };
    App.prototype.keyDown = function (ev) {
        if (0 < this._keylock)
            return;
        var keysym = getKeySym(ev.keyCode);
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
                    case 112: // F1
                        break;
                    case 27: // ESC
                        if (this.active) {
                            this.blur();
                        }
                        else {
                            this.focus();
                        }
                        break;
                }
                break;
        }
        this.keys[keysym] = true;
        this.scene.onKeyDown(ev.keyCode);
    };
    App.prototype.keyUp = function (ev) {
        var keysym = getKeySym(ev.keyCode);
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
    };
    App.prototype.keyPress = function (ev) {
        this.scene.onKeyPress(ev.charCode);
    };
    App.prototype.updateMousePos = function (ev) {
        var bounds = this.elem.getBoundingClientRect();
        this.mousePos = new Vec2((ev.clientX - bounds.left) * this.canvas.width / bounds.width, (ev.clientY - bounds.top) * this.canvas.height / bounds.height);
    };
    App.prototype.mouseDown = function (ev) {
        this.updateMousePos(ev);
        switch (ev.button) {
            case 0:
                this.mouseButton = true;
                break;
        }
        this.scene.onMouseDown(this.mousePos, ev.button);
    };
    App.prototype.mouseUp = function (ev) {
        this.updateMousePos(ev);
        switch (ev.button) {
            case 0:
                this.mouseButton = false;
                break;
        }
        this.scene.onMouseUp(this.mousePos, ev.button);
    };
    App.prototype.mouseMove = function (ev) {
        this.updateMousePos(ev);
        this.scene.onMouseMove(this.mousePos);
    };
    App.prototype.touchStart = function (ev) {
        var touches = ev.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var t = touches[i];
            if (this._touch_id === null) {
                this._touch_id = t.identifier;
                this.mouseButton = true;
                this.updateMousePos(t);
                this.scene.onMouseDown(this.mousePos, 0);
            }
        }
    };
    App.prototype.touchEnd = function (ev) {
        var touches = ev.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var t = touches[i];
            if (this._touch_id !== null) {
                this._touch_id = null;
                this.mouseButton = false;
                this.updateMousePos(t);
                this.scene.onMouseUp(this.mousePos, 0);
            }
        }
    };
    App.prototype.touchMove = function (ev) {
        var touches = ev.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var t = touches[i];
            if (this._touch_id == t.identifier) {
                this.updateMousePos(t);
                this.scene.onMouseMove(this.mousePos);
            }
        }
    };
    App.prototype.focus = function () {
        this.active = true;
        if (this._music !== null && 0 < this._music.currentTime) {
            this._music.play();
        }
        this.scene.onFocus();
    };
    App.prototype.blur = function () {
        this.scene.onBlur();
        if (this._music !== null) {
            this._music.pause();
        }
        this.active = false;
    };
    App.prototype.tick = function () {
        this.scene.onTick();
        if (0 < this._keylock && this._keylock < getTime()) {
            this._keylock = 0;
        }
        if (this._music !== null &&
            this._loop_start < this._loop_end &&
            this._loop_end <= this._music.currentTime) {
            this._music.currentTime = this._loop_start;
        }
        while (0 < this._msgs.length) {
            var msg = this._msgs.shift();
            msg();
        }
    };
    App.prototype.repaint = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.scene.render(this.ctx);
        this.ctx.restore();
    };
    App.prototype.setMusic = function (name, start, end) {
        if (name === void 0) { name = null; }
        if (start === void 0) { start = MP3_GAP; }
        if (end === void 0) { end = 0; }
        if (this._music !== null) {
            this._music.pause();
        }
        if (name === null) {
            this._music = null;
        }
        else {
            var sound = this.sounds[name];
            this._loop_start = start;
            this._loop_end = (end < 0) ? sound.duration : end;
            if (0 < sound.readyState) { // for IE bug
                sound.currentTime = MP3_GAP;
            }
            this._music = sound;
            this._music.play();
        }
    };
    /** Play a sound resource.
     * @param sound Sound name.
     * @param start Start position.
     */
    App.prototype.playSound = function (name, start) {
        if (start === void 0) { start = MP3_GAP; }
        var elem = this.sounds[name];
        elem.currentTime = start;
        elem.play();
    };
    return App;
}());
//  Global hook.
var HOOKS = [];
// addInitHook: adds an initialization hoook.
function addInitHook(hook) {
    HOOKS.push(hook);
}
var APP = null;
// main: sets up the browser interaction.
function main(scene0, width, height, elemId, framerate) {
    if (width === void 0) { width = 320; }
    if (height === void 0) { height = 240; }
    if (elemId === void 0) { elemId = 'game'; }
    if (framerate === void 0) { framerate = 30; }
    var elem = document.getElementById(elemId);
    var size = new Vec2(width, height);
    var app = new App(size, framerate, elem);
    var canvas = app.canvas;
    function tick() {
        if (app.active) {
            app.tick();
            app.repaint();
        }
    }
    function keydown(e) {
        if (app.active) {
            switch (e.keyCode) {
                case 17: // Control
                case 18: // Meta
                    break;
                default:
                    app.keyDown(e);
                    break;
            }
            switch (e.keyCode) {
                case 8: // Backspace
                case 9: // Tab
                case 13: // Return
                case 14: // Enter
                case 32: // Space
                case 33: // PageUp
                case 34: // PageDown
                case 35: // End
                case 36: // Home
                case 37: // Left
                case 38: // Up
                case 39: // Right
                case 40: // Down
                    e.preventDefault();
                    break;
            }
        }
    }
    function keyup(e) {
        if (app.active) {
            switch (e.keyCode) {
                case 17: // Control
                case 18: // Meta
                    break;
                default:
                    app.keyUp(e);
                    break;
            }
        }
    }
    function keypress(e) {
        if (app.active) {
            app.keyPress(e);
        }
    }
    function mousedown(e) {
        if (app.active) {
            app.mouseDown(e);
        }
    }
    function mouseup(e) {
        if (app.active) {
            app.mouseUp(e);
        }
    }
    function mousemove(e) {
        if (app.active) {
            app.mouseMove(e);
        }
    }
    function touchstart(e) {
        if (app.active) {
            app.touchStart(e);
            e.preventDefault();
        }
    }
    function touchend(e) {
        if (app.active) {
            app.touchEnd(e);
            e.preventDefault();
        }
    }
    function touchmove(e) {
        if (app.active) {
            app.touchMove(e);
            e.preventDefault();
        }
    }
    function focus(e) {
        info("app.focus");
        if (!app.active) {
            app.focus();
        }
    }
    function blur(e) {
        info("app.blur");
        if (app.active) {
            app.blur();
        }
        var size = Math.min(canvas.width, canvas.height) / 8;
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,64, 0.5)'; // gray out.
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'lightgray';
        ctx.beginPath(); // draw a play button.
        ctx.moveTo(canvas.width / 2 - size, canvas.height / 2 - size);
        ctx.lineTo(canvas.width / 2 - size, canvas.height / 2 + size);
        ctx.lineTo(canvas.width / 2 + size, canvas.height / 2);
        ctx.fill();
        ctx.restore();
    }
    function resize(e) {
        info("app.resize");
        var bounds = elem.getBoundingClientRect();
        // Center the canvas.
        var cw = bounds.width, ch = bounds.height;
        if (canvas.height * bounds.width < canvas.width * bounds.height) {
            ch = int(canvas.height * bounds.width / canvas.width);
        }
        else {
            cw = int(canvas.width * bounds.height / canvas.height);
        }
        canvas.style.position = 'absolute';
        canvas.style.padding = '0px';
        canvas.style.left = ((bounds.width - cw) / 2) + 'px';
        canvas.style.top = ((bounds.height - ch) / 2) + 'px';
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
    }
    APP = app;
    if (APP.audioContext !== null) {
        for (var id in APP.sounds) {
            var source = APP.audioContext.createMediaElementSource(APP.sounds[id]);
            source.connect(APP.audioContext.destination);
        }
    }
    for (var _i = 0, HOOKS_1 = HOOKS; _i < HOOKS_1.length; _i++) {
        var hook = HOOKS_1[_i];
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
    window.setInterval(tick, 1000 / framerate);
    window.focus();
}
/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/sprite.ts" />
/// <reference path="../../../base/entity.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />
//  Pseudo3d
//
//  A advanced example that extends Entity class to handle
//  pseudo-3d objects.
//
// getContact3: performs collision detection for given Boxes.
var GROUND = new AAPlane(new Vec3(-Infinity, -Infinity, 0), new Vec3(+Infinity, +Infinity, 0));
function getContact3(hitbox, v, obstacles) {
    for (var _i = 0, obstacles_2 = obstacles; _i < obstacles_2.length; _i++) {
        var box = obstacles_2[_i];
        v = box.contactBox(v, hitbox);
    }
    return GROUND.contactBox(v, hitbox);
}
//  ShadowSprite3
//
var ShadowSprite3 = /** @class */ (function () {
    function ShadowSprite3() {
        this.dz = 0;
        this.shadow = SPRITES.get(S.SHADOW);
    }
    ShadowSprite3.prototype.getBounds = function () {
        return this.shadow.getBounds();
    };
    ShadowSprite3.prototype.render = function (ctx) {
        var shadow = this.shadow;
        var srcRect = shadow.srcRect;
        var dstRect = shadow.getBounds();
        var d = this.dz / 4;
        if (d * 2 <= dstRect.width && d * 2 <= dstRect.height) {
            ctx.drawImage(shadow.image, srcRect.x, srcRect.y, srcRect.width, srcRect.height, dstRect.x + d, dstRect.y + d + this.dz / 2, dstRect.width - d * 2, dstRect.height - d * 2);
        }
    };
    return ShadowSprite3;
}());
//  Entity3d
//
var Entity3d = /** @class */ (function (_super) {
    __extends(Entity3d, _super);
    function Entity3d() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.world3 = null;
        _this.shadow3 = null;
        _this.z = 0;
        _this.depth = 0;
        _this.velocity3 = new Vec3();
        _this.maxspeed3 = new Vec3();
        return _this;
    }
    Entity3d.prototype.getPos3 = function () {
        return new Vec3(this.pos.x, this.pos.y, this.z);
    };
    Entity3d.prototype.isFloating = function () {
        // [OVERRIDE]
        return false;
    };
    Entity3d.prototype.movePos3 = function (v) {
        this.pos = this.pos.move(v.x, v.y);
        this.z += v.z;
    };
    Entity3d.prototype.getCollider3 = function (pos3) {
        if (pos3 === void 0) { pos3 = null; }
        var pos = (pos3 !== null) ? new Vec2(pos3.x, pos3.y) : this.pos;
        var z = (pos3 !== null) ? pos3.z : this.z;
        var bounds = this.getCollider(pos).getAABB();
        return new Box(new Vec3(bounds.x, bounds.y, z), new Vec3(bounds.width, bounds.height, this.depth));
    };
    Entity3d.prototype.canMove3 = function (v0, context) {
        if (context === void 0) { context = null; }
        var v1 = this.getMove3(this.getPos3(), v0, context);
        return v1.equals(v0);
    };
    Entity3d.prototype.getMove3 = function (pos, v, context) {
        if (context === void 0) { context = null; }
        var collider0 = this.getCollider3(pos);
        var collider1 = collider0;
        var range = collider1.union(collider1.add(v));
        var obstacles = this.getObstaclesFor3(range, v, context);
        var d = getContact3(collider1, v, obstacles);
        v = v.sub(d);
        collider1 = collider1.add(d);
        if (v.x != 0) {
            d = getContact3(collider1, new Vec3(v.x, 0, 0), obstacles);
            v = v.sub(d);
            collider1 = collider1.add(d);
        }
        if (v.y != 0) {
            d = getContact3(collider1, new Vec3(0, v.y, 0), obstacles);
            v = v.sub(d);
            collider1 = collider1.add(d);
        }
        if (v.z != 0) {
            d = getContact3(collider1, new Vec3(0, 0, v.z), obstacles);
            v = v.sub(d);
            collider1 = collider1.add(d);
        }
        return collider1.origin.sub(collider0.origin);
    };
    Entity3d.prototype.getObstaclesFor3 = function (range, v, context) {
        return null;
    };
    Entity3d.prototype.moveIfPossible3 = function (v, context) {
        if (context === void 0) { context = null; }
        v = this.getMove3(this.getPos3(), v, context);
        this.movePos3(v);
        return v;
    };
    Entity3d.prototype.render = function (ctx) {
        // [DISABLED]
    };
    Entity3d.prototype.render3 = function (ctx, floating) {
        if (this.isFloating() != floating)
            return;
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y - this.z / 2);
        if (this.shadow3 !== null) {
            this.shadow3.render(ctx);
        }
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.render(ctx);
        }
        ctx.restore();
    };
    return Entity3d;
}(Entity));
//  World3
//
var World3 = /** @class */ (function (_super) {
    __extends(World3, _super);
    function World3() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.tilemap = null;
        _this.tiles = null;
        return _this;
    }
    World3.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this.entities3 = [];
    };
    World3.prototype.add = function (task) {
        _super.prototype.add.call(this, task);
        if (task instanceof Entity3d) {
            task.world3 = this;
            this.entities3.push(task);
        }
    };
    World3.prototype.remove = function (task) {
        if (task instanceof Entity) {
            removeElement(this.entities3, task);
        }
        _super.prototype.remove.call(this, task);
    };
    World3.prototype.render = function (ctx) {
        var _this = this;
        var ts = this.tilemap.tilesize;
        var window = this.window;
        // Set the drawing order.
        var ents = {};
        for (var _i = 0, _a = this.entities3; _i < _a.length; _i++) {
            var entity3 = _a[_i];
            if (!entity3.isVisible())
                continue;
            var pos = entity3.pos;
            if (pos !== null) {
                var x = int(pos.x / ts);
                var y = int(pos.y / ts);
                var k = x + ',' + y;
                if (!ents.hasOwnProperty(k)) {
                    ents[k] = [];
                }
                ents[k].push(entity3);
            }
        }
        ctx.save();
        ctx.translate(-ts, 0);
        // Render the background tiles.
        this.tilemap.renderWindowFromTopRight(ctx, window, function (x, y, c) { return (c == 0) ? _this.tiles.get(c) : null; });
        // Render the tiles and landed objects.
        this.tilemap.renderWindowFromTopRight(ctx, window, function (x, y, c) {
            var k = x + ',' + y;
            if (ents.hasOwnProperty(k)) {
                for (var _i = 0, _a = ents[k]; _i < _a.length; _i++) {
                    var entity3 = _a[_i];
                    entity3.render3(ctx, false);
                }
            }
            return (c == 0) ? null : _this.tiles.get(c);
        });
        // Render the floating objects.
        this.tilemap.renderWindowFromTopRight(ctx, window, function (x, y, c) {
            var k = x + ',' + y;
            if (ents.hasOwnProperty(k)) {
                for (var _i = 0, _a = ents[k]; _i < _a.length; _i++) {
                    var entity3 = _a[_i];
                    entity3.render3(ctx, true);
                }
            }
            return null;
        });
        ctx.restore();
        // Draw ordinary 2D objects.
        _super.prototype.render.call(this, ctx);
    };
    return World3;
}(World));
var T;
(function (T) {
    T[T["NONE"] = 0] = "NONE";
    T[T["BLOCK"] = 1] = "BLOCK";
    T[T["WALL"] = 2] = "WALL";
    T[T["THINGY"] = 3] = "THINGY";
})(T || (T = {}));
var S;
(function (S) {
    S[S["PLAYER"] = 0] = "PLAYER";
    S[S["SHADOW"] = 1] = "SHADOW";
    S[S["THINGY"] = 2] = "THINGY";
    S[S["YAY"] = 3] = "YAY";
})(S || (S = {}));
//  Initialize the resources.
var FONT;
var SPRITES;
var TILES;
var isBlock = function (c) { return c == T.BLOCK; };
var isWall = function (c) { return c == T.WALL; };
addInitHook(function () {
    FONT = new ShadowFont(APP.images['font'], 'white'),
        SPRITES = new ImageSpriteSheet(APP.images['sprites'], new Vec2(32, 32), new Vec2(16, 16));
    TILES = new ImageSpriteSheet(APP.images['tiles'], new Vec2(48, 48), new Vec2(0, 8));
});
//  Thingy
//
var Thingy = /** @class */ (function (_super) {
    __extends(Thingy, _super);
    function Thingy(pos) {
        var _this = _super.call(this, pos) || this;
        var sprite = SPRITES.get(S.THINGY);
        _this.sprites = [sprite];
        _this.collider = sprite.getBounds().inflate(-4, -4);
        _this.shadow3 = new ShadowSprite3();
        _this.z = 4;
        return _this;
    }
    return Thingy;
}(Entity3d));
//  Player
//
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    function Player(tilemap, pos) {
        var _this = _super.call(this, pos) || this;
        _this.tilemap = tilemap;
        _this.picked = new Signal(_this);
        var sprite = SPRITES.get(S.PLAYER);
        _this.sprites = [sprite];
        _this.collider = sprite.getBounds().inflate(-4, -4);
        _this.depth = _this.tilemap.tilesize;
        _this.shadow3 = new ShadowSprite3();
        _this.maxspeed3 = new Vec3(16, 16, 16);
        _this.jumpfunc3 = function (vz, t) {
            return (0 <= t && t <= 7) ? 8 : vz - 2;
        };
        _this.usermove3 = new Vec3();
        return _this;
    }
    Player.prototype.isFloating = function () {
        return (this.tilemap.tilesize / 2 < this.z);
    };
    Player.prototype.getObstaclesFor3 = function (range, v, context) {
        var window = this.world3.window;
        var ts = this.tilemap.tilesize;
        var bs = new Vec3(ts, ts, ts);
        var ws = new Vec3(ts, ts, Infinity);
        var boxes = [new Box(new Vec3(window.x1() - ts, 0, 0), new Vec3(ts, window.height, Infinity))];
        var f = function (x, y, c) {
            if (isBlock(c)) {
                boxes.push(new Box(new Vec3(x * ts, y * ts, 0), bs));
            }
            else if (isWall(c)) {
                boxes.push(new Box(new Vec3(x * ts, y * ts, 0), ws));
            }
            return false;
        };
        var area = new Rect(range.origin.x, range.origin.y, range.size.x, range.size.y);
        this.tilemap.apply(f, this.tilemap.coord2map(area));
        return boxes;
    };
    Player.prototype.canJump3 = function () {
        return (0 <= this.velocity3.z && !this.canMove3(new Vec3(0, 0, -1)));
    };
    Player.prototype.canFall3 = function () {
        return true;
    };
    Player.prototype.setMove = function (v) {
        this.usermove3 = new Vec3(v.x * 4, v.y * 4, 0);
    };
    Player.prototype.setJump = function (jumpend) {
        if (0 < jumpend) {
            if (this.canJump3()) {
                this._jumpt = 0;
                APP.playSound('jump');
            }
        }
        this._jumpend = jumpend;
    };
    Player.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        this.moveIfPossible3(this.usermove3);
        this.fall();
        if (this._jumpt < this._jumpend) {
            this._jumpt++;
        }
        else {
            this._jumpt = Infinity;
        }
        var z0 = 0;
        if (this.isFloating() &&
            this.tilemap.findTileByCoord(isBlock, this.getCollider().getAABB())) {
            z0 = this.tilemap.tilesize / 2;
        }
        this.shadow3.dz = this.z - z0;
        var window = this.world3.window;
        if (!window.overlaps(this.getCollider())) {
            this.stop();
        }
    };
    Player.prototype.fall = function () {
        if (this.canFall3()) {
            var vz = this.jumpfunc3(this.velocity3.z, this._jumpt);
            var v = new Vec3(this.velocity3.x, this.velocity3.y, vz);
            this.velocity3 = this.moveIfPossible3(v, 'fall').clamp(this.maxspeed3);
        }
    };
    Player.prototype.onCollided = function (entity) {
        if (entity instanceof Thingy) {
            APP.playSound('pick');
            entity.stop();
            this.picked.fire(entity);
        }
    };
    return Player;
}(Entity3d));
//  Game
//
var Game = /** @class */ (function (_super) {
    __extends(Game, _super);
    function Game() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Game.prototype.onStart = function () {
        var _this = this;
        _super.prototype.onStart.call(this);
        var ROWS = [T.WALL, 0, 0, 0, 0, 0, T.WALL];
        this.tilemap = new TileMap(32, 12, 7, ROWS.map(function (c) { return new Int32Array(12).fill(c); }));
        this.world3 = new World3(this.tilemap.bounds);
        this.world3.tilemap = this.tilemap;
        this.world3.tiles = TILES;
        this.score = 0;
        this.speed = new Vec2(2, 0);
        this.player = new Player(this.tilemap, this.world3.area.center());
        this.player.picked.subscribe(function (player, entity) {
            _this.onPicked(entity);
        });
        this.player.stopped.subscribe(function () {
            APP.lockKeys();
            APP.playSound('bomb');
            _this.changeScene(new GameOver(_this.score));
        });
        this.add(this.player);
        // show a banner.
        var banner = new BannerBox(this.screen, FONT, ['GET ALL TEH DAMN THINGIES!']);
        banner.lifetime = 2.0;
        banner.interval = 0.5;
        this.world.add(banner);
    };
    Game.prototype.add = function (task) {
        this.world3.add(task);
    };
    Game.prototype.onTick = function () {
        _super.prototype.onTick.call(this);
        this.world3.onTick();
        this.moveAll(this.speed);
    };
    Game.prototype.onDirChanged = function (v) {
        this.player.setMove(v);
    };
    Game.prototype.onButtonPressed = function (keysym) {
        this.player.setJump(Infinity);
    };
    Game.prototype.onButtonReleased = function (keysym) {
        this.player.setJump(0);
    };
    Game.prototype.onPicked = function (entity) {
        this.score += 1;
        this.speed.x += 1;
        var yay = new Particle(this.player.pos.move(-32, -16));
        yay.sprites = [SPRITES.get(S.YAY)];
        yay.movement = new Vec2(0, -4);
        yay.lifetime = 0.5;
        this.world.add(yay);
    };
    Game.prototype.render = function (ctx) {
        ctx.fillStyle = 'rgb(0,128,224)';
        fillRect(ctx, this.screen);
        ctx.save();
        ctx.translate(0, (this.screen.height - this.world3.window.height) / 2);
        this.world3.render(ctx);
        ctx.restore();
        _super.prototype.render.call(this, ctx);
    };
    Game.prototype.moveAll = function (v) {
        this.world3.moveCenter(v);
        var ts = this.tilemap.tilesize;
        var window = this.world3.window;
        var x0 = int(window.x / ts);
        var y0 = int(window.y / ts);
        if (x0 !== 0 || y0 !== 0) {
            // warp all the tiles and characters.
            this.shiftTiles(x0, y0);
            var vw = new Vec2(-x0 * ts, -y0 * ts);
            this.world3.moveCenter(vw);
            this.world3.moveAll(vw);
        }
        if (this.player.isRunning()) {
            this.player.moveIfPossible3(new Vec3(v.x, v.y, 0), 'fall');
        }
    };
    Game.prototype.shiftTiles = function (vx, vy) {
        // Generate tiles for horizontal scrolling.
        // Leftmost objects are scrolled out and rotated from right.
        for (var x = 0; x < vx; x++) {
            for (var y = 1; y < this.tilemap.height - 1; y++) {
                this.tilemap.set(x, y, T.NONE);
            }
            if (rnd(3) === 0) {
                var y = rnd(1, this.tilemap.height - 1);
                this.tilemap.set(x, y, T.BLOCK);
            }
            if (rnd(10) === 0) {
                var y = rnd(1, this.tilemap.height - 1);
                this.tilemap.set(x, y, T.WALL);
            }
            if (rnd(3) === 0) {
                var y = rnd(1, this.tilemap.height - 1);
                var p = new Vec2(x + this.tilemap.width, y);
                var rect = this.tilemap.map2coord(p);
                this.add(new Thingy(rect.center()));
                this.tilemap.set(x, y, T.NONE);
            }
        }
        this.tilemap.shift(-vx, -vy);
    };
    return Game;
}(GameScene));
//  GameOver
//
var GameOver = /** @class */ (function (_super) {
    __extends(GameOver, _super);
    function GameOver(score) {
        var _this = this;
        var html = "<strong>Game Over!</strong><p>Score: " + score;
        _this = _super.call(this, html) || this;
        return _this;
    }
    GameOver.prototype.change = function () {
        this.changeScene(new Game());
    };
    return GameOver;
}(HTMLScene));
