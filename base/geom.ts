/// <reference path="utils.ts" />

/** 
 * Geometric objects and functions.
 */


/** Sufficiently small number that can be considered as zero. */
const EPSILON = 0.0001;


/**  Vec2
 *   2-element vector that can be used for a position or size.
 */
class Vec2 {

    x: number;
    y: number;

    constructor(x=0, y=0) {
	this.x = x;
	this.y = y;
    }

    toString() {
	return '('+this.x+', '+this.y+')';
    }

    /** Returns a copy of the object. */
    copy(): Vec2 {
	return new Vec2(this.x, this.y);
    }
    
    /** Returns true if p is equivalent to the object. */
    equals(p: Vec2): boolean {
	return (this.x == p.x && this.y == p.y);
    }
    
    /** Returns true if p.x == 0 and p.y == 0. */
    isZero(): boolean {
	return (this.x == 0 && this.y == 0);
    }
    
    /** Returns the squared length of the vector. */
    len2(): number {
	return (this.x*this.x + this.y*this.y);
    }
    
    /** Returns the length of the vector. */
    len(): number {
	return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    
    /** Returns a new vector consisting of the sign of each element. */
    sign(): Vec2 {
	return new Vec2(sign(this.x), sign(this.y));
    }
    
    /** Returns a new vector (this + v). */
    add(v: Vec2): Vec2 {
	return new Vec2(this.x+v.x, this.y+v.y);
    }
    
    /** Returns a new vector (this - v). */
    sub(v: Vec2): Vec2 {
	return new Vec2(this.x-v.x, this.y-v.y);
    }
    
    /** Returns a new scaled vector by n. */
    scale(n: number): Vec2 {
	return new Vec2(this.x*n, this.y*n);
    }
    
    /** Returns |this - p|. */
    distance(p: Vec2): number {
	return this.sub(p).len();
    }

    /** Clamp the position within a given rectangle. */
    clamp(bounds: Vec2): Vec2 {
	return new Vec2(
	    clamp(-bounds.x, this.x, +bounds.x),
	    clamp(-bounds.y, this.y, +bounds.y));
    }
    
    /** Returns a new point that is moved by (dx, dy). */
    move(dx: number, dy: number): Vec2 {
	return new Vec2(this.x+dx, this.y+dy);
    }

    /** Returns a new interpolated vector between this and p. 
     * @param p The other point.
     * @param t Interpolation value. 
     *          When t=0.0 the new vector would be the same as this.
     *          When t=1.0 the new vector would be the same as p.
     */
    interpolate(p: Vec2, t: number): Vec2 {
	return new Vec2((1.0-t)*this.x+t*p.x, (1.0-t)*this.y+t*p.y);
    }
    
    /** Returns a new vector rotated clockwise by d radian. */
    rotate(d: number): Vec2 {
	let s = Math.sin(d);
	let c = Math.cos(d);
	return new Vec2(this.x*c-this.y*s, this.x*s+this.y*c);
    }
    
    /** Returns a new vector rotated clockwise by d*90 degree. */
    rot90(d: number): Vec2 {
	d = d % 4;
	d = (0 <= d)? d : d+4;
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
    }
    
    /** Create a new rectangle based on this point. 
     * @param dw Width.
     * @param dh Height.
     * @param anchor Anchor point.
     */
    expand(dw: number, dh: number, anchor='c'): Rect {
	return new Rect(this.x, this.y).expand(dw, dh, anchor);
    }
    
}


/**  Vec3
 *   3-element vector that can be used for a position or size.
 */
class Vec3 {

    x: number;
    y: number;
    z: number;

    constructor(x=0, y=0, z=0) {
	this.x = x;
	this.y = y;
	this.z = z;
    }
    
    toString() {
	return '('+this.x+', '+this.y+', '+this.z+')';
    }
    
    /** Returns a copy of the object. */
    copy(): Vec3 {
	return new Vec3(this.x, this.y, this.z);
    }
    
    /** Returns true if p is equivalent to the object. */
    equals(p: Vec3): boolean {
	return (this.x == p.x && this.y == p.y && this.z == p.z);
    }
    
    /** Returns true if p.x == 0, p.y == 0 and p.z == 0. */
    isZero(): boolean {
	return (this.x == 0 && this.y == 0 && this.z == 0);
    }
    
    /** Returns the squared length of the vector. */
    len2(): number {
	return (this.x*this.x + this.y*this.y + this.z*this.z);
    }
    
    /** Returns the length of the vector. */
    len(): number {
	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    }
    
    /** Returns a new vector consisting of the sign of each element. */
    sign(): Vec3 {
	return new Vec3(sign(this.x), sign(this.y), sign(this.z));
    }
    
    /** Returns a new vector (this + v). */
    add(v: Vec3): Vec3 {
	return new Vec3(this.x+v.x, this.y+v.y, this.z+v.z);
    }
    
    /** Returns a new vector (this - v). */
    sub(v: Vec3): Vec3 {
	return new Vec3(this.x-v.x, this.y-v.y, this.z-v.z);
    }
    
    /** Returns a new scaled vector by n. */
    scale(n: number): Vec3 {
	return new Vec3(this.x*n, this.y*n, this.z*n);
    }
    
    /** Returns |this - p|. */
    distance(p: Vec3): number {
	return this.sub(p).len();
    }
    
