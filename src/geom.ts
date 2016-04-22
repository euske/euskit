/// <reference path="utils.ts" />


//  Vec2
//
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

    equals(p: Vec2) {
	return (this.x == p.x && this.y == p.y);
    }
    
    isZero() {
	return (this.x == 0 && this.y == 0);
    }
    
    copy() {
	return new Vec2(this.x, this.y);
    }
    
    norm2() {
	return (this.x*this.x + this.y*this.y);
    }
    
    norm() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    
    sign() {
	return new Vec2(sign(this.x), sign(this.y));
    }
    
    add(v: Vec2) {
	return new Vec2(this.x+v.x, this.y+v.y);
    }
    
    sub(v: Vec2) {
	return new Vec2(this.x-v.x, this.y-v.y);
    }
    
    scale(v: number) {
	return new Vec2(this.x*v, this.y*v);
    }
    
    distance(v: Vec2) {
	return this.sub(v).norm();
    }
    
    clamp(v: Vec2) {
	return new Vec2(
	    clamp(-v.x, this.x, +v.x),
	    clamp(-v.y, this.y, +v.y));
    }
    
    move(dx: number, dy: number) {
	return new Vec2(this.x+dx, this.y+dy);
    }
    
    rot90(v: number) {
	if (v < 0) {
	    return new Vec2(this.y, -this.x);
	} else if (0 < v) {
	    return new Vec2(-this.y, this.x);
	} else {
	    return this.copy();
	}
    }
    
    expand(dw: number, dh: number, vx=0, vy=0) {
	return new Rect(this.x, this.y).expand(dw, dh, vx, vy);
    }
    
}


//  Vec3
//
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
    
    equals(p: Vec3) {
	return (this.x == p.x && this.y == p.y && this.z == p.z);
    }
    
    isZero() {
	return (this.x == 0 && this.y == 0 && this.z == 0);
    }
    
    copy() {
	return new Vec3(this.x, this.y, this.z);
    }
    
    norm2() {
	return (this.x*this.x + this.y*this.y + this.z*this.z);
    }
    
    norm() {
	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    }
    
    sign() {
	return new Vec3(sign(this.x), sign(this.y), sign(this.z));
    }
    
    add(v: Vec3) {
	return new Vec3(this.x+v.x, this.y+v.y, this.z+v.z);
    }
    
    sub(v: Vec3) {
	return new Vec3(this.x-v.x, this.y-v.y, this.z-v.z);
    }
    
    scale(v: number) {
	return new Vec3(this.x*v, this.y*v, this.z*v);
    }
    
    distance(v: Vec3) {
	return this.sub(v).norm();
    }
    
    clamp(v: Vec3) {
	return new Vec3(
	    clamp(-v.x, this.x, +v.x),
	    clamp(-v.y, this.y, +v.y),
	    clamp(-v.z, this.z, +v.z));
    }
    
    move(dx: number, dy: number, dz: number) {
	return new Vec3(this.x+dx, this.y+dy, this.z+dz);
    }

}


//  Rect
//
class Rect {

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
    
    equals(rect: Rect) {
	return (this.x == rect.x && this.y == rect.y &&
		this.width == rect.width && this.height == rect.height);
    }
    
    right() {
	return this.x+this.width;
    }
    bottom() {
	return this.y+this.height;
    }
    centerx() {
	return this.x+this.width/2;
    }
    centery() {
	return this.y+this.height/2;
    }
    
    topleft() {
	return new Vec2(this.x, this.y);
    }
    topright() {
	return new Vec2(this.x+this.width, this.y);
    }
    bottomleft() {
	return new Vec2(this.x, this.y+this.height);
    }
    bottomright() {
	return new Vec2(this.x+this.width, this.y+this.height);
    }
    center() {
	return new Vec2(this.x+this.width/2, this.y+this.height/2);
    }
    
    anchor(vx: number, vy: number) {
	let x: number, y: number;
	if (0 < vx) {
	    x = this.x;
	} else if (vx < 0) {
	    x = this.x+this.width;
	} else {
	    x = this.x+this.width/2;
	}
	if (0 < vy) {
	    y = this.y;
	} else if (vy < 0) {
	    y = this.y+this.height;
	} else {
	    y = this.y+this.height/2;
	}
	return new Vec2(x, y);
    }
    
    copy() {
	return new Rect(this.x, this.y, this.width, this.height);
    }
    
    move(dx: number, dy: number) {
	return new Rect(this.x+dx, this.y+dy, this.width, this.height);  
    }
    
    add(v: Vec2) {
	return new Rect(this.x+v.x, this.y+v.y, this.width, this.height);  
    }
    
