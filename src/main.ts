/// <reference path="utils.ts" />
/// <reference path="scene.ts" />
/// <reference path="app.ts" />


// Browser interaction.

function run<T extends Scene>(
    scene0: { new(app:App):T; },
    canvasId='main', scale=2, framerate=30)
{
    function getprops(a: NodeListOf<Element>) {
	let d:any = {};
	for (let i = 0; i < a.length; i++) {
	    d[a[i].id] = a[i];
	}
	return d;
    }
  
    let images = getprops(document.getElementsByTagName('img')) as ImageDictionary;
    let audios = getprops(document.getElementsByTagName('audio')) as AudioDictionary;
    let labels = getprops(document.getElementsByClassName('label')) as DivDictionary;
    let frame = document.getElementById(canvasId) as HTMLCanvasElement;
    let app = new App(framerate, scale, frame, images, audios, labels);
    let ctx = getEdgeyContext(frame);
    let timer: number;
  
    function repaint() {
	ctx.drawImage(app.screen,
		      0, 0, app.screen.width, app.screen.height,
		      0, 0, frame.width, frame.height);
    }    
    
    function tick() {
	if (app.active) {
	    app.tick();
	    app.repaint();
	    repaint();
	}
    }
    
    function keydown(e: KeyboardEvent) {
	if (app.active) {
	    switch (e.keyCode) {
	    case 17:			// Control
	    case 18:			// Meta
		break;
	    default:
		app.keydown(e);
		break;
	    }
	    switch (e.keyCode) {
	    case 8:			// Backspace
	    case 9:			// Tab
	    case 13:			// Return
	    case 14:			// Enter
	    case 32:			// Space
	    case 33:			// PageUp
	    case 34:			// PageDown
	    case 35:			// End
	    case 36:			// Home
	    case 37:			// Left
	    case 38:			// Up
	    case 39:			// Right
	    case 40:			// Down
		e.preventDefault();
		break;
	    }
	}
    }
    
    function keyup(e: KeyboardEvent) {
	if (app.active) {
	    switch (e.keyCode) {
	    case 17:			// Control
	    case 18:			// Meta
		break;
	    default:
		app.keyup(e);
		break;
	    }
	}
    }
    
    function mousedown(e: MouseEvent) {
	if (app.active) {
	    app.mousedown(e);
	}
    }
    
    function mouseup(e: MouseEvent) {
	if (app.active) {
	    app.mouseup(e);
	}
    }
    
    function mousemove(e: MouseEvent) {
	if (app.active) {
	    app.mousemove(e);
	}
    }
    
    function focus(e: FocusEvent) {
	if (!app.active) {
	    app.focus();
	    repaint();
	}
    }
    
    function blur(e: FocusEvent) {
	if (app.active) {
	    app.blur();
	    repaint();
	}
	let size = 50;
	ctx.save();
	ctx.fillStyle = 'rgba(0,0,64, 0.5)'; // gray out.
	ctx.fillRect(0, 0, frame.width, frame.height);
	ctx.fillStyle = 'lightgray';
	ctx.beginPath();		// draw a play button.
	ctx.moveTo(frame.width/2-size, frame.height/2-size);
	ctx.lineTo(frame.width/2-size, frame.height/2+size);
	ctx.lineTo(frame.width/2+size, frame.height/2);
	ctx.fill();
	ctx.restore();
    }

    app.init(new scene0(app));
    app.focus();
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('mousedown', mousedown);
    window.addEventListener('mouseup', mouseup);
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('focus', focus);
    window.addEventListener('blur', blur);
    timer = window.setInterval(tick, 1000/framerate);
    frame.focus();
}