    /** Clamp the position within a given rectangle. */
    clamp(bounds: Vec3): Vec3 {
	return new Vec3(
	    clamp(-bounds.x, this.x, +bounds.x),
	    clamp(-bounds.y, this.y, +bounds.y),
	    clamp(-bounds.z, this.z, +bounds.z));
    }
    
    /** Returns a new point that is moved by (dx, dy, dz). */
    move(dx: number, dy: number, dz: number): Vec3 {
	return new Vec3(this.x+dx, this.y+dy, this.z+dz);
    }

    /** Returns a new interpolated vector between this and p. 
     * @param p The other point.
     * @param t Interpolation value. 
     *          When t=0.0 the new vector would be the same as this.
     *          When t=1.0 the new vector would be the same as p.
     */
    interpolate(p: Vec3, t: number): Vec3 {
	return new Vec3(
	    (1.0-t)*this.x+t*p.x,
	    (1.0-t)*this.y+t*p.y,
	    (1.0-t)*this.z+t*p.z);
    }
    
}


/**  Collider
 *   Abstract geometric object that can be used for hit detection.
 */
interface Collider {
    /** Returns a copy of the object. */
    copy(): Collider;
    /** Returns a new object that is moved by (dx, dy). */
    move(dx: number, dy: number): Collider;
    /** Returns a new object that is moved by v. */
    add(v: Vec2): Collider;
    /** Returns a new object that is moved by -v. */
    sub(v: Vec2): Collider;
    /** Returns true if the given object is equivalent to this object. */
    equals(collider: Collider): boolean;
    /** Returns true if the given object is overlapping with this object. */
    overlaps(collider: Collider): boolean;
    /** Trims a vector so that the given object does not collide with this object. */
    contact(v: Vec2, collider: Collider): Vec2;
    /** Returns an AABB (Axis-Aligned Boundary Box) of this object. */
    getAABB(): Rect;
}


/**  Shape
 *   Abstract enclosed shape.
 */
interface Shape extends Collider {
    /** Returns true if the object is empty. */
    isZero(): boolean;
    /** Returns true if the point is contained within this object. */
    containsPt(p: Vec2): boolean;
    /** Returns a point on the contour. */
    edgePt(t: number): Vec2;
    /** Returns a random point inside the object. */
    rndPt(): Vec2;
    /** Returns a random point on the edge of the object. */
    rndPtEdge(): Vec2;
}


/**  AALine
 *   Axis-aligned line
 */
class AALine implements Collider {

    x0: number;
    y0: number;
    x1: number;
    y1: number;
    
    constructor(x0: number, y0: number, x1: number, y1: number) {
	this.x0 = x0;	
	this.y0 = y0;	
	this.x1 = x1;	
	this.y1 = y1;	
    }
    
    /** Returns a copy of the object. */
    copy(): AALine {
	return new AALine(this.x0, this.y0, this.x1, this.y1);
    }
    
    /** Returns true if line is equivalent to the object. */
    equals(line: AALine): boolean {
	return (this.x0 == line.x0 && this.y0 == line.y0 &&
		this.x1 == line.x1 && this.y1 == line.y1);
    }
    
    /** Returns a new AALine that is moved by (dx, dy). */
    move(dx: number, dy: number): AALine {
	return new AALine(this.x0+dx, this.y0+dy, this.x1+dx, this.y1+dy);
    }
    
    /** Returns a new AALine that is moved by v. */
    add(v: Vec2): AALine {
	return new AALine(this.x0+v.x, this.y0+v.y, this.x1+v.x, this.y1+v.y);
    }
    
    /** Returns a new AALine that is moved by -v. */
    sub(v: Vec2): AALine {
	return new AALine(this.x0-v.x, this.y0-v.y, this.x1-v.x, this.y1-v.y);
    }
    
    /** Returns true if the given object is overlapping with this line. */
    overlaps(collider: Collider): boolean {
	if (collider instanceof Rect) {
	    return this.overlapsRect(collider);
	} else if (collider instanceof Circle) {
	    return this.overlapsCircle(collider);
	} else {
	    return false;
	}
    }

    /** Returns true if the rect is overlapping with this line. */
    overlapsRect(rect: Rect): boolean {
	return !(this.x1 < rect.x || this.y1 < rect.y ||
		 rect.x1() < this.x0 || rect.y1() < this.y0);
    }
    
    /** Returns true if the circle is overlapping with this line. */
    overlapsCircle(circle: Circle): boolean {
	if (this.x1 <= circle.center.x-circle.radius ||
	    this.y1 <= circle.center.y-circle.radius ||
	    circle.center.x+circle.radius <= this.x0 ||
	    circle.center.y+circle.radius <= this.y0) {
	    return false;
	}
	return (this.x0 < circle.center.x && circle.center.x < this.x1 ||
		this.y0 < circle.center.y && circle.center.y < this.y1 ||
		circle.containsPt(new Vec2(this.x0, this.y0)) ||
		circle.containsPt(new Vec2(this.x1, this.y1)));
    }
    
    /** Trims a vector so that the given object does not collide with this line. */
    contact(v: Vec2, collider: Collider): Vec2 {
	if (collider instanceof Rect) {
	    return this.contactRect(v, collider);
	} else if (collider instanceof Circle) {
	    return this.contactCircle(v, collider);
	} else {
	    return v;
	}
    }