    diff(rect: Rect) {
	return new Vec2(this.x-rect.x, this.y-rect.y);
    }
    
    inflate(dw: number, dh: number) {
	return new Rect(this.x-dw, this.y-dh, this.width+dw*2, this.height+dh*2);
    }
    
    expand(dw: number, dh: number, vx=0, vy=0) {
	let x: number, y: number;
	if (0 < vx) {
	    x = this.x;
	} else if (vx < 0) {
	    x = this.x-dw;
	} else {
	    x = this.x-dw/2;
	}
	if (0 < vy) {
	    y = this.y;
	} else if (vy < 0) {
	    y = this.y-dh;
	} else {
	    y = this.y-dh/2;
	}
	return new Rect(x, y, this.width+dw, this.height+dh);
    }
    
    contains(p: Vec2) {
	return (this.x <= p.x && this.y <= p.y &&
		p.x <= this.x+this.width && p.y <= this.y+this.height);
    }
    
    containsRect(rect: Rect) {
	return (this.x <= rect.x &&
		this.y <= rect.y &&
		rect.x+rect.width <= this.x+this.width &&
		rect.y+rect.height <= this.y+this.height);
    }
    
    xdistance(rect: Rect) {
	return Math.max(rect.x-(this.x+this.width),
			this.x-(rect.x+rect.width));
    }
    ydistance(rect: Rect) {
	return Math.max(rect.y-(this.y+this.height),
			this.y-(rect.y+rect.height));
    }
    
    distance(rect: Rect) {
	return new Vec2(this.xdistance(rect),
			this.ydistance(rect));
    }
    
    overlap(rect: Rect) {
	return (this.xdistance(rect) < 0 &&
		this.ydistance(rect) < 0);
    }
    
    union(rect: Rect) {
	let x0 = Math.min(this.x, rect.x);
	let y0 = Math.min(this.y, rect.y);
	let x1 = Math.max(this.x+this.width, rect.x+rect.width);
	let y1 = Math.max(this.y+this.height, rect.y+rect.height);
	return new Rect(x0, y0, x1-x0, y1-y0);
    }
    
    intersection(rect: Rect) {
	let x0 = Math.max(this.x, rect.x);
	let y0 = Math.max(this.y, rect.y);
	let x1 = Math.min(this.x+this.width, rect.x+rect.width);
	let y1 = Math.min(this.y+this.height, rect.y+rect.height);
	return new Rect(x0, y0, x1-x0, y1-y0);
    }
    
    clamp(rect: Rect) {
	let x = ((rect.width < this.width)? rect.centerx() :
		 clamp(rect.x, this.x, rect.x+rect.width-this.width));
	let y = ((rect.height < this.height)? rect.centery() :
		 clamp(rect.y, this.y, rect.y+rect.height-this.height));
	return new Rect(x, y, this.width, this.height);
    }
    
    rndpt() {
	return new Vec2(this.x+rnd(this.width),
			this.y+rnd(this.height));
    }
    
    modpt(v: Vec2) {
	return new Vec2(this.x+fmod(v.x-this.x, this.width),
			this.y+fmod(v.y-this.y, this.height));
    }
    
    contactVLine(v: Vec2, x: number, y0: number, y1: number) {
	let dx: number, dy: number;
	let x0 = this.x;
	let x1 = this.x+this.width;
	if (x <= x0 && x0+v.x < x) {
	    dx = x-x0;
	} else if (x1 <= x && x < x1+v.x) {
	    dx = x-x1;
	} else {
	    return v;
	}
	dy = v.y*dx / v.x;
	let y = this.y+dy;
	if (y+this.height < y0 || y1 < y ||
	    (y+this.height == y0 && v.y <= 0) ||
	    (y1 == y && 0 <= v.y)) {
	    return v;
	}
	return new Vec2(dx, dy);
    }
    
    contactHLine(v: Vec2, y: number, x0: number, x1: number) {
	let dx: number, dy: number;
	let y0 = this.y;
	let y1 = this.y+this.height;
	if (y <= y0 && y0+v.y < y) {
	    dy = y-y0;
	} else if (y1 <= y && y < y1+v.y) {
	    dy = y-y1;
	} else {
	    return v;
	}
	dx = v.x*dy / v.y;
	let x = this.x+dx;
	if (x+this.width < x0 || x1 < x ||
	    (x+this.width == x0 && v.x <= 0) ||
	    (x1 == x && 0 <= v.x)) {
	    return v;
	}
	return new Vec2(dx, dy);
    }
    
