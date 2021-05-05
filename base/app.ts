/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="text.ts" />
/// <reference path="scene.ts" />


/** Initial gap of lame-encded MP3 files */
const MP3_GAP = 0.025;

type ImageAsset = {
    [index: string]: HTMLImageElement;
}
type AudioAsset = {
    [index: string]: HTMLAudioElement;
}
type TextAsset = {
    [index: string]: HTMLDivElement;
}

function getprops(a: HTMLCollectionOf<Element>) {
    let d:any = {};
    for (let i = 0; i < a.length; i++) {
        d[a[i].id] = a[i];
    }
    return d;
}


//  App
//  handles the event loop and global state management.
//  It also has shared resources (images, sounds, etc.)
//
class App {

    width: number;
    height: number;
    framerate: number;
    elem: HTMLElement;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    audioContext: AudioContext;
    interval: number;

    images: ImageAsset;
    sounds: AudioAsset;
    labels: TextAsset;

    scene: Scene = null;
    active: boolean = false;
    keys: { [index: number]: boolean } = {};
    keyDir: Vec2 = new Vec2();
    mousePos: Vec2 = new Vec2();
    mouseButton: boolean = false;

    private _keylock: number = 0;
    private _msgs: Action[] = [];
    private _music: HTMLAudioElement = null;
    private _loop_start: number = 0;
    private _loop_end: number = 0;
    private _touch_id: any = null;

    constructor(width: number, height: number,
                elemId='game', framerate=30) {
        this.width = width;
        this.height = height;
        this.framerate = framerate;
        this.elem = document.getElementById(elemId);

        // Initialize the off-screen bitmap.
        this.canvas = createCanvas(this.width, this.height);
        this.ctx = getEdgeyContext(this.canvas);
        this.elem.appendChild(this.canvas);

        // Resources;
        this.images = getprops(document.getElementsByTagName('img')) as ImageAsset;
        this.sounds = getprops(document.getElementsByTagName('audio')) as AudioAsset;
        this.labels = getprops(document.getElementsByClassName('label')) as TextAsset;

        // Initialize WebAudio.
        try {
            this.audioContext = new AudioContext();
            for (let id in this.sounds) {
                let source = this.audioContext.createMediaElementSource(this.sounds[id]);
                source.connect(this.audioContext.destination);
            }
        } catch (error) {
            this.audioContext = null;
        }
    }

    init(scene: Scene) {
        let app = this;
        function tick() {
            try { app.tick(); } catch (e) { uninit(); throw e; }
        }
        function keydown(ev: KeyboardEvent) {
            try { app.keyDown(ev); } catch (e) { uninit(); throw e; }
        }
        function keyup(ev: KeyboardEvent) {
            try { app.keyUp(ev); } catch (e) { uninit(); throw e; }
        }
        function keypress(ev: KeyboardEvent) {
            try { app.keyPress(ev); } catch (e) { uninit(); throw e; }
        }
        function mousedown(ev: MouseEvent) {
            try { app.mouseDown(ev); } catch (e) { uninit(); throw e; }
        }
        function mouseup(ev: MouseEvent) {
            try { app.mouseUp(ev); } catch (e) { uninit(); throw e; }
        }
        function mousemove(ev: MouseEvent) {
            try { app.mouseMove(ev); } catch (e) { uninit(); throw e; }
        }
        function touchstart(ev: TouchEvent) {
            try { app.touchStart(ev); } catch (e) { uninit(); throw e; }
        }
        function touchend(ev: TouchEvent) {
            try { app.touchEnd(ev); } catch (e) { uninit(); throw e; }
        }
        function touchmove(ev: TouchEvent) {
            try { app.touchMove(ev); } catch (e) { uninit(); throw e; }
        }
        function focus(ev: FocusEvent) {
            try { app.start(); } catch (e) { uninit(); throw e; }
        }
        function blur(ev: FocusEvent) {
            try { app.stop(); } catch (e) { uninit(); throw e; }
        }
        function resize(ev: Event) { app.resize(); }

        function uninit() {
            console.info("app.uninit");
            app.elem.removeEventListener('mousedown', mousedown);
            app.elem.removeEventListener('mouseup', mouseup);
            app.elem.removeEventListener('mousemove', mousemove);
            app.elem.removeEventListener('touchstart', touchstart);
            app.elem.removeEventListener('touchend', touchend);
            app.elem.removeEventListener('touchmove', touchmove);
            window.removeEventListener('focus', focus);
            window.removeEventListener('blur', blur);
            window.removeEventListener('keydown', keydown);
            window.removeEventListener('keyup', keyup);
            window.removeEventListener('keypress', keypress);
            window.removeEventListener('resize', resize);
            window.clearInterval(app.interval);
        }

        this.resize();
        this.elem.addEventListener('mousedown', mousedown, false);
        this.elem.addEventListener('mouseup', mouseup, false);
        this.elem.addEventListener('mousemove', mousemove, false);
        this.elem.addEventListener('touchstart', touchstart, false);
        this.elem.addEventListener('touchend', touchend, false);
        this.elem.addEventListener('touchmove', touchmove, false);
        window.addEventListener('focus', focus);
        window.addEventListener('blur', blur);
        window.addEventListener('keydown', keydown);
        window.addEventListener('keyup', keyup);
        window.addEventListener('keypress', keypress);
        window.addEventListener('resize', resize);
        window.focus();
        this.interval = window.setInterval(tick, 1000/this.framerate);
        console.info("app.init");

        this.setScene(scene);
        this.start();
    }