    /** Trims a vector so that the rect does not collide with this line. */
    contactRect(v: Vec2, rect: Rect): Vec2 {
	if (this.y0 == this.y1) {
	    return this.contactRectH(v, rect, this.y0);
	} else if (this.x0 == this.x1) {
	    return this.contactRectV(v, rect, this.x0);
	} else {
	    return v;
	}
    }
	
    /** Calculate a contact point when this line is horizontal. */
    private contactRectH(v: Vec2, rect: Rect, y: number): Vec2 {
	let y0 = rect.y;
	let y1 = y0+rect.height;
	let dy: number;
	if (y <= y0 && y0+v.y < y) {
	    dy = y-y0;
	} else if (y1 <= y && y < y1+v.y) {
	    dy = y-y1;
	} else {
	    return v;
	}
	let dx = v.x*dy / v.y;
	let x0 = rect.x + dx;
	let x1 = x0+rect.width;
	if (x1 < this.x0 || this.x1 < x0 ||
	    (x1 == this.x0 && v.x <= 0) ||
	    (x0 == this.x1 && 0 <= v.x)) {
	    return v;
	}
	return new Vec2(dx, dy);
    }
    
    /** Calculate a contact point when this line is vertical. */
    private contactRectV(v: Vec2, rect: Rect, x: number): Vec2 {
	let x0 = rect.x;
	let x1 = x0+rect.width;
	let dx: number;
	if (x <= x0 && x0+v.x < x) {
	    dx = x-x0;
	} else if (x1 <= x && x < x1+v.x) {
	    dx = x-x1;
	} else {
	    return v;
	}
	let dy = v.y*dx / v.x;
	let y0 = rect.y + dy;
	let y1 = y0+rect.height;
	if (y1 < this.y0 || this.y1 < y0 ||
	    (y1 == this.y0 && v.y <= 0) ||
	    (y0 == this.y1 && 0 <= v.y)) {
	    return v;
	}
	return new Vec2(dx, dy);
    }

    /** Trims a vector so that the circle does not collide with this line. */
    contactCircle(v: Vec2, circle: Circle): Vec2 {
	if (this.y0 == this.y1) {
	    return this.contactCircleH(v, circle, this.y0);
	} else if (this.x0 == this.x1) {
	    return this.contactCircleV(v, circle, this.x0);
	} else {
	    return v;
	}
    }
	
    /** Calculate a contact point when this line is horizontal. */
    private contactCircleH(v: Vec2, circle: Circle, y: number): Vec2 {
	let x = circle.center.x + v.x;
	if (this.x0 < x && x < this.x1) {
	    y += (v.y < 0)? circle.radius : -circle.radius;
	    let dy = y - circle.center.y;
	    let dt = dy / v.y;
	    if (0 <= dt && dt <= 1) {
		return new Vec2(v.x*dt, dy);
	    }
	}
	return v;
    }

    /** Calculate a contact point when this line is vertical. */
    private contactCircleV(v: Vec2, circle: Circle, x: number): Vec2 {
	let y = circle.center.y + v.y;
	if (this.y0 < y && y < this.y1) {
	    x += (v.x < 0)? circle.radius : -circle.radius;
	    let dx = x - circle.center.x;
	    let dt = dx / v.x;
	    if (0 <= dt && dt <= 1) {
		return new Vec2(dx, v.y*dt);
	    }
	}
	return v;
    }

    /** Returns the boundary box of this line. */
    getAABB(): Rect {
	return new Rect(this.x0, this.y0, this.x1-this.x0, this.y1-this.y0);
    }

    /** Returns a random point on the line. */
    rndPt(): Vec2 {
	return new Vec2(rnd(this.x0, this.x1), rnd(this.y0, this.y1));
    }
}


/**  Rect
 *   Rectangle.
 */
class Rect implements Shape {

    x: number;
    y: number;
    width: number;
    height: number;
    
    constructor(x=0, y=0, width=0, height=0) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
    }
    
    toString() {
	return '('+this.x+', '+this.y+', '+this.width+', '+this.height+')';
    }
    
    /** Returns a copy of the object. */
    copy(): Rect {
	return new Rect(this.x, this.y, this.width, this.height);
    }
    
    /** Returns true if rect is equivalent to the object. */
    equals(rect: Rect): boolean {
	return (this.x == rect.x && this.y == rect.y &&
		this.width == rect.width && this.height == rect.height);
    }
    
    /** Returns true if rect has zero or negative size. */
    isZero(): boolean {
	return (this.width <= 0 && this.height <= 0);
    }
    
    /** Returns the x-coords of the right edge of the rectangle. */
    x1(): number {
	return this.x+this.width;
    }
    /** Returns the y-coords of the bottom edge of the rectangle. */
    y1(): number {
	return this.y+this.height;
    }
    /** Returns the x-coords of the center. */
    cx(): number {
	return this.x+this.width/2;
    }
    /** Returns the y-coords of the center. */
    cy(): number {
	return this.y+this.height/2;
    }
    
