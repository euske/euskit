/// <reference path="utils.ts" />
/// <reference path="geom.ts" />
/// <reference path="task.ts" />
/// <reference path="entity.ts" />


//  Animator
//  Base class for all animator.
//
class Animator extends Task {

    entity: Entity;

    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }
}


//  Blinker
//
class Blinker extends Entity {

    interval: number = 1.0;
    target: Entity;

    constructor(entity: Entity) {
        super(entity.pos);
        this.target = entity;
    }

    onTick() {
        super.onTick();
        this.pos = this.target.pos;
        this.sprites = this.target.sprites;
    }

    isVisible() {
        return (this.isRunning() &&
                ((this.interval <= 0) ||
                 (phase(this.getTime(), this.interval) != 0)));
    }
}


//  Tweener
//
class Tweener extends Animator {

    srcpos: Vec2 = null;
    dstpos: Vec2 = null;

    onStart() {
        super.onStart();
        this.srcpos = this.entity.pos.copy();
    }

    onTick() {
        super.onTick();
        if (this.srcpos !== null && this.dstpos !== null) {
            let t = this.getTime() / this.lifetime;
            this.entity.pos = this.getPos(t);
        }
    }

    getPos(t: number) {
        return this.srcpos.lerp(this.dstpos, t);
    }
}


//  PolyTweener
//
class PolyTweener extends Tweener {

    n: number;

    constructor(entity: Entity, n=2) {
        super(entity);
        this.n = n;
    }
}


//  PolyTweenerIn
//
class PolyTweenerIn extends PolyTweener {

    getPos(t: number) {
        t = Math.pow(t, this.n);
        return this.srcpos.lerp(this.dstpos, t);
    }
}


//  PolyTweenerOut
//
class PolyTweenerOut extends PolyTweener {

    getPos(t: number) {
        t = 1.0 - Math.pow(1.0-t, this.n)
        return this.srcpos.lerp(this.dstpos, t);
    }
}


//  PolyTweenerInOut
//
class PolyTweenerInOut extends PolyTweener {

    getPos(t: number) {
        if (t < 0.5) {
            t = 0.5*Math.pow(2*t, this.n); // in
        } else {
            t = 0.5*(2.0 - Math.pow(2.0-2*t, this.n)); // out
        }
        return this.srcpos.lerp(this.dstpos, t);
    }
}