    start() {
        if (this.active) return;
        console.info("app.start");
        this.active = true;
        this.elem.focus();
        if (this._music !== null && 0 < this._music.currentTime) {
            this._music.play();
        }
        this.scene.onFocus();
    }

    stop() {
        if (!this.active) return;
        console.info("app.stop");
        this.active = false;
        this.scene.onBlur();
        if (this._music !== null) {
            this._music.pause();
        }
        let width = this.canvas.width;
        let height = this.canvas.height;
        let asize = Math.min(width, height)/8;
        let ctx = this.canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,64, 0.5)'; // gray out.
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'lightgray';
        ctx.beginPath();                // draw a play button.
        ctx.moveTo(width/2-asize, height/2-asize);
        ctx.lineTo(width/2-asize, height/2+asize);
        ctx.lineTo(width/2+asize, height/2);
        ctx.fill();
        ctx.restore();
    }

    resize() {
        let bounds = this.elem.getBoundingClientRect();
        // Center the canvas.
        let cw = bounds.width, ch = bounds.height;
        if (this.canvas.height*bounds.width < this.canvas.width*bounds.height) {
            ch = int(this.canvas.height * bounds.width / this.canvas.width);
        } else {
            cw = int(this.canvas.width * bounds.height / this.canvas.height);
        }
        this.canvas.style.position = 'absolute';
        this.canvas.style.padding = '0px';
        this.canvas.style.left = ((bounds.width-cw)/2)+'px';
        this.canvas.style.top = ((bounds.height-ch)/2)+'px';
        this.canvas.style.width = cw+'px';
        this.canvas.style.height = ch+'px';
    }

    tick() {
        if (!this.active) return;
        if (this.scene === null) return;
        this.scene.onTick();
        if (0 < this._keylock && this._keylock < getTime()) {
            this._keylock = 0;
        }

        if (this._music !== null &&
            this._loop_start < this._loop_end &&
            this._loop_end <= this._music.currentTime) {
            this._music.currentTime = this._loop_start;
        }

        while (0 < this._msgs.length) {
            let msg = this._msgs.shift();
            msg();
        }
        this.repaint();
    }

    setScene(scene: Scene) {
        removeChildren(this.elem, 'div');
        this.setMusic();
        if (this.scene !== null) {
            this.scene.onStop();
        }
        this.scene = scene;
        this.scene.onStart();
        console.info("app.setScene:", scene);
    }

    post(msg: Action) {
        this._msgs.push(msg);
    }

    addElement(bounds: Rect) {
        let e = document.createElement('div');
        e.style.position = 'absolute';
        e.style.left = bounds.x+'px';
        e.style.top = bounds.y+'px';
        e.style.width = bounds.width+'px';
        e.style.height = bounds.height+'px';
        e.style.padding = '0px';
        this.elem.appendChild(e);
        return e;
    }

    removeElement(e: HTMLElement) {
        e.parentNode.removeChild(e);
    }

    lockKeys(t: number=1) {
        this._keylock = getTime()+t;
    }

    keyDown(ev: KeyboardEvent) {
        switch (ev.keyCode) {
        case 17:
        case 18:
            // Ignore Control or Meta;
            return;
        case 27:
            // ESC to toggle.
            if (this.active) {
                this.stop();
            } else {
                this.start();
            }
            return;
        }
        if (!this.active) return;
        if (0 < this._keylock) return;
        let keysym = getKeySym(ev.keyCode);
        switch (keysym) {
        case KeySym.Left:
            this.keyDir.x = -1;
            this.scene.onDirChanged(this.keyDir);
            break;
        case KeySym.Right:
            this.keyDir.x = +1;
            this.scene.onDirChanged(this.keyDir);
            break;
        case KeySym.Up:
            this.keyDir.y = -1;
            this.scene.onDirChanged(this.keyDir);
            break;
        case KeySym.Down:
            this.keyDir.y = +1;
            this.scene.onDirChanged(this.keyDir);
            break;
        case KeySym.Action1:
        case KeySym.Action2:
        case KeySym.Cancel:
            if (!this.keys[keysym]) {
                this.scene.onButtonPressed(keysym);
            }
            break;
        }
        this.keys[keysym] = true;
        this.scene.onKeyDown(ev.keyCode);
        // Prevent defaults.
        switch (ev.keyCode) {
        case 8:             // Backspace
        case 9:             // Tab
        case 13:            // Return
        case 14:            // Enter
        case 32:            // Space
        case 33:            // PageUp
        case 34:            // PageDown
        case 35:            // End
        case 36:            // Home
        case 37:            // Left
        case 38:            // Up
        case 39:            // Right
        case 40:            // Down
            ev.preventDefault();
            break;
        }
    }

    keyUp(ev: KeyboardEvent) {
        if (!this.active) return;
        // Ignore Control or Meta;
        if (ev.keyCode == 17 || ev.keyCode == 18) return;
        let keysym = getKeySym(ev.keyCode);
        switch (keysym) {
        case KeySym.Left:
            this.keyDir.x = (this.keys[KeySym.Right]) ? +1 : 0;
            this.scene.onDirChanged(this.keyDir);
            break;
        case KeySym.Right:
            this.keyDir.x = (this.keys[KeySym.Left]) ? -1 : 0;
            this.scene.onDirChanged(this.keyDir);
            break;
        case KeySym.Up:
            this.keyDir.y = (this.keys[KeySym.Down]) ? +1 : 0;
            this.scene.onDirChanged(this.keyDir);
            break;
        case KeySym.Down:
            this.keyDir.y = (this.keys[KeySym.Up]) ? -1 : 0;
            this.scene.onDirChanged(this.keyDir);
            break;
        case KeySym.Action1:
        case KeySym.Action2:
        case KeySym.Cancel:
            if (this.keys[keysym]) {
                this.scene.onButtonReleased(keysym);
            }
            break;
        }
        this.keys[keysym] = false;
        this.scene.onKeyUp(ev.keyCode);
    }

    keyPress(ev: KeyboardEvent) {
        if (!this.active) return;
        this.scene.onKeyPress(ev.charCode);
    }

    updateMousePos(ev: MouseEvent|Touch) {
        let bounds = this.elem.getBoundingClientRect();
        this.mousePos = new Vec2(
            (ev.clientX-bounds.left)*this.canvas.width/bounds.width,
            (ev.clientY-bounds.top)*this.canvas.height/bounds.height);
    }

    mouseDown(ev: MouseEvent) {
        if (!this.active) return;
        this.updateMousePos(ev);
        switch (ev.button) {
        case 0:
            this.mouseButton = true;
            break;
        }
        this.scene.onMouseDown(this.mousePos, ev.button);
    }

    mouseUp(ev: MouseEvent) {
        if (!this.active) return;
        this.updateMousePos(ev);
        switch (ev.button) {
        case 0:
            this.mouseButton = false;
            break;
        }
        this.scene.onMouseUp(this.mousePos, ev.button);
    }

    mouseMove(ev: MouseEvent) {
        if (!this.active) return;
        this.updateMousePos(ev);
        this.scene.onMouseMove(this.mousePos);
    }

    touchStart(ev: TouchEvent) {
        if (!this.active) return;
        let touches = ev.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            let t = touches[i];
            if (this._touch_id === null) {
                this._touch_id = t.identifier;
                this.mouseButton = true;
                this.updateMousePos(t);
                this.scene.onMouseDown(this.mousePos, 0);
            }
        }
        ev.preventDefault();
    }

    touchEnd(ev: TouchEvent) {
        if (!this.active) return;
        let touches = ev.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            let t = touches[i];
            if (this._touch_id !== null) {
                this._touch_id = null;
                this.mouseButton = false;
                this.updateMousePos(t);
                this.scene.onMouseUp(this.mousePos, 0);
            }
        }
        ev.preventDefault();
    }

    touchMove(ev: TouchEvent) {
        if (!this.active) return;
        let touches = ev.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            let t = touches[i];
            if (this._touch_id == t.identifier) {
                this.updateMousePos(t);
                this.scene.onMouseMove(this.mousePos);
            }
        }
        ev.preventDefault();
    }

    repaint() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.scene.render(this.ctx);
        this.ctx.restore();
    }

    setMusic(name: string=null, start=MP3_GAP, end=0) {
        if (this._music !== null) {
            this._music.pause();
        }
        if (name === null) {
            this._music = null;
        } else {
            let sound = this.sounds[name];
            this._loop_start = start;
            this._loop_end = (end < 0)? sound.duration : end;
            if (0 < sound.readyState) { // for IE bug
                sound.currentTime = MP3_GAP;
            }
            this._music = sound;
            this._music.play();
        }
    }

    /** Play a sound resource.
     * @param sound Sound name.
     * @param start Start position.
     */
    playSound(name: string, start=MP3_GAP) {
        let elem = this.sounds[name];
        elem.currentTime = start;
        elem.play();
    }
}


var APP: App = null;

// main: sets up the browser interaction.
//function main() {
//    APP = new App(320, 240);
//    APP.init(new Scene());
//}