    /** Returns the center of the rectangle. */
    center(): Vec2 {
	return new Vec2(this.x+this.width/2, this.y+this.height/2);
    }
    /** Returns the top left corner of the rectangle. */
    topLeft(): Vec2 {
	return new Vec2(this.x, this.y);
    }
    /** Returns the top right corner of the rectangle. */
    topRight(): Vec2 {
	return new Vec2(this.x+this.width, this.y);
    }
    /** Returns the bottom left corner of the rectangle. */
    bottomLeft(): Vec2 {
	return new Vec2(this.x, this.y+this.height);
    }
    /** Returns the bottom right corner of the rectangle. */
    bottomRight(): Vec2 {
	return new Vec2(this.x+this.width, this.y+this.height);
    }
    
    /** Returns an anchor point of the rectangle. */
    anchor(anchor: string): Vec2 {
	switch (anchor) {
	case 'nw':
	    return new Vec2(this.x, this.y);
	case 'ne':
	    return new Vec2(this.x+this.width, this.y);
	case 'sw':
	    return new Vec2(this.x, this.y+this.height);
	case 'se':
	    return new Vec2(this.x+this.width, this.y+this.height);
	case 'n':
	    return new Vec2(this.x+this.width/2, this.y);
	case 's':
	    return new Vec2(this.x+this.width/2, this.y+this.height);
	case 'e':
	    return new Vec2(this.x, this.y+this.height/2);
	case 'w':
	    return new Vec2(this.x+this.width, this.y+this.height/2);
	default:
	    return new Vec2(this.x+this.width/2, this.y+this.height/2);
	}
    }
    
    /** Returns an edge of the rectangle. */
    edge(direction: string): AALine {
	switch (direction) {
        case 'w':
	    return new AALine(this.x, this.y, this.x, this.y+this.height);
        case 'e':
	    return new AALine(this.x+this.width, this.y,
                              this.x+this.width, this.y+this.height);
        case 'n':
	    return new AALine(this.x, this.y, this.x+this.width, this.y);
        case 's':
	    return new AALine(this.x, this.y+this.height,
                              this.x+this.width, this.y+this.height);
        default:
	    return null;
	}
    }
    
    move(dx: number, dy: number): Rect {
	return new Rect(this.x+dx, this.y+dy, this.width, this.height);  
    }
    
    add(v: Vec2): Rect {
	return new Rect(this.x+v.x, this.y+v.y, this.width, this.height);  
    }
    
    sub(v: Vec2): Rect {
	return new Rect(this.x-v.x, this.y-v.y, this.width, this.height);  
    }
    
    inflate(dw: number, dh: number): Rect {
	return this.expand(dw*2, dh*2);
    }
    
    scale(n: number, anchor='c'): Rect {
        return this.expand(this.width*(n-1), this.height*(n-1), anchor);
    }
    
    expand(dw: number, dh: number, anchor='c'): Rect {
	switch (anchor) {
	case 'nw':
	    return new Rect(this.x, this.y, this.width+dw, this.height+dh);
	case 'ne':
	    return new Rect(this.x-dw, this.y, this.width+dw, this.height+dh);
	case 'sw':
	    return new Rect(this.x, this.y-dh, this.width+dw, this.height+dh);
	case 'se':
	    return new Rect(this.x-dw, this.y-dh, this.width+dw, this.height+dh);
	case 'n':
	    return new Rect(this.x-dw/2, this.y, this.width+dw, this.height+dh);
	case 's':
	    return new Rect(this.x-dw/2, this.y-dh, this.width+dw, this.height+dh);
	case 'e':
	    return new Rect(this.x-dw, this.y-dh/2, this.width+dw, this.height+dh);
	case 'w':
	    return new Rect(this.x, this.y-dh/2, this.width+dw, this.height+dh);
	default:
	    return new Rect(this.x-dw/2, this.y-dh/2, this.width+dw, this.height+dh);
	}
    }
    
    resize(w: number, h: number, anchor='c'): Rect {
	switch (anchor) {
	case 'nw':
	    return new Rect(this.x, this.y, w, h);
	case 'ne':
	    return new Rect(this.x+this.width-w, this.y, w, h);
	case 'sw':
	    return new Rect(this.x, this.y+this.height-h, w, h);
	case 'se':
	    return new Rect(this.x+this.width-w, this.y+this.height-h, w, h);
	case 'n':
	    return new Rect(this.x+(this.width-w)/2, this.y, w, h);
	case 's':
	    return new Rect(this.x+(this.width-w)/2, this.y+this.height-h, w, h);
	case 'e':
	    return new Rect(this.x, this.y+(this.height-h)/2, w, h);
	case 'w':
	    return new Rect(this.x+this.width-w, this.y+(this.height-h)/2, w, h);
	default:
	    return new Rect(this.x+(this.width-w)/2,
			    this.y+(this.height-h)/2, w, h);
	}
    }
    
    xdistance(rect: Rect): number {
	return Math.max(rect.x-(this.x+this.width),
			this.x-(rect.x+rect.width));
    }
    ydistance(rect: Rect): number {
	return Math.max(rect.y-(this.y+this.height),
			this.y-(rect.y+rect.height));
    }
    
    containsPt(p: Vec2): boolean {
	return (this.x <= p.x && this.y <= p.y &&
		p.x < this.x+this.width && p.y < this.y+this.height);
    }
    
    containsRect(rect: Rect): boolean {
	return (this.x <= rect.x &&
		this.y <= rect.y &&
		rect.x+rect.width <= this.x+this.width &&
		rect.y+rect.height <= this.y+this.height);
    }
    
