/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="sprite.ts" />
/// <reference path="entity.ts" />


function makeGlyphs(src: HTMLImageElement, color: string=null,
		    inverted=false)
{
    let dst = createCanvas(src.width, src.height);
    let ctx = getEdgeyContext(dst);
    ctx.clearRect(0, 0, dst.width, dst.height);
    ctx.drawImage(src, 0, 0);
    if (color !== null) {
	ctx.globalCompositeOperation = (inverted)? 'source-out' : 'source-in';
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, dst.width, dst.height);
    }
    return dst;
}


//  Font
//
class Font {

    width: number;
    height: number;
    background: string = null;

    protected _csize: number;
    protected _glyphs: HTMLCanvasElement;
    
    constructor(glyphs: HTMLImageElement, color: string=null, scale=1) {
	this._csize = glyphs.height;
	this.width = this._csize*scale;
	this.height = this._csize*scale;
	this.initGlyphs(glyphs, color);
    }

    getSize(text: string) {
	return new Vec2(this.width * text.length, this.height);
    }

    initGlyphs(glyphs: HTMLImageElement, color: string=null) {
	this._glyphs = makeGlyphs(glyphs, color);
    }

    renderString(
	ctx: CanvasRenderingContext2D,
	text: string, x: number, y: number) {
	this.renderBackground(ctx, text, x, y);
	this.renderGlyphs(ctx, this._glyphs, this._csize, text, x, y);
    }
  
    renderBackground(
	ctx: CanvasRenderingContext2D,
	text: string, x: number, y: number) {
	if (this.background !== null) {
	    let size = this.getSize(text);
	    ctx.fillStyle = this.background;
	    ctx.fillRect(x, y, size.x, size.y);
	}
    }

    renderGlyphs(
	ctx: CanvasRenderingContext2D,
	glyphs: HTMLCanvasElement, csize: number,
	text: string, x: number, y: number) {
	for (let i = 0; i < text.length; i++) {
	    let c = text.charCodeAt(i)-32;
	    ctx.drawImage(glyphs,
			  c*csize, 0, csize, glyphs.height,
			  x+this.width*i, y, this.width, this.height);
	}
    }
}


//  InvertedFont
//
class InvertedFont extends Font {

    initGlyphs(glyphs: HTMLImageElement, color: string=null) {
	this._glyphs = makeGlyphs(glyphs, color, true);
    }
}


//  ShadowFont
//
class ShadowFont extends Font {

    shadowDist: number;
    
    private _glyphs2: HTMLCanvasElement;
    
    constructor(glyphs: HTMLImageElement, color: string=null, scale=1,
		shadowColor='black', shadowDist=1) {
	super(glyphs, color, scale);
	this.shadowDist = shadowDist;
	this._glyphs2 = makeGlyphs(glyphs, shadowColor);
    }

    getSize2(text: string) {
	let size = super.getSize(text);
	return size.move(this.shadowDist, this.shadowDist);
    }
  
