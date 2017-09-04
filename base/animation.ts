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


//  Tweener
//
class Tweener extends Animator {

    srcpos: Vec2 = null;
    dstpos: Vec2 = null;
    
    start() {
	super.start();
	this.srcpos = this.entity.pos.copy();
    }
    
    update() {
	super.update();
	if (this.srcpos !== null && this.dstpos !== null) {
	    let t = this.getTime() / this.lifetime;
	    this.entity.pos = this.getPos(t);
	}
    }

    getPos(t: number) {
	return this.srcpos.interpolate(this.dstpos, t);
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
	return this.srcpos.interpolate(this.dstpos, t);
    }
}


//  PolyTweenerOut
//
class PolyTweenerOut extends PolyTweener {

    getPos(t: number) {
	t = 1.0 - Math.pow(1.0-t, this.n)
	return this.srcpos.interpolate(this.dstpos, t);
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
	return this.srcpos.interpolate(this.dstpos, t);
    }
}


//  Blinker
//
class Blinker extends Widget {

    sprite: Sprite;
    interval: number = 1.0;
    
    constructor(sprite: Sprite) {
	super();
	this.sprite = sprite;
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
	this.sprite.visible = (phase(this.getTime(), this.interval) == 0);
    }
}
