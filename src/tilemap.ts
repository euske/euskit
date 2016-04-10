// tilemap.ts
// TileMap is a generic class that handles a scrollable map.
//   requires: utils.ts
//   requires: geom.ts

//  TileMap
//
class TileMap {

    tilesize: number;
    map: [[number]];
    width: number;
    height: number;
    rangemap: any;

    constructor(tilesize: number, map: [[number]]) {
	this.tilesize = tilesize;
	this.map = map;
	this.width = map[0].length;
	this.height = map.length;
	this.rangemap = {};
    }

    get(x: number, y: number) {
	if (0 <= x && 0 <= y && x < this.width && y < this.height) {
	    return this.map[y][x];
	} else {
	    return -1;
	}
    }

    set(x: number, y: number, v: number) {
	if (0 <= x && 0 <= y && x < this.width && y < this.height) {
	    this.map[y][x] = v;
	}
	this.rangemap = {};
    }

    copy() {
	let map = [] as [[number]];
	for (let i = 0; i < this.map.length; i++) {
	    map.push(this.map[i].slice() as [number]);
	}
	return new TileMap(this.tilesize, map);
    }

    coord2map(rect: Rect) {
	const ts = this.tilesize;
	if (rect instanceof Rect) {
	    const x0 = Math.floor(rect.x/ts);
	    const y0 = Math.floor(rect.y/ts);
	    const x1 = Math.ceil((rect.x+rect.width)/ts);
	    const y1 = Math.ceil((rect.y+rect.height)/ts);
	    return new Rect(x0, y0, x1-x0, y1-y0);
	} else {
	    const x = int(rect.x/ts);
	    const y = int(rect.y/ts);
	    return new Rect(x, y, 1, 1);
	}
    }

    map2coord(rect: Vec2|Rect) {
	const ts = this.tilesize;
	if (rect instanceof Vec2) {
	    return new Rect(rect.x*ts, rect.y*ts, ts, ts);
	} else if (rect instanceof Rect) {
	    return new Rect(rect.x*ts, rect.y*ts,
				 rect.width*ts, rect.height*ts);
	} else {
	    return null;
	}
    }

    apply(f: (x:number, y:number, c:number)=>boolean,
	  rect: Rect=null) {
	if (rect === null) {
	    rect = new Rect(0, 0, this.width, this.height);
	}
	for (let dy = 0; dy < rect.height; dy++) {
	    const y = rect.y+dy;
	    for (let dx = 0; dx < rect.width; dx++) {
		const x = rect.x+dx;
		const c = this.get(x, y);
		if (f(x, y, c)) {
		    return new Vec2(x,y);
		}
	    }
	}
	return null;
    }

    findTile(f0: (c:number)=>boolean,
	     rect: Rect) {
	function f(x:number, y:number, c:number) {
	    return f0(c);
	}
	return this.apply(f, this.coord2map(rect));
    }

    reduce(f: (x:number, y:number, c:number, v:any)=>any,
	   v: any, rect: Rect=null) {
	if (rect === null) {
	    rect = new Rect(0, 0, this.width, this.height);
	}
	for (let dy = 0; dy < rect.height; dy++) {
	    let y = rect.y+dy;
	    for (let dx = 0; dx < rect.width; dx++) {
		let x = rect.x+dx;
		let c = this.get(x, y);
		v = f(x, y, c, v);
	    }
	}
	return v;
    }
  
    contactTile(rect: Rect,
		f0: (c:number)=>boolean,
		v0: Vec2): Vec2 {
	let ts = this.tilesize;
	function f(x:number, y:number, c:number, v:Vec2) {
	    if (f0(c)) {
		let bounds = new Rect(x*ts, y*ts, ts, ts);
		v = rect.contact(v, bounds);
	    }
	    return v;
	}
	let r = rect.add(v0).union(rect);
	return this.reduce(f, v0, this.coord2map(r));
    }
  