    renderString(
	ctx: CanvasRenderingContext2D,
	text: string, x: number, y: number) {
	this.renderBackground(ctx, text, x, y);
	this.renderGlyphs(ctx, this._glyphs2, this._csize, text,
			  x+this.shadowDist, y+this.shadowDist);
	this.renderGlyphs(ctx, this._glyphs, this._csize, text, x, y);
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
class TextBox implements ImageSource {

    frame: Rect;
    font: Font;
    header: string = '';
    lineSpace: number = 0;
    padding: number = 0;
    background: string = null;
    borderColor: string = null;
    borderWidth: number = 2;
    segments: TextSegment[] = [];
    
    constructor(frame: Rect, font: Font=null) {
	this.frame = frame.copy();
	this.font = font;
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
	    h = h+size.y+this.lineSpace;
	}
	return new Vec2(w, h-this.lineSpace);
    }

    getBounds() {
	return this.frame;
    }
  
    getInnerBounds() {
	return this.frame.inflate(-this.padding, -this.padding);
    }
  
    render(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.translate(int(this.frame.x), int(this.frame.y));
	if (this.background !== null) {
	    ctx.fillStyle = this.background;
	    ctx.fillRect(0, 0, this.frame.width, this.frame.height);
	}
	if (this.borderColor !== null) {
	    let b = this.borderWidth;
	    ctx.strokeStyle = 'white';
	    ctx.lineWidth = b;
	    ctx.strokeRect(-b, -b, this.frame.width+b*2, this.frame.height+b*2);
	}
	for (let seg of this.segments) {
	    seg.font.renderString(ctx, seg.text,
				  this.padding+seg.bounds.x, this.padding+seg.bounds.y);
	}
	ctx.restore();
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
	let height = this.frame.height-this.padding*2;
	let y = 0;
	if (this.segments.length !== 0) {
	    y = this.segments[this.segments.length-1].bounds.y1()+this.lineSpace;
	}
	let newseg = this.addSegment(new Vec2(0, y), '', font);
	let dy = newseg.bounds.y1() - height;
	if (0 < dy) {
	    // scrolling.
	    this.segments = this.segments.filter((seg) => {
		seg.bounds.y -= dy;
		return 0 <= seg.bounds.y;
	    });
	}
	return newseg;
    }

    addText(text: string, font: Font=null) {
	font = (font !== null)? font : this.font;
	let width = this.frame.width-this.padding*2;
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
	    if (last === null || width < last.bounds.x1()+size.x) {
		last = this.addNewline(font);
	    } else if (last.font !== font) {
		let pt = new Vec2(last.bounds.x1(), last.bounds.y);
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
	let width = this.frame.width-this.padding*2;
	while (true) {
	    let m = word.exec(text);
	    if (m == null) {
		a.push(line+text);
		break;
	    }
	    let i = m.index+m[0].length
	    let w = text.substr(0, i);
	    let size = font.getSize(w);
	    if (width < x+size.x) {
		a.push(line);
		line = header;
		x = font.getSize(line).x;
	    }
	    line += w;
	    x += size.x;
	    text = text.substr(i);
	}
	return a;
    }

    wrapLines(text: string, font: Font=null, header: string=null) {
	let x = ((this.segments.length === 0)? 0 :
		 this.segments[this.segments.length-1].bounds.x1());
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
	let width = this.frame.width-this.padding*2;
	let height = this.frame.height-this.padding*2;
	let y = 0;
	switch (valign) {
	case 'center':
	    y += (height-this.getSize(lines, font).y)/2;
	    break;
	case 'bottom':
	    y += height-this.getSize(lines, font).y;
	    break;
	}
	for (let text of lines) {
	    let size = font.getSize(text);
	    let x = 0;
	    switch (halign) {
	    case 'center':
		x += (width-size.x)/2;
		break;
	    case 'right':
		x += width-size.x;
		break;
	    }
	    let bounds = new Rect(x, y, size.x, size.y);
	    this.segments.push({bounds:bounds, text:text, font:font});
	    y += size.y+this.lineSpace;
	}
    }

}


//  BannerBox
//
class BannerBox extends Widget {

    textbox: TextBox;
    sprite: FixedSprite;
    interval: number = 0;
    
    constructor(frame: Rect, font: Font, lines: string[], lineSpace=4) {
	super();
	this.textbox = new TextBox(frame, font);
	this.textbox.lineSpace = lineSpace;
	this.textbox.putText(lines, 'center', 'center');
	this.sprite = new FixedSprite(this.textbox);
    }

    getSprites(): Sprite[] {
	let sprites = super.getSprites();
	if (this.sprite !== null) {
	    sprites.push(this.sprite);
	}
	return sprites;
    }

    update() {
	super.update();
	if (0 < this.interval) {
	    this.sprite.visible = (phase(this.getTime(), this.interval) != 0);
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

    onKeyDown(key: number) {
	this.ff();
    }

    onMouseDown(p: Vec2, button: number) {
	this.ff();
    }

    onMouseUp(p: Vec2, button: number) {
    }
    
    onMouseMove(p: Vec2) {
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
	this.stop();
    }

}


//  DisplayTask
//
class DisplayTask extends TextTask {

    text: string;
    font: Font;
    speed: number = 0;
    sound: string = null;
    private _index: number = 0;

    constructor(dialog: DialogBox, text: string) {
	super(dialog);
	this.text = text;
	this.font = dialog.textbox.font;
    }

    start() {
	super.start();
	this.text = this.dialog.textbox.wrapLines(this.text, this.font)
    }

    update() {
	super.update();
	if (this.text.length <= this._index) {
	    this.stop();
	} else if (this.speed === 0) {
	    this.ff();
	} else {
	    let n = this.getTime()*this.speed;
	    let sound = false;
	    while (this._index < n) {
		let c = this.text.substr(this._index, 1);
		this.dialog.textbox.addText(c, this.font);
		this._index++;
		sound = sound || (/\w/.test(c));
	    }
	    if (sound && this.sound !== null) {
		APP.playSound(this.sound);
	    }
	}
    }

    ff() {
	while (this._index < this.text.length) {
	    this.dialog.textbox.addText(this.text.substr(this._index, 1), this.font);
	    this._index++;
	}
	this.stop();
    }

}


//  MenuTask
//
class MenuItem {
    
    pos: Vec2;
    text: string;
    value: any;
    seg: TextSegment = null;

    constructor(pos: Vec2, text: string, value: any) {
	this.pos = pos.copy();
	this.text = text;
	this.value = value;
    }
}

class MenuTask extends TextTask {

    selected: Signal;
    vertical: Boolean = true;
    items: MenuItem[] = [];
    current: MenuItem = null;
    focus: MenuItem = null;
    sound: string = null;
    
    constructor(dialog: DialogBox) {
	super(dialog);
	this.selected = new Signal(this);
    }

    addItem(pos: Vec2, text: string, value: any=null) {
	value = (value !== null)? value : text;
	let item = new MenuItem(pos, text, value);
	this.items.push(item);
	if (2 <= this.items.length) {
	    let item0 = this.items[0];
	    let item1 = this.items[this.items.length-1];
	    this.vertical = (Math.abs(item0.pos.x - item1.pos.x) <
			     Math.abs(item0.pos.y - item1.pos.y));
	}
	return item;
    }

    start() {
	super.start();
	for (let item of this.items) {
	    item.seg = this.dialog.textbox.addSegment(item.pos, item.text);
	}
	this.updateSelection();
    }

    onKeyDown(key: number) {
	let d = 0;
	let keysym = getKeySym(key);
	switch (keysym) {
	case KeySym.Left:
	    d = (this.vertical)? -Infinity : -1;
	    break;
	case KeySym.Right:
	    d = (this.vertical)? +Infinity : +1;
	    break;
	case KeySym.Up:
	    d = (this.vertical)? -1 : -Infinity;
	    break;
	case KeySym.Down:
	    d = (this.vertical)? +1 : +Infinity;
	    break;
	case KeySym.Action1:
	case KeySym.Action2:
	    if (this.current !== null) {
		this.stop();
		this.selected.fire(this.current.value);
	    };
	    return;
	case KeySym.Cancel:
	    this.stop();
	    this.selected.fire(null);
	    return;
	}

	let i:number = 0;
	if (this.current !== null) {
	    i = this.items.indexOf(this.current);
	    i = clamp(0, i+d, this.items.length-1);
	}
	this.current = this.items[i];
	this.updateSelection();
	if (this.sound !== null) {
	    APP.playSound(this.sound);
	}
    }

    onMouseDown(p: Vec2, button: number) {
	this.updateFocus(p);
	this.updateSelection();
	if (button == 0 && this.focus !== null) {
	    this.current = this.focus;
	}
    }

    onMouseUp(p: Vec2, button: number) {
	this.updateFocus(p);
	this.updateSelection();
	if (button == 0 && this.focus !== null) {
	    if (this.current === this.focus) {
		this.stop();
		this.selected.fire(this.current.value);
	    }
	}
    }
    
    onMouseMove(p: Vec2) {
	this.updateFocus(p);
	this.updateSelection();
    }

    updateFocus(p: Vec2) {
	for (let item of this.items) {
	    if (item.seg !== null) {
		if (item.seg.bounds.inflate(1,1).containsPt(p)) {
		    this.focus = item;
		    return;
		}
	    }
	}
	this.focus = null;
    }

    updateSelection() {
	for (let item of this.items) {
	    if (item === this.current ||
		item === this.focus) {
		item.seg.font = this.dialog.hiFont;
	    } else {
		item.seg.font = this.dialog.textbox.font;
	    }
	}
    }
}


class WaitTask extends TextTask {

    ended: Signal;
    
    constructor(dialog: DialogBox) {
	super(dialog);
	this.ended = new Signal(this);
    }

    onKeyDown(key: number) {
	let keysym = getKeySym(key);
	switch (keysym) {
	case KeySym.Action1:
	case KeySym.Action2:
	case KeySym.Cancel:
	    this.stop();
	    this.ended.fire();
	    return;
	}
    }

    onMouseUp(p: Vec2, button: number) {
	if (button == 0) {
	    this.stop();
	    this.ended.fire();
	}
    }
}


//  DialogBox
//
class DialogBox extends Widget {

    textbox: TextBox;
    sprite: FixedSprite;
    hiFont: Font;
    speed: number = 0;
    autoHide: boolean = false;
    sound: string = null;
    queue: TextTask[] = [];
    
    constructor(textbox: TextBox, hiFont: Font=null) {
	super();
        this.sprite = new FixedSprite(textbox);
	this.textbox = textbox;
	this.hiFont = hiFont;
    }

    clear() {
	this.textbox.clear();
	this.queue = [];
    }

    getSprites(): Sprite[] {
	let sprites = super.getSprites();
	sprites.push(this.sprite);
	return sprites;
    }

    tick() {
	super.tick();
	let task:TextTask = null;
	while (true) {
	    task = this.getCurrentTask();
	    if (task === null) break;
	    if (task.isScheduled()) {
		task.start();
	    }
	    if (task.isRunning()) {
		task.tick();
		break;
	    }
	    this.removeTask(task);
	}
	if (this.autoHide && task === null) {
	    this.sprite.visible = false;
	}
    }

    onKeyDown(key: number) {
	let task = this.getCurrentTask();
	if (task !== null) {
	    task.onKeyDown(key);
	}
    }

    onMouseDown(p: Vec2, button: number) {
	let task = this.getCurrentTask();
	if (task !== null) {
	    let bounds = this.textbox.getInnerBounds();
	    p = p.move(-bounds.x, -bounds.y);
	    task.onMouseDown(p, button);
	}
    }
    
    onMouseUp(p: Vec2, button: number) {
	let task = this.getCurrentTask();
	if (task !== null) {
	    let bounds = this.textbox.getInnerBounds();
	    p = p.move(-bounds.x, -bounds.y);
	    task.onMouseUp(p, button);
	}
    }
    
    onMouseMove(p: Vec2) {
	let task = this.getCurrentTask();
	if (task !== null) {
	    let bounds = this.textbox.getInnerBounds();
	    p = p.move(-bounds.x, -bounds.y);
	    task.onMouseMove(p);
	}
    }
    
    ff() {
	while (true) {
	    let task = this.getCurrentTask();
	    if (task === null) break;
	    if (task.isScheduled()) {
		task.start();
	    }
	    task.ff();
	    if (task.isRunning()) break;
	    this.removeTask(task);
	}
    }

    getCurrentTask() {
	return (0 < this.queue.length)? this.queue[0] : null;
    }

    addTask(task: TextTask) {
	task.tasklist = this.tasklist;
	this.queue.push(task);
	if (this.autoHide) {
	    this.sprite.visible = true;
	}
    }
    
    removeTask(task: TextTask) {
	removeElement(this.queue, task);
	if (this.autoHide && this.queue.length == 0) {
	    this.sprite.visible = false;
	}
    }

    addPause(duration: number) {
	let task = new PauseTask(this, duration);
	this.addTask(task);
	return task;
    }

    addDisplay(text: string, speed=16,
	       sound: string=null, font: Font=null) {
	let task = new DisplayTask(this, text);
	task.speed = (0 <= speed)? speed : this.speed;
	task.sound = (sound !== null)? sound : this.sound;
	task.font = (font !== null)? font : this.textbox.font;
	this.addTask(task);
	return task;
    }

    addMenu() {
	let task = new MenuTask(this);
	this.addTask(task);
	return task;
    }

    addWait() {
	let task = new WaitTask(this);
	this.addTask(task);
	return task;
    }
}
