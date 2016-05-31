/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="entity.ts" />


function MakeGlyphs(src: HTMLImageElement, color: string)
{
  let dst = createCanvas(src.width, src.height);
  let ctx = getEdgeyContext(dst);
  ctx.clearRect(0, 0, dst.width, dst.height);
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, dst.width, dst.height);
  return dst;
}


//  Font
//
class Font {

    width: number;
    height: number;
    protected _width0: number;
    protected _height0: number;
    private _glyphs: HTMLCanvasElement;
    
    constructor(glyphs: HTMLImageElement, color: string=null, scale=1) {
	this._width0 = glyphs.height;
	this._height0 = glyphs.height;
	this.width = scale*this._width0;
	this.height = scale*this._height0;
	if (color === null) {
	    this._glyphs = createCanvas(glyphs.width, glyphs.height);
	    let ctx = getEdgeyContext(this._glyphs);
	    ctx.clearRect(0, 0, glyphs.width, glyphs.height);
	    ctx.drawImage(glyphs, 0, 0);
	} else {
	    this._glyphs = MakeGlyphs(glyphs, color);
	}
    }

    getSize(text: string) {
	return new Vec2(this.width * text.length, this.height);
    }
  
    renderString(ctx: CanvasRenderingContext2D,
		 text: string, x: number, y: number) {
	for (let i = 0; i < text.length; i++) {
	    let c = text.charCodeAt(i)-32;
	    ctx.drawImage(this._glyphs,
			  c*this._width0, 0, this._width0, this._height0,
			  x+this.width*i, y, this.width, this.height);
	}
    }

}


//  ShadowFont
//
class ShadowFont extends Font {

    shadowdist: number;
    private _glyphs2: HTMLCanvasElement;
    
    constructor(glyphs: HTMLImageElement, color: string=null, scale=1,
		shadowcolor='black', shadowdist=1) {
	super(glyphs, color, scale);
	this._glyphs2 = MakeGlyphs(glyphs, shadowcolor);
	this.shadowdist = shadowdist;
    }

    getSize2(text: string) {
	let size = super.getSize(text);
	return size.move(this.shadowdist, this.shadowdist);
    }
  
    renderString(ctx: CanvasRenderingContext2D, 
		 text: string, x: number, y: number) {
	let x1 = x+this.shadowdist;
	let y1 = y+this.shadowdist;
	for (let i = 0; i < text.length; i++) {
	    let c = text.charCodeAt(i)-32;
	    ctx.drawImage(this._glyphs2,
			  c*this._width0, 0, this._width0, this._height0,
			  x1+this.width*i, y1, this.width, this.height);
	}
	super.renderString(ctx, text, x, y);
    }

}


//  TextSegment
//
class TextSegment {

    bounds: Rect;
    text: string;
    font: Font;

    constructor(p: Vec2, text: string, font: Font) {
	let size = font.getSize(text);
	this.bounds = new Rect(p.x, p.y, size.x, size.y);
	this.text = text;
	this.font = font;
    }
}


//  TextBox
//
class TextBox extends Sprite {

    frame: Rect;
    font: Font;
    header: string;
    linespace: number = 0;
    padding: number = 0;
    background: string = null;
    segments: TextSegment[] = [];
    
    constructor(frame: Rect, font: Font, header='') {
	super(null);
	this.frame = frame;
	this.font = font;
	this.header = header;
    }

    toString() {
	return '<TextBox: '+this.frame+'>';
    }

    getSize(lines: string[], font: Font=null) {
	font = (font !== null)? font : this.font;
	let w = 0, h = 0;
	for (let i = 0; i < lines.length; i++) {
	    let size = font.getSize(lines[i]);
	    w = Math.max(w, size.x);
	    h = h+size.y+this.linespace;
	}
	return new Vec2(w, h-this.linespace);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	if (this.bounds !== null) {
	    bx += this.bounds.x;
	    by += this.bounds.y;
	}
	if (this.background !== null) {
	    let rect = this.frame.inflate(this.padding, this.padding);
	    ctx.fillStyle = this.background;
	    ctx.fillRect(bx+rect.x, by+rect.y, rect.width, rect.height);
	}
	for (let i = 0; i < this.segments.length; i++) {
	    let seg = this.segments[i];
	    seg.font.renderString(ctx, seg.text, bx+seg.bounds.x, by+seg.bounds.y);
	}
    }

    clear() {
	this.segments = [];
    }

    add(seg: TextSegment) {
	this.segments.push(seg);
    }

    addSegment(p: Vec2, text: string, font: Font=null) {
	font = (font !== null)? font : this.font;
	let seg = new TextSegment(p, text, font);
	this.add(seg);
	return seg;
    }

    addNewline(font: Font=null) {
	font = (font !== null)? font : this.font;
	let x = this.frame.x;
	let y = this.frame.y;
	if (this.segments.length !== 0) {
	    y = this.segments[this.segments.length-1].bounds.bottom()+this.linespace;
	}
	let newseg = this.addSegment(new Vec2(x, y), '', font);
	let dy = newseg.bounds.bottom() - this.frame.bottom();
	if (0 < dy) {
	    for (let i = this.segments.length-1; 0 <= i; i--) {
		let seg = this.segments[i];
		seg.bounds.y -= dy;
		if (seg.bounds.y < this.frame.y) {
		    this.segments.splice(i, 1);
		}
	    }
	}
	return newseg;
    }

