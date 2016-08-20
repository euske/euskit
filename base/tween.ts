/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="entity.ts" />


//  Queue
//  A list of Tasks that runs sequentially.
//
class Queue extends Task {

    tasks: Task[];
    dieWhenEmpty: boolean;

    constructor(tasks: Task[]=null, dieWhenEmpty=true) {
	super();
	this.tasks = (tasks !== null)? tasks : [];
	this.dieWhenEmpty = dieWhenEmpty;
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
	    if (task.alive) break;
	    this.remove(task);
	}
	if (this.dieWhenEmpty && task === null) {
	    this.die();
	}
    }
}


//  Tweener
//  Base class for all tweeners.
//
class Tweener extends Task {
    
    sprite: Sprite;
    
    constructor(sprite: Sprite, lifetime=Infinity) {
	super(lifetime);
	this.sprite = sprite;
    }    
}


//  Blinker
//
class Blinker extends Tweener {

    interval: number;
    
    constructor(sprite: Sprite, interval=1.0, lifetime=Infinity) {
	super(sprite, lifetime);
	this.interval = interval;
    }
    
    update() {
	super.update();
	this.sprite.visible = (phase(this.time, this.interval) == 0);
    }
}
