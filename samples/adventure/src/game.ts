/// <reference path="../../../base/utils.ts" />
/// <reference path="../../../base/geom.ts" />
/// <reference path="../../../base/text.ts" />
/// <reference path="../../../base/scene.ts" />
/// <reference path="../../../base/app.ts" />

//  Adventure
//
//  A simple text adventure game with multiple scenes.
//
let FONT: Font;
let HIFONT: Font;


//  PictureScene
// 
class PictureScene extends GameScene {

    textBox: DialogBox;
    image0: HTMLImageElement = null;
    image1: HTMLImageElement = null;
    alpha: number = 0;

    constructor(app: App) {
	super(app);
	let lineheight = 8;
	let linespace = 4;
	let padding = 8;
	let width = this.screen.width-16;
	let height = (lineheight+linespace)*6-linespace+padding*2;
	let rect = this.screen.resize(width, height, 0, -1).move(0,-8);
	this.textBox = new DialogBox(rect);
	this.textBox.font = FONT;
	this.textBox.hifont = HIFONT;
	this.textBox.padding = padding;
	this.textBox.linespace = linespace;
	this.textBox.background = 'rgba(0,0,0,0.5)'
    }
    
    init() {
	super.init();
	this.add(this.textBox);
    }

    tick(t: number) {
	super.tick(t);
	if (this.alpha < 1.0) {
	    this.alpha = upperbound(1.0, this.alpha+0.05);
	}
    }

    onKeyDown(key: number) {
	super.onKeyDown(key);
	this.textBox.onKeyDown(key);
    }    

    onMouseDown(p: Vec2, button: number) {
	super.onMouseDown(p, button);
	this.textBox.onMouseDown(p, button);
    }    

    onMouseUp(p: Vec2, button: number) {
	super.onMouseUp(p, button);
	this.textBox.onMouseUp(p, button);
    }    

    onMouseMove(p: Vec2) {
	super.onMouseMove(p);
	this.textBox.onMouseMove(p);
    }    

    render(ctx: CanvasRenderingContext2D, bx: number, by: number) {
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(bx, by, this.screen.width, this.screen.height);
	ctx.save();
	if (this.image0 !== null) {
	    ctx.globalAlpha = 1.0-this.alpha;
	    ctx.drawImage(this.image0, bx, by,
			  this.screen.width, this.screen.height);
	}
	if (this.image1 !== null) {
	    ctx.globalAlpha = this.alpha;
	    ctx.drawImage(this.image1, bx, by,
			  this.screen.width, this.screen.height);
	}
	ctx.restore();
	super.render(ctx, bx, by);
	// draw a textbox border.
	let rect = this.textBox.frame.inflate(-2,-2);
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 2;
	ctx.strokeRect(bx+rect.x, by+rect.y, rect.width, rect.height);
    }
    
    changeScene(scene: Scene) {
	if (scene instanceof PictureScene) {
	    scene.image0 = this.image1;
	}
	super.changeScene(scene);
    }
}


//  Scene1
// 
class Scene1 extends PictureScene {
    constructor(app: App) {
	super(app);
	this.image1 = APP.images['scene1'];
    }
    init() {
	super.init();
	this.textBox.addDisplay(
	    'It was a perfect sunny day. '+
	    'I was driving a sleepy countryside.', 10);
	let menu = this.textBox.addMenu();
	menu.addItem(new Vec2(20,30), 'I like an eggplant.');
	menu.addItem(new Vec2(20,40), 'This is nuts.');
	menu.addItem(new Vec2(20,50), 'Gimme a cucumber.');
	menu.selected.subscribe(() => {
	    this.changeScene(new Scene2(this.app));
	});
    }
}

//  Scene2
// 
class Scene2 extends PictureScene {
    constructor(app: App) {
	super(app);
	this.image1 = APP.images['scene2'];
    }
    init() {
	super.init();
	this.textBox.addDisplay(
	    'I was fed up with cities. The beauty of '+
	    'a city makes everyone anonymous.', 10);
	let menu = this.textBox.addMenu();
	menu.addItem(new Vec2(20,40), 'O RLY?');
	menu.addItem(new Vec2(20,50), 'Beautiful quote.');
	menu.addItem(new Vec2(20,60), '43914745.');
	menu.selected.subscribe(() => {
	    this.changeScene(new Scene3(this.app));
	});
    }
}

//  Scene3
// 
class Scene3 extends PictureScene {
    constructor(app: App) {
	super(app);
	this.image1 = APP.images['scene3'];
    }
    init() {
	super.init();
	this.textBox.addDisplay(
	    'But eventually, people can\'t really '+
	    'forget about their loved ones.', 10);
	let menu = this.textBox.addMenu();
	menu.addItem(new Vec2(20,30), 'ZZzzz.');
	menu.addItem(new Vec2(20,40), 'Only if what I think is what you think.');
	menu.addItem(new Vec2(20,50), 'xxThisSucks1729xx');
	menu.selected.subscribe(() => {
	    this.changeScene(new Scene1(this.app));
	});
    }
}


//  Adventure
// 
class Adventure extends Scene {
    
    constructor(app: App) {
	super(app);
	FONT = new Font(APP.images['font'], 'white');
	HIFONT = new InvertedFont(APP.images['font'], 'white');
    }
    
    init() {
	super.init();
	this.changeScene(new Scene1(this.app));
    }
}