    overlapsRect(rect: Rect): boolean {
	return (rect.x < this.x+this.width &&
		rect.y < this.y+this.height &&
		this.x < rect.x+rect.width &&
		this.y < rect.y+rect.height);
    }

    overlapsCircle(circle: Circle): boolean {
	let x0 = this.x;
	let x1 = this.x1();
	let y0 = this.y;
	let y1 = this.y1();
	let cx = circle.center.x;
	let cy = circle.center.y;
	let r = circle.radius;
	return (circle.containsPt(new Vec2(x0, y0)) ||
		circle.containsPt(new Vec2(x1, y0)) ||
		circle.containsPt(new Vec2(x0, y1)) ||
		circle.containsPt(new Vec2(x1, y1)) ||
		((x0 < cx && cx < x1) &&
		 (Math.abs(y0-cy) < r ||
		  Math.abs(y1-cy) < r)) ||
		((y0 < cy && cy < y1) &&
		 (Math.abs(x0-cx) < r ||
		  Math.abs(x1-cx) < r))
	       );
    }

    union(rect: Rect): Rect {
	let x0 = Math.min(this.x, rect.x);
	let y0 = Math.min(this.y, rect.y);
	let x1 = Math.max(this.x+this.width, rect.x+rect.width);
	let y1 = Math.max(this.y+this.height, rect.y+rect.height);
	return new Rect(x0, y0, x1-x0, y1-y0);
    }
    
    intersection(rect: Rect): Rect {
	let x0 = Math.max(this.x, rect.x);
	let y0 = Math.max(this.y, rect.y);
	let x1 = Math.min(this.x+this.width, rect.x+rect.width);
	let y1 = Math.min(this.y+this.height, rect.y+rect.height);
	return new Rect(x0, y0, x1-x0, y1-y0);
    }
    
    clamp(bounds: Rect): Rect {
	let x = ((bounds.width < this.width)? bounds.cx() :
		 clamp(bounds.x, this.x, bounds.x+bounds.width-this.width));
	let y = ((bounds.height < this.height)? bounds.cy() :
		 clamp(bounds.y, this.y, bounds.y+bounds.height-this.height));
	return new Rect(x, y, this.width, this.height);
    }

    edgePt(t: number): Vec2 {
	t = fmod(t, this.width*2 + this.height*2);
	if (t < this.width) {
	    return new Vec2(this.x+t, this.y);
	}
	t -= this.width;
	if (t < this.height) {
	    return new Vec2(this.x+this.width, this.y+t);
	}
	t -= this.height;
	if (t < this.width) {
	    return new Vec2(this.x+this.width-t, this.y+this.height);
	}
	// assert(t <= this.height);
	return new Vec2(this.x, this.y+this.height-t);
    }
    
    rndPt(): Vec2 {
	return new Vec2(this.x+frnd(this.width),
			this.y+frnd(this.height));
    }

    rndPtEdge(): Vec2 {
	let t = frnd(this.width*2 + this.height*2);
	return this.edgePt(t);
    }
    
    modPt(p: Vec2): Vec2 {
	return new Vec2(this.x+fmod(p.x-this.x, this.width),
			this.y+fmod(p.y-this.y, this.height));
    }
    
    contactRect(v: Vec2, rect: Rect): Vec2 {
	if (this.overlapsRect(rect)) {
	    return new Vec2();
	}
	if (0 < v.x) {
	    v = this.edge('w').contactRect(v, rect);
	} else if (v.x < 0) {
	    v = this.edge('e').contactRect(v, rect);
	}
	if (0 < v.y) {
	    v = this.edge('n').contactRect(v, rect);
	} else if (v.y < 0) {
	    v = this.edge('s').contactRect(v, rect);
	}
	return v;
    }

    contactCircle(v: Vec2, circle: Circle): Vec2 {
	if (this.overlapsCircle(circle)) {
	    return new Vec2();
	}

	if (0 < v.x) {
	    v = this.edge('w').contactCircle(v, circle);
	} else if (v.x < 0) {
	    v = this.edge('e').contactCircle(v, circle);
	}
	if (0 < v.y) {
	    v = this.edge('n').contactCircle(v, circle);
	} else if (v.y < 0) {
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
    }

    boundRect(v: Vec2, rect: Rect): Vec2 {
	if (!this.overlapsRect(rect)) {
	    return new Vec2();
	}
	let x = (v.x < 0)? this.x : this.x+this.width;
	v = new AALine(x, -Infinity, x, +Infinity).contactRect(v, rect);
	let y = (v.y < 0)? this.y : this.y+this.height;
	v = new AALine(-Infinity, y, +Infinity, y).contactRect(v, rect);
	return v;
    }

    overlaps(collider: Collider): boolean {
	if (collider instanceof Rect) {
	    return this.overlapsRect(collider);
	} else if (collider instanceof Circle) {
	    return this.overlapsCircle(collider);
	} else {
	    return false;
	}
    }

    contact(v: Vec2, collider: Collider): Vec2 {
	if (collider instanceof Rect) {
	    return this.contactRect(v, collider);
	} else if (collider instanceof Circle) {
	    return this.contactCircle(v, collider);
	} else {
	    return v;
	}
    }

    getAABB(): Rect {
	return this;
    }
}


/**  Circle
 */
class Circle implements Shape {

