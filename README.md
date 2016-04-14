Euskit
======

A minimalistic HTML5 framework for 2D games written in TypeScript.

main.ts
-------
 * `run(scene)`
   <br> Basic plumbing such as event dispatch and main loop.
   In most cases, you don't need to change this.

app.ts
-------
 * `new App(framerate, scale, frame, images, audios, labels)`
   <br> Asset management and overall state handling (game over, etc.)

   - `init()`
     <br> App initialization.
     [App specific code goes here.]
   
   - `tick()`
     <br> Called for every frame.
     [App specific code goes here.]
   
   - `repaint()`
     <br> Repaint the entire screen.
     [App specific code goes here.]

scene.ts
--------
 * `new Scene(app)`
   <br> Responsible for event handling for a particular scene of game.
        (Title, Game Over, Main Game, etc.)
 
   - `init()`
     <br> Scene initialization.
     [A game specific code goes here.]
     
   - `tick()`
     <br> Called for every frame.
     [A game specific code goes here.]
     
   - `render(ctx, x, y)`
     <br> Called when the scene needs to be painted.
     [A game specific code goes here.]
   
   - `set_dir(v)`
     <br> Receives the controller input.
     
   - `set_action(action)`
     <br> Receives the action button input.

layer.ts
--------
 * `new Layer()`
   <br> Manages entities in a Scene.

   - `init()`
   - `tick()`
   - `render(ctx, x, y)`
   - `addObject(obj)`
   - `removeObject(obj)`
   
entity.ts
---------
 * `new Task()`
   <br> A generic process object that is called for every frame.
   
   - `init()`
   - `start(layer)`
   - `die()`
   - `tick()`
   - `update()`
   
 * new Queue(tasks) [extends Task]
   <br> A list of Task objects that are executed sequentially.
   
   - `add(task)`
   - `remove(task)`
   
 * new Sprite(bounds, src) [extends Task]
   <br> A visible object that might not interact with other characters.
   
   - `move(v)`
   - `render(ctx, x, y)`
   
 * new Entity(bounds, src, hitbox) [extends Sprite]
   <br> An moving object that interacts with other Entities.
     
   - `isMovable(v)`
   - `getMove(v)`
   - `getContactFor(v, hitbox, force, range)`
   - `getConstraintsFor(hitbox, force)`
 
   - `collide(entity)`
     <br> Called when the Actor object collides with another Entity.
   
text.ts
-------

tilemap.ts
----------
   
geom.ts
--------
 * `new Vec2(x, y)`
   <br> A 2D vector object.
 
   - `equals(v)`
   - `isZero()`
   - `copy()`
   - `norm2()`
   - `add(v)`
   - `sub(v)`
   - `scale(v)`
   - `move(dx, dy)`
   - `rotate90(v)`
   - `expand(dw, dh, vx=0, vy=0)`
   
 * `new Vec3(x, y, z)`
   <br> A 3D vector object.
 
   - `equals(v)`
   - `isZero()`
   - `copy()`
   - `norm2()`
   - `add(v)`
   - `sub(v)`
   - `scale(v)`
   - `move(dx, dy, dz)`
   
 * `new Rect(x, y, width, height)`
   <br> A rectangle object.
   
   - `equals(rect)`
   - `right()`
   - `bottom()`
   - `centerx()`
   - `centery()`
   - `center()`
   - `anchor(vx, vy)`
   - `copy()`
   - `move(dx, dy)`
   - `add(v)`
   - `diff(rect)`
   - `inflate(dw, dh)`
   - `expand(dw, dh, vx, vy)`
   - `contains(v)`
   - `containsRect(rect)`
   - `distance(rect)`
   - `overlap(rect)`
   - `union(rect)`
   - `intersection(rect)`
   - `clamp(rect)`
   - `rndpt()`
   - `modpt()`
   - `collide(v, rect)`
   <br> Clips the motion vector v so that this rect doesn't
   intersect with the given rect.
   
 * `new Box(origin, size)`
   <br> A box object.
   
   - `equals(box)`
   - `center()`
   - `copy()`
   - `move(dx, dy, dz)`
   - `add(v)`
   - `diff(box)`
   - `inflate(dx, dy, dz)`
   - `contains(v)`
   - `overlap(box)`
   - `union(box)`
   - `intersection(box)`
   - `clamp(box)`
   - `rndpt()`
   - `collide(v, box)`

utils.ts
--------
 * `log(x)`
   <br> Prints a string to the console.
 * `fmod(x, y)`
   <br> Equivalent to fmod(x, y) in C.
 * `clamp(v0, v, v1)`
   <br> Keeps a number v within the range [v0, v1].
 * `blink(t, d)`
   <br> Returns true if t is within the on interval.
 * `rnd(a[, b])`
   <br> Generates a random number in the range [0, a) or [a, b).
 * `format(v, n, c)`
   <br> Formats a number to a fixed number of digits.
   
 * `createCanvas(width, height)`
   <br> Creates a canvas element with the given size.
 
 * `getEdgeyContext(canvas)`
   <br> Returns a pixellated canvas 2D context.

 * `image2array(img)`
   <br> Converts an image to 2D array.

 * `drawImageScaled(ctx, src, sx, sy, sw, sh, dx, dy, dw, dh)`
   <br> Draw an image with flipping if necessary.
 
 * `playSound(sound)`
   <br> Plays an audio element.
 
 * `new Slot(object)`
   <br> An event publisher.
    
   - `subscribe(recv)`
     <br> Registers a function as an event receiver.
   - `unsubscribe(recv)`
     <br> Unregisters a function as an event receiver.
   - `signal(arg)`
     <br> Calls a registerd function of all subscriers.
 
 * `new Color(r, g, b, a)`
   <br> A color object.

 * `new HTMLImageSource(image, bounds)`
   <br> Image source used for Sprites.

 * `new SpriteSheet(image, size)`
   <br> Sprite sheet.
