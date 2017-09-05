/// <reference path="utils.ts" />


enum TaskState {
    Scheduled,
    Running,
    Finished,
}

interface TaskList {
    /** Add a new Task to the list.
     * @param task Task to add.
     */
    add(task: Task): void;

    /** Remove an existing Task from the list.
     * @param task Task to remove.
     */
    remove(task: Task): void;
}

/** Object that represents a continuous process.
 *  tick() method is invoked at every frame.
 */
class Task {

    /** True if the task is running. */
    state: TaskState = TaskState.Scheduled;
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

    /** Returns true if the task is scheduled but not yet running. */
    isScheduled() {
	return (this.state == TaskState.Scheduled);
    }

    /** Returns true if the task is running. */
    isRunning() {
	return (this.state == TaskState.Running);
    }

    /** Invoked when the task is started. */
    start() {
	if (this.state == TaskState.Scheduled) {
	    this.state = TaskState.Running;
	    this.startTime = getTime();
	}
    }

    /** Terminates the task. */
    stop() {
	if (this.state == TaskState.Running) {
	    this.state = TaskState.Finished;
	    this.stopped.fire();
	}
    }

    /** Schedules another task right after this task. 
     * @param next Next Task.
     */
    chain(next: Task, signal: Signal=null): Task {
	switch (this.state) {
	case TaskState.Scheduled:
	case TaskState.Running:
	    signal = (signal !== null)? signal : this.stopped;
	    signal.subscribe(() => {
		if (this.tasklist !== null) {
		    this.tasklist.add(next);
		}
	    });
	    break;
	case TaskState.Finished:
            // Start immediately if this task has already finished.
	    if (this.tasklist !== null) {
		this.tasklist.add(next);
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
    soundStart: number;
    /** End time of the sound. */
    soundEnd: number;
    
    /** Constructor.
     * @param sound Sound object to play.
     * @param soundStart Start time of the sound.
     */
    constructor(sound: HTMLAudioElement, soundStart=MP3_GAP, soundEnd=0) {
	super();
	this.sound = sound;
	this.soundStart = soundStart;
	this.soundEnd = soundEnd;
    }

    start() {
	super.start();
	this.sound.currentTime = this.soundStart;
	this.sound.play();
    }

    update() {
	super.update();
	if (0 < this.soundEnd && this.soundEnd <= this.sound.currentTime) {
	    this.stop();
	} else if (this.sound.ended) {
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
class ParallelTaskList extends Task implements TaskList {

    /** List of current tasks. */
    tasks: Task[] = [];
    /** If true, this task is stopped when the list becomes empty. */
    stopWhenEmpty: boolean = true;

    toString() {
	return ('<ParalellTaskList: tasks='+this.tasks+'>');
    }

    /** Empties the task list. */
    init() {
	this.tasks = [];
    }
    
    /** Invoked at every frame. Update the current tasks. */
    tick() {
	for (let task of this.tasks) {
	    if (task.isScheduled()) {
		task.start();
	    }
	    if (task.isRunning()) {
		task.tick();
	    }
	}
        
        // Remove the finished tasks from the list.
	this.tasks = this.tasks.filter((task: Task) => { return task.isRunning(); });
        // Terminates itself then the list is empty.
	if (this.stopWhenEmpty && this.tasks.length == 0) {
	    this.stop();
	}
    }

    /** Add a new Task to the list.
     * @param task Task to add.
     */
    add(task: Task) {
	task.tasklist = this;
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
class SequentialTaskList extends Task implements TaskList {

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
  
    /** Empties the task list. */
    init() {
	this.tasks = [];
    }

    /** Add a new Task to the list.
     * @param task Task to add.
     */
    add(task: Task) {
	task.tasklist = this.tasklist;
	this.tasks.push(task);
    }
  
    /** Remove an existing Task from the list.
     * @param task Task to remove.
     */
    remove(task: Task) {
	removeElement(this.tasks, task);
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
	    if (task.isScheduled()) {
		task.start();
	    }
	    if (task.isRunning()) {
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
