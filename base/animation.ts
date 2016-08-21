/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="entity.ts" />


//  Queue
//  A list of Tasks that runs sequentially.
//
class Queue extends Task {

    tasks: Task[];
    stopWhenEmpty: boolean = true;

    constructor(tasks: Task[]=null) {
	super();
	this.tasks = (tasks !== null)? tasks : [];
    }
  
    add(task: Task) {
	this.tasks.push(task);
	return this;
    }
  
    remove(task: Task) {
	removeElement(this.tasks, task);
	return this;
    }

    clear() {
	this.tasks = [];
	return this;
    }

    getCurrentTask() {
	return (0 < this.tasks.length)? this.tasks[0] : null;
    }

    tick(t: number) {
	let task:Task = null;
	while (true) {
	    task = this.getCurrentTask();
	    if (task === null) break;
	    if (task.layer === null) {
		task.start(this.layer);
	    }
	    task.tick(t);
	    if (task.running) break;
	    this.remove(task);
	}
	if (this.stopWhenEmpty && task === null) {
	    this.stop();
	}
    }
}


//  Animator
//  Base class for all animator.
//
class Animator extends Task {
    
    sprite: Sprite;
    
    constructor(sprite: Sprite) {
	super();
	this.sprite = sprite;
    }    
}


//  Blinker
//
class Blinker extends Animator {

    interval: number = 1.0;
    
    update() {
	super.update();
	this.sprite.visible = (phase(this.time, this.interval) == 0);
    }
}


//  Tweener
//
class Tweener extends Animator {

    srcpos: Vec2 = null;
    dstpos: Vec2 = null;
    
    start(layer: Layer) {
	super.start(layer);
	this.srcpos = this.sprite.pos.copy();
    }
    
    update() {
	super.update();
	if (this.srcpos !== null && this.dstpos !== null) {
	    let t = this.time / this.lifetime;
	    this.sprite.pos = this.getPos(t);
	}
    }

    getPos(t: number) {
	return this.srcpos.interp(this.dstpos, t);
    }
}