    center: Vec2;
    radius: number;

    constructor(center: Vec2, radius=0) {
	this.center = center;
	this.radius = radius;
    }

    toString() {
	return 'Circle(center='+this.center+', radius='+this.radius+')';
    }
    
    copy(): Circle {
	return new Circle(this.center.copy(), this.radius);
    }
    
    equals(circle: Circle): boolean {
	return (this.center.equals(circle.center) &&
		this.radius == circle.radius);
    }
    
    isZero(): boolean {
	return this.radius == 0;
    }
    
    move(dx: number, dy: number): Circle {
	return new Circle(this.center.move(dx, dy), this.radius);  
    }
    
    add(v: Vec2): Circle {
	return new Circle(this.center.add(v), this.radius);
    }
    
    sub(v: Vec2): Circle {
	return new Circle(this.center.sub(v), this.radius);
    }
    
    inflate(dr: number): Circle {
	return new Circle(this.center, this.radius+dr);
    }
    
    resize(radius: number): Circle {
	return new Circle(this.center, radius);
    }

    distance(p: Vec2): number {
	return this.center.sub(p).len();
    }

    containsPt(p: Vec2): boolean {
	return this.distance(p) < this.radius;
    }

    containsCircle(circle: Circle): boolean {
	let d = this.distance(circle.center);
	return d+circle.radius < this.radius;
    }

    overlapsCircle(circle: Circle): boolean {
	let d = this.distance(circle.center);
	return d < this.radius+circle.radius;
    }
    
    overlapsRect(rect: Rect): boolean {
	return rect.overlapsCircle(this);
    }

    clamp(bounds: Rect): Circle {
	let x = ((bounds.width < this.radius)? bounds.cx() :
		 clamp(bounds.x, this.center.x, bounds.x+bounds.width-this.radius));
	let y = ((bounds.height < this.radius)? bounds.cy() :
		 clamp(bounds.y, this.center.y, bounds.y+bounds.height-this.radius));
	return new Circle(new Vec2(x, y), this.radius);
    }
    
    edgePt(t: number): Vec2 {
	return new Vec2(this.center.x+this.radius*Math.cos(t),
			this.center.y+this.radius*Math.sin(t));
    }
    
    rndPt(): Vec2 {
	let r = frnd(this.radius);
	let t = frnd(Math.PI*2);
	return new Vec2(this.center.x+r*Math.cos(t),
			this.center.y+r*Math.sin(t));
    }
    
    rndPtEdge(): Vec2 {
	let t = frnd(Math.PI*2);
	return this.edgePt(t);
    }

    contactCircle(v: Vec2, circle: Circle): Vec2 {
	if (this.overlapsCircle(circle)) {
	    return new Vec2();
	}
	
	let d = circle.center.sub(this.center);
	let dv = d.x*v.x + d.y*v.y;
	let v2 = v.len2();
	let d2 = d.len2();
	let R = (this.radius + circle.radius);
	// |d - t*v|^2 = (r1+r2)^2
	// t = { (d*v) + sqrt((d*v)^2 - v^2(d^2-R^2)) } / v^2
	let s = dv*dv - v2*(d2-R*R);
	if (0 < s) {
	    let t = (dv - Math.sqrt(s)) / v2;
	    if (t < -EPSILON) {
		;
	    } else if (t < EPSILON) {
		v = new Vec2();
	    } else if (t < 1+EPSILON) {
		v = v.scale(t/(1+EPSILON));
	    }
	}
	return v;
    }

    overlaps(collider: Collider): boolean {
	if (collider instanceof Circle) {
	    return this.overlapsCircle(collider);
	} else if (collider instanceof Rect) {
	    return this.overlapsRect(collider);
	} else {
	    return false;
	}
    }    

    contact(v: Vec2, collider: Collider): Vec2 {
	if (collider instanceof Circle) {
	    return this.contactCircle(v, collider);
	} else if (collider instanceof Rect) {
	    return collider.contactCircle(v.scale(-1), this).scale(-1);
	} else {
	    return v;
	}
    }    

    getAABB(): Rect {
	return new Rect(
	    this.center.x-this.radius,
	    this.center.y-this.radius,
	    this.radius*2, this.radius*2);
    }
}


//  AAPlane
//  Axis-aligned plane
//
class AAPlane {

    p0: Vec3;
    p1: Vec3;
    
    constructor(p0: Vec3, p1: Vec3) {
	this.p0 = p0;
	this.p1 = p1;
    }

    contactBox(v: Vec3, box: Box): Vec3 {
	if (this.p0.x == this.p1.x) {
	    return this.contactBoxYZ(v, box, this.p0.x);
	} else if (this.p0.y == this.p1.y) {
	    return this.contactBoxZX(v, box, this.p0.y);
	} else if (this.p0.z == this.p1.z) {
	    return this.contactBoxXY(v, box, this.p0.z);
	} else {
	    return v;
	}
    }
    