    addText(text: string, font: Font) {
	font = (font !== null)? font : this.font;
	let rx = this.frame.right();
	for (let i = 0; i < text.length; ) {
	    if (text[i] == '\n') {
		this.addNewline(font);
		i++;
		continue;
	    }
	    let j = text.indexOf('\n', i);
	    if (j < 0) {
		j = text.length; 
	    }
	    let s = text.substring(i, j);
	    let size = font.getSize(s);
	    let last = ((this.segments.length === 0)? null :
			this.segments[this.segments.length-1]);	
	    if (last === null || rx < last.bounds.right()+size.x) {
		last = this.addNewline(font);
	    } else if (last.font !== font) {
		let pt = new Vec2(last.bounds.right(), last.bounds.y);
		last = this.addSegment(pt, '', font);
	    }
	    last.text += s;
	    last.bounds.width += size.x;
	    last.bounds.height = Math.max(last.bounds.height, size.y);
	    i = j;
	}
    }
  
    splitWords(x: number, text: string,
	       font: Font=null, header: string=null) {
	font = (font !== null)? font : this.font;
	header = (header !== null)? header : this.header;
	let line = '';
	let a:string[] = [];
	let word = /\w+\W*/;
	while (true) {
	    let m = word.exec(text);
	    if (m == null) {
		a.push(line+text);
		break;
	    }
	    let i = m.index+m[0].length
	    let w = text.substr(0, i);
	    let size = font.getSize(w);
	    if (this.frame.width < x+size.x) {
		a.push(line);
		line = header;
		size = font.getSize(line);
		x = this.frame.x+size.x;
	    }
	    line += w;
	    x += size.x;
	    text = text.substr(i);
	}
	return a;
    }

    wrapLines(text: string, font: Font=null, header: string=null) {
	let x = ((this.segments.length === 0)? 0 :
		 this.segments[this.segments.length-1].bounds.right());
	let a = this.splitWords(x, text, font, header);
	let s = '';
	for (let i = 0; i < a.length; i++) {
	    if (i != 0) {
		s += '\n';
	    }
	    s += a[i];
	}
	return s;
    }

    putText(lines: string[],
	    halign='left',
	    valign='top',
	    font: Font=null) {
	font = (font !== null)? font : this.font;
	let y = this.frame.y;
	switch (valign) {
	case 'center':
	    y += (this.frame.height-this.getSize(lines, font).y)/2;
	    break;
	case 'bottom':
	    y += this.frame.height-this.getSize(lines, font).y;
	    break;
	}
	for (let i = 0; i < lines.length; i++) {
	    let text = lines[i];
	    let size = font.getSize(text);
	    let x = this.frame.x;
	    switch (halign) {
	    case 'center':
		x += (this.frame.width-size.x)/2;
		break;
	    case 'right':
		x += this.frame.width-size.x;
		break;
	    }
	    let bounds = new Rect(x, y, size.x, size.y);
	    this.segments.push({bounds:bounds, text:text, font:font});
	    y += size.y+this.linespace;
	}
    }

}


//  TextTask
//
class TextTask extends Task {

    dialog: DialogBox;
    
    constructor(dialog: DialogBox) {
	super();
	this.dialog = dialog;
    }

    ff() {
    }

    keydown(key: number) {
	this.ff();
    }

}


//  PauseTask
//
class PauseTask extends TextTask {

    constructor(dialog: DialogBox, duration: number) {
	super(dialog);
	this.lifetime = duration;
    }

    ff() {
	this.die();
    }

}


//  DisplayTask
//
class DisplayTask extends TextTask {

    text: string;
    font: Font;
    interval: number = 0;
    sound: HTMLAudioElement = null;
    private _index: number = 0;

    constructor(dialog: DialogBox, text: string) {
	super(dialog);
	this.text = text;
	this.font = dialog.font;
    }

    tick() {
	this.ticks++;
	if (this.text.length <= this._index) {
	    this.die();
	} else if (this.interval === 0) {
	    this.ff();
	} else if ((this.ticks % this.interval) === 0) {
	    let c = this.text.substr(this._index, 1);
	    this.dialog.addText(c, this.font);
	    this._index++;
	    if (/\w/.test(c) && this.sound !== null) {
		playSound(this.sound);
	    }
	}
    }

    ff() {
	while (this._index < this.text.length) {
	    this.dialog.addText(this.text.substr(this._index, 1), this.font);
	    this._index++;
	}
	this.die();
    }

}


//  MenuTask
//
class MenuItem {
    
    pos: Vec2;
    text: string;
    value: any;

    constructor(pos: Vec2, text: string, value: any) {
	this.pos = pos;
	this.text = text;
	this.value = value;
    }
}