    contact(v: Vec2, rect: Rect) {
	assert(!this.overlap(rect), 'rect overlapped');
	
	if (0 < v.x) {
	    v = this.contactVLine(v, rect.x, rect.y, rect.y+rect.height);
	} else if (v.x < 0) {
	    v = this.contactVLine(v, rect.x+rect.width, rect.y, rect.y+rect.height);
	}

	if (0 < v.y) {
	    v = this.contactHLine(v, rect.y, rect.x, rect.x+rect.width);
	} else if (v.y < 0) {
	    v = this.contactHLine(v, rect.y+rect.height, rect.x, rect.x+rect.width);
	}

	return v;
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
    
    equals(box: Box) {
	return (this.origin.equals(box.origin) &&
		this.size.equals(box.size));
    }
    
    center() {
	return new Vec3(this.origin.x+this.size.x/2,
			this.origin.y+this.size.y/2,
			this.origin.z+this.size.z/2);
    }
    
    copy() {
	return new Box(this.origin.copy(), this.size.copy());
    }
    
    move(dx: number, dy: number, dz: number) {
	return new Box(this.origin.move(dx, dy, dz), this.size);
    }
    
    add(v: Vec3) {
	return new Box(this.origin.add(v), this.size);
    }
    
    diff(box: Box) {
	return this.origin.sub(box.origin);
    }
    
    xdistance(box: Box) {
	return Math.max(box.origin.x-(this.origin.x+this.size.x),
			this.origin.x-(box.origin.x+box.size.x));
    }
    
    ydistance(box: Box) {
	return Math.max(box.origin.y-(this.origin.y+this.size.y),
			this.origin.y-(box.origin.y+box.size.y));
    }
    
    zdistance(box: Box) {
	return Math.max(box.origin.z-(this.origin.z+this.size.z),
			this.origin.z-(box.origin.z+box.size.z));
    }
    
    inflate(dx: number, dy: number, dz: number) {
	return new Box(this.origin.move(-dx, -dy, -dz),
		       this.size.move(dx*2, dy*2, dz*2));
    }
    
    contains(p: Vec3) {
	return (this.origin.x <= p.x && this.origin.y <= p.y && this.origin.z <= p.z &&
		p.x <= this.origin.x+this.size.x &&
		p.y <= this.origin.y+this.size.y &&
		p.z <= this.origin.z+this.size.z);
    }
    
    overlap(box: Box) {
	return (this.xdistance(box) < 0 &&
		this.ydistance(box) < 0 &&
		this.zdistance(box) < 0);
    }
    
    union(box: Box) {
	let x0 = Math.min(this.origin.x, box.origin.x);
	let y0 = Math.min(this.origin.y, box.origin.y);
	let z0 = Math.min(this.origin.z, box.origin.z);
	let x1 = Math.max(this.origin.x+this.size.x, box.origin.x+box.size.x);
	let y1 = Math.max(this.origin.y+this.size.y, box.origin.y+box.size.y);
	let z1 = Math.max(this.origin.z+this.size.z, box.origin.z+box.size.z);
	return new Box(new Vec3(x0, y0, z0),
		       new Vec3(x1-x0, y1-y0, z1-z0));
    }
    
    intersection(box: Box) {
	let x0 = Math.max(this.origin.x, box.origin.x);
	let y0 = Math.max(this.origin.y, box.origin.y);
	let z0 = Math.max(this.origin.z, box.origin.z);
	let x1 = Math.min(this.origin.x+this.size.x, box.origin.x+box.size.x);
	let y1 = Math.min(this.origin.y+this.size.y, box.origin.y+box.size.y);
	let z1 = Math.min(this.origin.z+this.size.z, box.origin.z+box.size.z);
	return new Box(new Vec3(x0, y0, z0),
		       new Vec3(x1-x0, y1-y0, z1-z0));
    }
    
    clamp(box: Box) {
	let x = ((box.size.x < this.size.x)? (box.origin.x+box.size.x/2) :
		 clamp(box.origin.x, this.origin.x, box.origin.x+box.size.x-this.size.x));
	let y = ((box.size.y < this.size.y)? (box.origin.y+box.size.y/2) :
		 clamp(box.origin.y, this.origin.y, box.origin.y+box.size.y-this.size.y));
	let z = ((box.size.z < this.size.z)? (box.origin.z+box.size.z/2) :
		 clamp(box.origin.z, this.origin.z, box.origin.z+box.size.z-this.size.z));
	return new Box(new Vec3(x, y, z), this.size);
    }
    
    rndpt() {
	return new Vec3(this.origin.x+rnd(this.size.x),
			this.origin.y+rnd(this.size.y),
			this.origin.z+rnd(this.size.z));
    }

    contactYZPlane(v: Vec3, x: number, rect: Rect) {
	let dx: number, dy: number, dz: number;
	let x0 = this.origin.x;
	let x1 = this.origin.x+this.size.x;
	if (x <= x0 && x0+v.x < x) {
	    dx = x-x0;
	} else if (x1 <= x && x < x1+v.x) {
	    dx = x-x1;
	} else {
	    return v;
	}
	dy = v.y*dx / v.x;
	dz = v.z*dx / v.x;
	if (rect !== null) {
	    let y = this.origin.y+dy;
	    let z = this.origin.z+dz;
	    if (y+this.size.y < rect.x || rect.x+rect.width < y ||
		z+this.size.z < rect.y || rect.y+rect.height < z ||
		(y+this.size.y == rect.x && v.y <= 0) ||
		(rect.x+rect.width == y && 0 <= v.y) ||
		(z+this.size.z == rect.y && v.z <= 0) ||
		(rect.y+rect.height == z && 0 <= v.z)) {
		return v;
	    }
	}
	return new Vec3(dx, dy, dz);
    }
    
    contactZXPlane(v: Vec3, y: number, rect: Rect) {
	let dx: number, dy: number, dz: number;
	let y0 = this.origin.y;
	let y1 = this.origin.y+this.size.y;
	if (y <= y0 && y0+v.y < y) {
	    dy = y-y0;
	} else if (y1 <= y && y < y1+v.y) {
	    dy = y-y1;
	} else {
	    return v;
	}
	dz = v.z*dy / v.y;
	dx = v.x*dy / v.y;
	if (rect !== null) {
	    let z = this.origin.z+dz;
	    let x = this.origin.x+dx;
	    if (z+this.size.z < rect.x || rect.x+rect.width < z ||
		x+this.size.x < rect.y || rect.y+rect.height < x ||
		(z+this.size.z == rect.x && v.z <= 0) ||
		(rect.x+rect.width == z && 0 <= v.z) ||
		(x+this.size.x == rect.y && v.x <= 0) ||
		(rect.y+rect.height == x && 0 <= v.x)) {
		return v;
	    }
	}
	return new Vec3(dx, dy, dz);  
    }
    
    contactXYPlane(v: Vec3, z: number, rect: Rect) {
	let dx: number, dy: number, dz: number;
	let z0 = this.origin.z;
	let z1 = this.origin.z+this.size.z;
	if (z <= z0 && z0+v.z < z) {
	    dz = z-z0;
	} else if (z1 <= z && z < z1+v.z) {
	    dz = z-z1;
	} else {
	    return v;
	}
	dx = v.x*dz / v.z;
	dy = v.y*dz / v.z;
	if (rect !== null) {
	    let x = this.origin.x+dx;
	    let y = this.origin.y+dy;
	    if (x+this.size.x < rect.x || rect.x+rect.width < x ||
		y+this.size.y < rect.y || rect.y+rect.height < y ||
		(x+this.size.x == rect.x && v.x <= 0) ||
		(rect.x+rect.width == x && 0 <= v.x) ||
		(y+this.size.y == rect.y && v.y <= 0) ||
		(rect.y+rect.height == y && 0 <= v.y)) {
		return v;
	    }
	}
	return new Vec3(dx, dy, dz);  
    }
    
    contact(v: Vec3, box: Box) {
	assert(!this.overlap(box), 'box overlapped');
	
	if (0 < v.x) {
	    v = this.contactYZPlane(v, box.origin.x, 
				    new Rect(box.origin.y, box.origin.z,
					     box.size.y, box.size.z));
	} else if (v.x < 0) {
	    v = this.contactYZPlane(v, box.origin.x+box.size.x, 
				    new Rect(box.origin.y, box.origin.z,
					     box.size.y, box.size.z));
	}

	if (0 < v.y) {
	    v = this.contactZXPlane(v, box.origin.y, 
				    new Rect(box.origin.z, box.origin.x,
					     box.size.z, box.size.x));
	} else if (v.y < 0) {
	    v = this.contactZXPlane(v, box.origin.y+box.size.y, 
				    new Rect(box.origin.z, box.origin.x,
					     box.size.z, box.size.x));
	}
	
	if (0 < v.z) {
	    v = this.contactXYPlane(v, box.origin.z, 
				    new Rect(box.origin.x, box.origin.y,
					     box.size.x, box.size.y));
	} else if (v.z < 0) {
	    v = this.contactXYPlane(v, box.origin.z+box.size.z, 
				    new Rect(box.origin.x, box.origin.y,
					     box.size.x, box.size.y));
	}
	
	return v;
    }

}