    scroll(rect: Rect, vx: number, vy: number) {
	if (rect === null) {
	    rect = new Rect(0, 0, this.width, this.height);
	}
	let src:[[number]] = [] as [[number]];
	for (let dy = 0; dy < rect.height; dy++) {
	    let a:[number] = [] as [number];
	    for (let dx = 0; dx < rect.width; dx++) {
		a.push(this.map[rect.y+dy][rect.x+dx]);
	    }
	    src.push(a);
	}
	for (let dy = 0; dy < rect.height; dy++) {
	    for (let dx = 0; dx < rect.width; dx++) {
		let x = (dx+vx + rect.width) % rect.width;
		let y = (dy+vy + rect.height) % rect.height;
		this.map[rect.y+dy][rect.x+dx] = src[y][x];
	    }
	}
    }

    getRangeMap(f: (x:number)=>boolean) {
	let map = this.rangemap[f as any];
	if (map === undefined) {
	    map = new RangeMap(this, f);
	    this.rangemap[f as any] = map;
	}
	return map;
    }

    renderFromBottomLeft(
	ctx: CanvasRenderingContext2D,
	bx: number, by: number,
	tiles: HTMLCanvasElement,
	ft: (x:number, y:number, c:number)=>number,
	x0: number, y0: number, w: number, h: number) {
	// Align the pos to the bottom left corner.
	let ts = this.tilesize;
	let tw = tiles.height;
	by = by+ts-tw;
	// Draw tiles from the bottom-left first.
	for (let dy = h-1; 0 <= dy; dy--) {
	    let y = y0+dy;
	    for (let dx = 0; dx < w; dx++) {
		let x = x0+dx;
		let c = this.get(x, y);
		c = ft(x, y, c);
		if (0 <= c) {
		    ctx.drawImage(tiles,
				  tw*c, 0, tw, tw,
				  bx+ts*dx, by+ts*dy, tw, tw);
		}
	    }
	}
    }

    renderFromTopRight(
	ctx: CanvasRenderingContext2D,
	bx: number, by: number,
	tiles: HTMLCanvasElement,
	ft: (x:number, y:number, c:number)=>number,
	x0: number, y0: number, w: number, h: number) {
	// Align the pos to the bottom left corner.
	let ts = this.tilesize;
	let tw = tiles.height;
	by = by+ts-tw;
	// Draw tiles from the top-right first.
	for (let dy = 0; dy < h; dy++) {
	    let y = y0+dy;
	    for (let dx = w-1; 0 <= dx; dx--) {
		let x = x0+dx;
		let c = this.get(x, y);
		c = ft(x, y, c);
		if (0 <= c) {
		    ctx.drawImage(tiles,
				  tw*c, 0, tw, tw,
				  bx+ts*dx, by+ts*dy, tw, tw);
		}
	    }
	}
    }

}


//  RangeMap
//
class RangeMap {

    width: number;
    height: number;
    data: [Int32Array];
    
    constructor(tilemap: TileMap, f: (x:number)=>boolean) {
	let data = new Array(tilemap.height+1) as [Int32Array];
	let row0 = new Int32Array(tilemap.width+1);
	for (let x = 0; x < tilemap.width; x++) {
	    row0[x+1] = 0;
	}
	data[0] = row0;
	for (let y = 0; y < tilemap.height; y++) {
	    let row1 = new Int32Array(tilemap.width+1);
	    let n = 0;
	    for (let x = 0; x < tilemap.width; x++) {
		if (f(tilemap.get(x, y))) {
		    n++;
		}
		row1[x+1] = row0[x+1] + n;
	    }
	    data[y+1] = row1;
	    row0 = row1;
	}
	this.width = tilemap.width;
	this.height = tilemap.height;
	this.data = data;
    }

    get(x0: number, y0: number, x1: number, y1: number) {
	let t: number;
	if (x1 < x0) {
	    t = x0; x0 = x1; x1 = t;
	    // assert(x0 <= x1);
	}
	if (y1 < y0) {
	    t = y0; y0 = y1; y1 = t;
	    // assert(y0 <= y1);
	}
	x0 = clamp(0, x0, this.width);
	y0 = clamp(0, y0, this.height);
	x1 = clamp(0, x1, this.width);
	y1 = clamp(0, y1, this.height);
	return (this.data[y1][x1] - this.data[y1][x0] -
		this.data[y0][x1] + this.data[y0][x0]);
    }

    exists(rect: Rect) {
	return (this.get(rect.x, rect.y,
			 rect.x+rect.width,
			 rect.y+rect.height) !== 0);
    }

}
