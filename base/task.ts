/// <reference path="utils.ts" />


enum TaskState {
    Scheduled,
    Running,
    Finished,
}


/** Object that represents a continuous process.
 *  onTick() method is invoked at every frame.
 */
class Task {

    /** List to which this task belongs (assigned by TaskList). */
    parent: TaskList = null;

    /** True if the task is running. */
    state: TaskState = TaskState.Scheduled;
    /** Lifetime.
     * This task automatically terminates itself after
     * the time specified here passes. */
    lifetime: number = Infinity;
    /** Start time. */
    startTime: number = Infinity;

    /** Fired when this task is stopped. */
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
    onStart() {
        if (this.state == TaskState.Scheduled) {
            this.state = TaskState.Running;
            this.startTime = getTime();
        }
    }

    /** Invoked when the task is stopped. */
    onStop() {
    }

    /** Invoked at every frame while the task is running. */
    onTick() {
        if (this.lifetime <= this.getTime()) {
            this.stop();
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
                if (this.parent !== null) {
                    this.parent.add(next);
                }
            });
            break;
        case TaskState.Finished:
            // Start immediately if this task has already finished.
            if (this.parent !== null) {
                this.parent.add(next);
            }
        }
        return next;
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

    /** Invoked when the task is started. */
    onStart() {
        super.onStart();
        // Start playing.
        this.sound.currentTime = this.soundStart;
        this.sound.play();
    }

    /** Invoked when the task is stopped. */
    onStop() {
        // Stop playing.
        this.sound.pause();
        super.onStop();
    }

    /** Invoked at every frame while the task is running. */
    onTick() {
        super.onTick();
        // Check if the playing is finished.
        if (0 < this.soundEnd && this.soundEnd <= this.sound.currentTime) {
            this.stop();
        } else if (this.sound.ended) {
            this.stop();
        }
    }
}

/** Abstract list of Tasks
 */
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
    onStart() {
        super.onStart();
        this.tasks = [];
    }

    /** Invoked at every frame. Update the current tasks. */
    onTick() {
        for (let task of this.tasks) {
            if (task.isScheduled()) {
                task.onStart();
            }
            if (task.isRunning()) {
                task.onTick();
            }
        }

        // Remove the finished tasks from the list.
        let removed = this.tasks.filter((task: Task) => { return !task.isRunning(); });
        for (let task of removed) {
            this.remove(task);
        }

        // Terminates itself then the list is empty.
        if (this.stopWhenEmpty && this.tasks.length == 0) {
            this.stop();
        }
    }

    /** Add a new Task to the list.
     * @param task Task to add.
     */
    add(task: Task) {
        task.parent = this;
        this.tasks.push(task);
    }

    /** Remove an existing Task from the list.
     * @param task Task to remove.
     */
    remove(task: Task) {
        if (!task.isScheduled()) {
            task.onStop();
        }
        removeElement(this.tasks, task);
    }
}


/** List of Tasks that run sequentially.
 */
class SequentialTaskList extends Task implements TaskList {

    /** List of current tasks. */
    tasks: Task[] = null;
    /** If true, this task is stopped when the list becomes empty. */
    stopWhenEmpty: boolean = true;

    /** Constructor.
     * @param tasks List of tasks. (optional)
     */
    constructor(tasks: Task[]=null) {
        super();
        this.tasks = tasks;
    }

    /** Empties the task list. */
    onStart() {
        super.onStart();
        if (this.tasks === null) {
            this.tasks = [];
        }
    }

    /** Add a new Task to the list.
     * @param task Task to add.
     */
    add(task: Task) {
        task.parent = this;
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
    onTick() {
        let task:Task = null;
        while (true) {
            task = this.getCurrentTask();
            if (task === null) break;
            // Starts the next task.
            if (task.isScheduled()) {
                task.onStart();
            }
            if (task.isRunning()) {
                task.onTick();
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