    private contactBoxYZ(v: Vec3, box: Box, x: number): Vec3 {
	let x0 = box.origin.x;
	let x1 = x0+box.size.x;
	let dx: number;
	if (x <= x0 && x0+v.x < x) {
	    dx = x-x0;
	} else if (x1 <= x && x < x1+v.x) {
	    dx = x-x1;
	} else {
	    return v;
	}
	let dy = v.y*dx / v.x;
	let dz = v.z*dx / v.x;
	let y0 = box.origin.y + dy;
	let y1 = y0+box.size.y;
	let z0 = box.origin.z + dz;
	let z1 = z0+box.size.z;
	if (y1 < this.p0.y || this.p1.y < y0 ||
	    z1 < this.p0.z || this.p1.z < z0 ||
	    (y1 == this.p0.y && v.y <= 0) || (this.p1.y == y0 && 0 <= v.y) ||
	    (z1 == this.p0.z && v.z <= 0) || (this.p1.z == z0 && 0 <= v.z)) {
	    return v;
	}
	return new Vec3(dx, dy, dz);
    }
    
    private contactBoxZX(v: Vec3, box: Box, y: number): Vec3 {
	let y0 = box.origin.y;
	let y1 = y0+box.size.y;
	let dy: number;
	if (y <= y0 && y0+v.y < y) {
	    dy = y-y0;
	} else if (y1 <= y && y < y1+v.y) {
	    dy = y-y1;
	} else {
	    return v;
	}
	let dz = v.z*dy / v.y;
	let dx = v.x*dy / v.y;
	let z0 = box.origin.z + dx;
	let z1 = z0+box.size.z;
	let x0 = box.origin.x + dy;
	let x1 = x0+box.size.x;
	if (z1 < this.p0.z || this.p1.z < z0 ||
	    x1 < this.p0.x || this.p1.x < x0 ||
	    (z1 == this.p0.z && v.z <= 0) || (z0 == this.p1.z && 0 <= v.z) ||
	    (x1 == this.p0.x && v.x <= 0) || (x0 == this.p1.x && 0 <= v.x)) {
	    return v;
	}
	return new Vec3(dx, dy, dz);
    }
    
    private contactBoxXY(v: Vec3, box: Box, z: number): Vec3 {
	let z0 = box.origin.z;
	let z1 = z0+box.size.z;
	let dz: number;
	if (z <= z0 && z0+v.z < z) {
	    dz = z-z0;
	} else if (z1 <= z && z < z1+v.z) {
	    dz = z-z1;
	} else {
	    return v;
	}
	let dx = v.x*dz / v.z;
	let dy = v.y*dz / v.z;
	let x0 = box.origin.x + dx;
	let x1 = x0+box.size.x;
	let y0 = box.origin.y + dy;
	let y1 = y0+box.size.y;
	if (x1 < this.p0.x || this.p1.x < x0 ||
	    y1 < this.p0.y || this.p1.y < y0 ||
	    (x1 == this.p0.x && v.x <= 0) || (x0 == this.p1.x && 0 <= v.x) ||
	    (y1 == this.p0.y && v.y <= 0) || (y0 == this.p1.y && 0 <= v.y)) {
	    return v;
	}
	return new Vec3(dx, dy, dz);
    }
}


//  Box
//
class Box {

    origin: Vec3;
    size: Vec3;
    
    constructor(origin: Vec3, size: Vec3=null) {
	this.origin = origin;
	this.size = (size !== null)? size : new Vec3();
    }
    
    toString() {
	return '('+this.origin+', '+this.size+')';
    }
    
    copy(): Box {
	return new Box(this.origin.copy(), this.size.copy());
    }
    
    equals(box: Box): boolean {
	return (this.origin.equals(box.origin) &&
		this.size.equals(box.size));
    }
    
    isZero(): boolean {
	return this.size.isZero();
    }
    
    center(): Vec3 {
	return new Vec3(this.origin.x+this.size.x/2,
			this.origin.y+this.size.y/2,
			this.origin.z+this.size.z/2);
    }
    
    surface(vx: number, vy: number, vz: number): AAPlane {
	if (vx < 0) {
	    return new AAPlane(
		this.origin,
		this.origin.move(0, this.size.y, this.size.z));
	} else if (0 < vx) {
	    return new AAPlane(
		this.origin.move(this.size.x, 0, 0),
		this.origin.add(this.size));
	} else if (vy < 0) {
	    return new AAPlane(
		this.origin,
		this.origin.move(this.size.x, 0, this.size.z));
	} else if (0 < vy) {
	    return new AAPlane(
		this.origin.move(0, this.size.y, 0),
		this.origin.add(this.size));
	} else if (vz < 0) {
	    return new AAPlane(
		this.origin,
		this.origin.move(this.size.x, this.size.y, 0));
	} else if (0 < vz) {
	    return new AAPlane(
		this.origin.move(0, 0, this.size.z),
		this.origin.add(this.size));
	} else {
	    return null;
	}
    }
    
    anchor(vx=0, vy=0, vz=0): Vec3 {
	let x: number, y: number, z: number;
	if (vx < 0) {
	    x = this.origin.x;
	} else if (0 < vx) {
	    x = this.origin.x+this.size.x;
	} else {
	    x = this.origin.x+this.size.x/2;
	}
	if (vy < 0) {
	    y = this.origin.y;
	} else if (0 < vy) {
	    y = this.origin.y+this.size.y;
	} else {
	    y = this.origin.y+this.size.y/2;
	}
	if (vz < 0) {
	    z = this.origin.z;
	} else if (0 < vz) {
	    z = this.origin.z+this.size.z;
	} else {
	    z = this.origin.z+this.size.z/2;
	}
	return new Vec3(x, y, z);
    }
    
