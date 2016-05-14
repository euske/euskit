/// <reference path="utils.ts" />
/// <reference path="geom.ts" />


//  TileMap
//
interface TileFunc {
    (c: number): boolean;
}
interface TilePosFunc {
    (x: number, y: number, c: number): boolean;
}
interface TilePosValueFunc<T> {
    (x: number, y: number, c: number, v: T): T;
}
interface TilePosTileFunc {
    (x: number, y: number, c: number): number;
}
interface RangeMapMap {
    [index: string]: RangeMap;
}
class TileMap {

    tilesize: number;
    map: Int32Array[];
    width: number;
    height: number;
    bounds: Rect;
    
    isObstacle: TileFunc;
    isGrabbable: TileFunc;
    isStoppable: TileFunc;

    private _rangemap: RangeMapMap = {};

    constructor(tilesize: number, map: Int32Array[]) {
	this.tilesize = tilesize;
	this.map = map;
	this.width = map[0].length;
	this.height = map.length;
	this.bounds = new Rect(0, 0,
			       this.width*this.tilesize,
			       this.height*this.tilesize);
    }

    toString() {
	return '<TileMap: '+this.width+','+this.height+'>';
    }
  
    get(x: number, y: number) {
	if (0 <= x && 0 <= y && x < this.width && y < this.height) {
	    return this.map[y][x];
	} else {
	    return -1;
	}
    }

    set(x: number, y: number, c: number) {
	if (0 <= x && 0 <= y && x < this.width && y < this.height) {
	    this.map[y][x] = c;
	    this._rangemap = {};
	}
    }

    fill(c: number, rect: Rect=null) {
	if (rect === null) {
	    rect = new Rect(0, 0, this.width, this.height);
	}
	for (let dy = 0; dy < rect.height; dy++) {
	    const y = rect.y+dy;
	    for (let dx = 0; dx < rect.width; dx++) {
		const x = rect.x+dx;
		this.map[y][x] = c;
	    }
	}
	this._rangemap = {};
    }

    copy() {
	let map:Int32Array[] = [];
	for (let i = 0; i < this.map.length; i++) {
	    map.push(this.map[i].slice());
	}
	return new TileMap(this.tilesize, map);
    }

