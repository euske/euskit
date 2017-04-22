/// <reference path="utils.ts" />


/** Object that represents a continuous process.
 *  tick() method is invoked at every frame.
 */
class Task {

    /** True if the task is running. */
    running: boolean = true;
    /** List to which this task belongs. */
    tasklist: TaskList = null;
    /** Lifetime. 
     * This task automatically terminates itself after
     * the time specified here passes. */
    lifetime: number = Infinity;
    /** Start time. */
    startTime: number = 0;
    /** Signal object which is fired when this task stops. */
    stopped: Signal;

    constructor() {
	this.stopped = new Signal(this);
    }

    toString() {
	return '<Task: time='+this.getTime()+'>';
    }

    /** Returns the number of seconds elapsed since 
     * this task has started. */
    getTime() {
	return (getTime() - this.startTime);
    }

    /** Invoked when the task is started. */
    init() {
	this.startTime = getTime();
    }

    /** Terminates the task. */
    stop() {
	if (this.running) {
	    this.running = false;
	    this.stopped.fire();
	}
    }

    /** Schedules another task right after this task. 
     * @param next Next Task.
     */
    chain(next: Task): Task {
	if (this.running) {
	    this.stopped.subscribe(() => {
		if (this.tasklist !== null) {
		    this.tasklist.add(next)
		}
	    });
	} else {
            // Start immediately if this task has already finished.
	    if (this.tasklist !== null) {
		this.tasklist.add(next)
	    }
	}
	return next;
    }
  
    /** Invoked at every frame while the task is running. */
    tick() {
	this.update();
	if (this.lifetime <= this.getTime()) {
	    this.stop();
	}
    }
  
    update() {
	// [OVERRIDE]
    }

}


/** Task that does something after a specified
 *  amount of time.
 */
class DelayTask extends Task {

    /** Constructor.
     * @param delay Number of seconds to delay.
     * @param proc Function to be executed after
     *        the time has passed.
     */
    constructor(delay: number, proc: ()=>void=null) {
	super();
	this.lifetime = delay;
	if (proc !== null) {
	    this.stopped.subscribe(proc);
	}
    }
}


/** Task that plays a sound.
 */
class SoundTask extends Task {

    /** Sound object to play. */
    sound: HTMLAudioElement;
    /** Start time of the sound. */
    startTime: number;
    
    /** Constructor.
     * @param sound Sound object to play.
     * @param startTime Start time of the sound.
     */
    constructor(sound: HTMLAudioElement, startTime: number=MP3_GAP) {
	super();
	this.sound = sound;
	this.startTime = startTime;
    }

    init() {
	super.init();
	playSound(this.sound, this.startTime);
    }

    update() {
	super.update();
	if (this.sound.ended) {
	    this.stop();
	}
    }

    stop() {
	this.sound.pause();
	super.stop();
    }
}


/** List of Tasks that run parallely.
 */
class TaskList {

    /** List of current tasks. */
    tasks: Task[] = [];

    toString() {
	return ('<TaskList: tasks='+this.tasks+'>');
    }

    /** Empties the task list. */
    init() {
	this.tasks = [];
    }
    
    /** Invoked at every frame. Update the current tasks. */
    tick() {
	for (let task of this.tasks) {
	    if (task.tasklist === null) {
		task.tasklist = this;
		task.init();
	    }
	    if (task.running) {
		task.tick();
	    }
	}
        
        // Remove the finished tasks from the list.
	this.tasks = this.tasks.filter((task: Task) => { return task.running; });
    }

    /** Add a new Task to the list.
     * @param task Task to add.
     */
    add(task: Task) {
	this.tasks.push(task);
    }

    /** Remove an existing Task from the list.
     * @param task Task to remove.
     */
    remove(task: Task) {
	removeElement(this.tasks, task);
    }
}


/** List of Tasks that run sequentially.
 */
class TaskQueue extends Task {

    /** List of current tasks. */
    tasks: Task[];
    /** If true, this task is stopped when the list becomes empty. */
    stopWhenEmpty: boolean = true;

    /** Constructor.
     * @param tasks List of tasks. (optional)
     */
    constructor(tasks: Task[]=null) {
	super();
	this.tasks = (tasks !== null)? tasks : [];
    }
  
    /** Add a new Task to the list.
     * @param task Task to add.
     */
    add(task: Task) {
	this.tasks.push(task);
	return this;
    }
  
    /** Remove an existing Task from the list.
     * @param task Task to remove.
     */
    remove(task: Task) {
	removeElement(this.tasks, task);
	return this;
    }

    /** Empties the task list. */
    clear() {
	this.tasks = [];
	return this;
    }

    /** Returns the task that is currently running
     * (or null if empty) */
    getCurrentTask() {
	return (0 < this.tasks.length)? this.tasks[0] : null;
    }

    /** Invoked at every frame. Update the current tasks. */
    tick() {
	let task:Task = null;
	while (true) {
	    task = this.getCurrentTask();
	    if (task === null) break;
            // Starts the next task.
	    if (task.tasklist === null) {
		task.tasklist = this.tasklist;
		task.init();
	    }
	    if (task.running) {
		task.tick();
		break;
	    }
            // Finishes the current task.
	    this.remove(task);
	}
        
        // Terminates itself then the list is empty.
	if (this.stopWhenEmpty && task === null) {
	    this.stop();
	}
    }
}