    move(dx: number, dy: number, dz: number): Box {
	return new Box(this.origin.move(dx, dy, dz), this.size);
    }
    
    add(v: Vec3): Box {
	return new Box(this.origin.add(v), this.size);
    }
    
    sub(v: Vec3): Box {
	return new Box(this.origin.sub(v), this.size);
    }
    
    inflate(dx: number, dy: number, dz: number): Box {
	return new Box(this.origin.move(-dx, -dy, -dz),
		       this.size.move(dx*2, dy*2, dz*2));
    }
    
    xdistance(box: Box): number {
	return Math.max(box.origin.x-(this.origin.x+this.size.x),
			this.origin.x-(box.origin.x+box.size.x));
    }
    
    ydistance(box: Box): number {
	return Math.max(box.origin.y-(this.origin.y+this.size.y),
			this.origin.y-(box.origin.y+box.size.y));
    }
    
    zdistance(box: Box): number {
	return Math.max(box.origin.z-(this.origin.z+this.size.z),
			this.origin.z-(box.origin.z+box.size.z));
    }
    
    containsPt(p: Vec3): boolean {
	return (this.origin.x <= p.x && this.origin.y <= p.y && this.origin.z <= p.z &&
		p.x < this.origin.x+this.size.x &&
		p.y < this.origin.y+this.size.y &&
		p.z < this.origin.z+this.size.z);
    }
    
    overlapsBox(box: Box): boolean {
	return (this.xdistance(box) < 0 &&
		this.ydistance(box) < 0 &&
		this.zdistance(box) < 0);
    }
    
    union(box: Box): Box {
	let x0 = Math.min(this.origin.x, box.origin.x);
	let y0 = Math.min(this.origin.y, box.origin.y);
	let z0 = Math.min(this.origin.z, box.origin.z);
	let x1 = Math.max(this.origin.x+this.size.x, box.origin.x+box.size.x);
	let y1 = Math.max(this.origin.y+this.size.y, box.origin.y+box.size.y);
	let z1 = Math.max(this.origin.z+this.size.z, box.origin.z+box.size.z);
	return new Box(new Vec3(x0, y0, z0),
		       new Vec3(x1-x0, y1-y0, z1-z0));
    }
    
    intersection(box: Box): Box {
	let x0 = Math.max(this.origin.x, box.origin.x);
	let y0 = Math.max(this.origin.y, box.origin.y);
	let z0 = Math.max(this.origin.z, box.origin.z);
	let x1 = Math.min(this.origin.x+this.size.x, box.origin.x+box.size.x);
	let y1 = Math.min(this.origin.y+this.size.y, box.origin.y+box.size.y);
	let z1 = Math.min(this.origin.z+this.size.z, box.origin.z+box.size.z);
	return new Box(new Vec3(x0, y0, z0),
		       new Vec3(x1-x0, y1-y0, z1-z0));
    }
    
    clamp(bounds: Box): Box {
	let x = ((bounds.size.x < this.size.x)?
		 (bounds.origin.x+bounds.size.x/2) :
		 clamp(bounds.origin.x, this.origin.x,
		       bounds.origin.x+bounds.size.x-this.size.x));
	let y = ((bounds.size.y < this.size.y)?
		 (bounds.origin.y+bounds.size.y/2) :
		 clamp(bounds.origin.y, this.origin.y,
		       bounds.origin.y+bounds.size.y-this.size.y));
	let z = ((bounds.size.z < this.size.z)?
		 (bounds.origin.z+bounds.size.z/2) :
		 clamp(bounds.origin.z, this.origin.z,
		       bounds.origin.z+bounds.size.z-this.size.z));
	return new Box(new Vec3(x, y, z), this.size);
    }
    
    rndPt(): Vec3 {
	return new Vec3(this.origin.x+frnd(this.size.x),
			this.origin.y+frnd(this.size.y),
			this.origin.z+frnd(this.size.z));
    }

    contactBox(v: Vec3, box: Box): Vec3 {
	if (this.overlapsBox(box)) {
	    return new Vec3();
	}
	if (0 < v.x) {
	    v = this.surface(-1, 0, 0).contactBox(v, box);
	} else if (v.x < 0) {
	    v = this.surface(+1, 0, 0).contactBox(v, box);
	}
	if (0 < v.y) {
	    v = this.surface(0, -1, 0).contactBox(v, box);
	} else if (v.y < 0) {
	    v = this.surface(0, +1, 0).contactBox(v, box);
	}
	if (0 < v.z) {
	    v = this.surface(0, 0, -1).contactBox(v, box);
	} else if (v.z < 0) {
	    v = this.surface(0, 0, +1).contactBox(v, box);
	}
	return v;
    }
}


// getContact: returns a motion vector that satisfies the given constraints.
function getContact(
    collider0: Collider, v: Vec2,
    obstacles: Collider[],
    fences: Rect[]=null): Vec2
{
    if (obstacles !== null) {
	for (let collider1 of obstacles) {
	    v = collider1.contact(v, collider0);
	}
    }
    if (fences !== null) {
	for (let rect of fences) {
	    v = rect.boundRect(v, collider0.getAABB());
	}
    }
    return v;
}