class MenuTask extends TextTask {

    font: Font;
    cursor: TextSegment;
    selected: Slot;
    vertical: boolean = false;
    items: MenuItem[] = [];
    current: MenuItem = null;
    sound: HTMLAudioElement = null;
    
    constructor(dialog: DialogBox) {
	super(dialog);
	this.font = dialog.font;
	this.cursor = new TextSegment(new Vec2(), '>', this.font);
	this.selected = new Slot(this);
    }

    addItem(pos: Vec2, text: string, value: any=null) {
	value = (value !== null)? value : text;
	let item = new MenuItem(pos, text, value);
	this.items.push(item);
	return item;
    }

    start(layer: Layer) {
	super.start(layer);
	for (let i = 0; i < this.items.length; i++) {
	    let item = this.items[i];
	    this.dialog.addSegment(item.pos, item.text, this.font);
	}
	this.updateCursor();
    }

    ff() {
    }
  
    keydown(key: number) {
	let d = 0;
	let keysym = getKeySym(key);
	switch (keysym) {
	case KeySym.Left:
	    d = (this.vertical)? -999 : -1;
	    break;
	case KeySym.Right:
	    d = (this.vertical)? +999 : +1;
	    break;
	case KeySym.Up:
	    d = (this.vertical)? -1 : -999;
	    break;
	case KeySym.Down:
	    d = (this.vertical)? +1 : +999;
	    break;
	case KeySym.Action:
	    if (this.current !== null) {
		this.die();
		this.selected.signal(this.current.value);
	    };
	    return;
	case KeySym.Cancel:
	    this.die();
	    this.selected.signal(null);
	    return;
	}
	
	let i = ((this.current === null)? 0 : 
		 this.items.indexOf(this.current));
	i = clamp(0, i+d, this.items.length-1);
	this.current = this.items[i];
	this.updateCursor();
	if (this.sound !== null) {
	    playSound(this.sound);
	}
    }

    updateCursor() {
	if (this.current !== null) {
	    this.cursor.bounds.x = this.current.pos.x - this.cursor.bounds.width*2;
	    this.cursor.bounds.y = this.current.pos.y;
	    this.dialog.cursor = this.cursor;
	}
    }

}


//  DialogBox
//
class DialogBox extends TextBox {

    interval: number = 0;
    autohide: boolean = false;
    sound: HTMLAudioElement = null;
    queue: TextTask[] = [];
    cursor: TextSegment = null;
    blinking: number = 0;
    
    constructor(frame: Rect, font: Font, header='') {
	super(frame, font, header);
    }

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	super.render(ctx, bx, by);
	let cursor = this.cursor;
	if (cursor !== null) {
	    if (this.bounds !== null) {
		bx += this.bounds.x;
		by += this.bounds.y;
	    }
	    if (phase(this.ticks, this.blinking)) {
		cursor.font.renderString(
		    ctx, cursor.text,
		    bx+cursor.bounds.x, by+cursor.bounds.y);
	    }
	}
    }

    clear() {
	super.clear();
	this.queue = [];
	this.cursor = null;
    }

    tick() {
	super.tick();
	let task:TextTask = null;
	while (true) {
	    task = this.getCurrentTask();
	    if (task === null) break;
	    if (task.layer === null) {
		task.start(this.layer);
	    }
	    task.tick();
	    if (task.alive) break;
	    this.removeTask(task);
	}
	if (this.autohide && task === null) {
	    this.visible = false;
	}
    }

    keydown(key: number) {
	while (true) {
	    let task = this.getCurrentTask();
	    if (task === null) break;
	    if (task.layer === null) {
		task.start(this.layer);
	    }
	    task.keydown(key);
	    if (task.alive) break;
	    this.removeTask(task);
	    break;
	}
    }

    ff() {
	while (true) {
	    let task = this.getCurrentTask();
	    if (task === null) break;
	    if (task.layer === null) {
		task.start(this.layer);
	    }
	    task.ff();
	    if (task.alive) break;
	    this.removeTask(task);
	}
    }

    getCurrentTask() {
	return (0 < this.queue.length)? this.queue[0] : null;
    }

    addTask(task: TextTask) {
	this.queue.push(task);
	if (this.autohide) {
	    this.visible = true;
	}
    }
    
    removeTask(task: TextTask) {
	removeElement(this.queue, task);
	if (this.autohide && this.queue.length == 0) {
	    this.visible = false;
	}
    }

    addPause(ticks: number) {
	let task = new PauseTask(this, ticks);
	this.addTask(task);
	return task;
    }

    addDisplay(text: string, interval=-1,
	       sound: HTMLAudioElement=null, font: Font=null) {
	let task = new DisplayTask(this, text);
	task.interval = (0 <= interval)? interval : this.interval;
	task.sound = (sound !== null)? sound : this.sound;
	task.font = (font !== null)? font : this.font;
	this.addTask(task);
	return task;
    }

    addMenu(font: Font=null) {
	let task = new MenuTask(this);
	task.font = (font !== null)? font : this.font;
	this.addTask(task);
	return task;
    }

}