    coord2map(rect: Vec2|Rect) {
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

    apply(f: TilePosFunc, rect: Rect=null) {
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

    reduce<T>(f: TilePosValueFunc<T>, v: T, rect: Rect=null) {
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
  
    findTile(f0: TileFunc, range: Rect) {
	return this.apply((x,y,c)=>{return f0(c);}, this.coord2map(range));
    }

    getTileRects(f0: TileFunc, range:Rect): Rect[] {
	let ts = this.tilesize;
	function f(x:number, y:number, c:number, rects:Rect[]) {
	    if (f0(c)) {
		rects.push(new Rect(x*ts, y*ts, ts, ts));
	    }
	    return rects;
	}
	return this.reduce(f, [] as Rect[], this.coord2map(range));
    }
  
    scroll(vx: number, vy: number, rect: Rect=null) {
	if (rect === null) {
	    rect = new Rect(0, 0, this.width, this.height);
	}
	let src:Int32Array[] = [];
	for (let dy = 0; dy < rect.height; dy++) {
	    let a = new Int32Array(rect.width);
	    for (let dx = 0; dx < rect.width; dx++) {
		a[dx] = this.map[rect.y+dy][rect.x+dx];
	    }
	    src.push(a);
	}
	for (let dy = 0; dy < rect.height; dy++) {
	    for (let dx = 0; dx < rect.width; dx++) {
		let x = (dx+vx + rect.width) % rect.width;
		let y = (dy+vy + rect.height) % rect.height;
		this.map[rect.y+y][rect.x+x] = src[dy][dx];
	    }
	}
    }

    getRangeMap(key:string, f: TileFunc) {
	let map = this._rangemap[key];
	if (map === undefined) {
	    map = new RangeMap(this, f);
	    this._rangemap[key] = map;
	}
	return map;
    }

    renderFromBottomLeft(
	ctx: CanvasRenderingContext2D,
	bx: number, by: number,
	tileset: SpriteSheet,
	ft: TilePosTileFunc,
	x0=0, y0=0, w=0, h=0) {
	// Align the pos to the bottom left corner.
	let ts = this.tilesize;
	w = (w != 0)? w : this.width;
	h = (h != 0)? h : this.height;
	// Draw tiles from the bottom-left first.
	for (let dy = h-1; 0 <= dy; dy--) {
	    let y = y0+dy;
	    for (let dx = 0; dx < w; dx++) {
		let x = x0+dx;
		let c = this.get(x, y);
		c = ft(x, y, c);
		if (0 <= c) {
		    let imgsrc = tileset.get(c);
		    if (imgsrc instanceof DummyImageSource) {
			ctx.fillStyle = (imgsrc as DummyImageSource).color;
			ctx.fillRect(bx+ts*dx, by+ts*dy, ts, ts);
		    } else {
			let rect = (imgsrc as HTMLImageSource).bounds;
			let offset = (imgsrc as HTMLImageSource).offset;
			ctx.drawImage((imgsrc as HTMLImageSource).image,
				      rect.x, rect.y, rect.width, rect.height,
				      bx+ts*dx-offset.x, by+ts*dy-offset.y,
				      rect.width, rect.height);
		    }
		}
	    }
	}
    }

    renderFromTopRight(
	ctx: CanvasRenderingContext2D,
	bx: number, by: number,
	tileset: SpriteSheet,
	ft: TilePosTileFunc,
	x0=0, y0=0, w=0, h=0) {
	// Align the pos to the bottom left corner.
	let ts = this.tilesize;
	w = (w != 0)? w : this.width;
	h = (h != 0)? h : this.height;
	// Draw tiles from the top-right first.
	for (let dy = 0; dy < h; dy++) {
	    let y = y0+dy;
	    for (let dx = w-1; 0 <= dx; dx--) {
		let x = x0+dx;
		let c = this.get(x, y);
		c = ft(x, y, c);
		if (0 <= c) {
		    let imgsrc = tileset.get(c);
		    if (imgsrc instanceof DummyImageSource) {
			ctx.fillStyle = (imgsrc as DummyImageSource).color;
			ctx.fillRect(bx+ts*dx, by+ts*dy, ts, ts);
		    } else {
			let rect = (imgsrc as HTMLImageSource).bounds;
			let offset = (imgsrc as HTMLImageSource).offset;
			ctx.drawImage((imgsrc as HTMLImageSource).image,
				      rect.x, rect.y, rect.width, rect.height,
				      bx+ts*dx-offset.x, by+ts*dy-offset.y,
				      rect.width, rect.height);
		    }
		}
	    }
	}
    }


    renderWindowFromBottomLeft(
	ctx: CanvasRenderingContext2D,
	bx: number, by: number,
	window: Rect,
	tileset: SpriteSheet,
	ft: TilePosTileFunc) {
	let ts = this.tilesize;
	let x0 = Math.floor(window.x/ts);
	let y0 = Math.floor(window.y/ts);
	let x1 = Math.ceil((window.x+window.width)/ts);
	let y1 = Math.ceil((window.y+window.height)/ts);
	let fx = x0*ts-window.x;
	let fy = y0*ts-window.y;
	this.renderFromBottomLeft(
	    ctx, bx+fx, by+fy, tileset, ft, 
	    x0, y0, x1-x0+1, y1-y0+1);
    }

    renderWindowFromTopRight(
	ctx: CanvasRenderingContext2D,
	bx: number, by: number,
	window: Rect,
	tileset: SpriteSheet,
	ft: TilePosTileFunc) {
	let ts = this.tilesize;
	let x0 = Math.floor(window.x/ts);
	let y0 = Math.floor(window.y/ts);
	let x1 = Math.ceil((window.x+window.width)/ts);
	let y1 = Math.ceil((window.y+window.height)/ts);
	let fx = x0*ts-window.x;
	let fy = y0*ts-window.y;
	this.renderFromTopRight(
	    ctx, bx+fx, by+fy, tileset, ft, 
	    x0, y0, x1-x0+1, y1-y0+1);
    }
}


//  RangeMap
//
class RangeMap {

    width: number;
    height: number;

    private _data: Int32Array[];
    
    constructor(tilemap: TileMap, f: TileFunc) {
	let data = new Array(tilemap.height+1);
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
	this._data = data;
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
	return (this._data[y1][x1] - this._data[y1][x0] -
		this._data[y0][x1] + this._data[y0][x0]);
    }

    exists(rect: Rect) {
	return (this.get(rect.x, rect.y,
			 rect.x+rect.width,
			 rect.y+rect.height) !== 0);
    }

}
