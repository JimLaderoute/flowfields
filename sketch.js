// P5.js Code from Daniel Shiffman instructional <https://www.youtube.com/watch?v=BjoM9oKOAKY&t=542s>

var scl = 30;
var xvec, yvec;
var noiseInc = .1;
var time = 0;
var sometime=0;
var particles = [];
var flowfield;

const FLOWFIELD_SELECTED = 'softwarejim_flowfield_selection';
const BLACK_INK_OVER_WHITE = 1;
const PASTEL_OVER_BLACK = 2;
const COLOR_LERP_RED2BLUE = 3;

let choosenMode = 'BLACK_INK_OVER_WHITE';

let hows = [ { name:'COLOR_LERP_RED2BLUE',  value:COLOR_LERP_RED2BLUE}, 
             { name:'PASTEL_OVER_BLACK',    value:PASTEL_OVER_BLACK},
             { name:'BLACK_INK_OVER_WHITE', value:BLACK_INK_OVER_WHITE}
            ];

class InkMode {
    constructor(how=BLACK_INK_OVER_WHITE)
    {
        this.how = how;
        this.sometime = 0;
        this.resized = false;
    }
    draw_fill()
    {
        if (this.resized) {
            this.resized=false;
            this.setup_bg_fill();
        }
    }
    setup_bg_fill()
    {
        switch (this.how) {
            case BLACK_INK_OVER_WHITE:
                background(255);
                break;
            case PASTEL_OVER_BLACK:  
            case COLOR_LERP_RED2BLUE:
                background(0);
                break;
        }
    }
    color_set( aparticle )
    {
        switch (this.how) {
            case BLACK_INK_OVER_WHITE:
                noFill();
                stroke(0);
                break;
            case PASTEL_OVER_BLACK:
                noFill();
                this.sometime += 0.001;
                let nr = Math.trunc(noise(this.sometime)        * 255);
                let ng = Math.trunc(noise(this.sometime*2+500)  * 255);
                let nb = Math.trunc(noise(this.sometime*3+1000) * 255);
                stroke(nr,ng,nb);
                break;
            case COLOR_LERP_RED2BLUE:
                noFill();
                let inter=1;
                let c1 = color(255,0,0);
                let c2 = color(0, 0, 255);
                if (aparticle) {
                    let inter1 = map(aparticle.pos.x, 0, width, 0, .5);
                    let inter2 = map(aparticle.pos.y, 0, height, 0, .5);
                    inter = inter1 + inter2;
                } else {
                    inter = random();
                }
                let c = lerpColor(c1, c2, inter);
                stroke(c);
                break;
            }
    }
}
let useink;
let sel;
let gCounter=255;
let gFade=255;

function generateParticles(amount=300) {
    particles = [];
    for (let i = 0; i < amount ; i++) {
        particles[i] = new Particle();
    }
}

function setup() {
    let c = createCanvas(windowWidth, windowHeight);
    window.addEventListener('mousemove', e => {
        resetStyleAndCounters();
    });

    generateParticles();

    // See if the last choosen drawing method was
    // saved. If so, then use that setting.
    let picked = getItem(FLOWFIELD_SELECTED);
    if ( picked !== null) {
        choosenMode = picked;
    }

    // Create Option Selection Menu to choose from various
    // drawing modes.
    sel = createSelect();
    sel.position(10, 10);
    sel.class('select_class');
    hows.forEach( howObj => {
        sel.option( howObj.name );
    });
    sel.changed(mySelectHow);
    sel.selected(choosenMode);

    // Save this default setting to the browser
    storeItem(FLOWFIELD_SELECTED,choosenMode);

    // Now create the InkMode object. This figures out
    // what colors to use when drawing the flowfields.
    useink = new InkMode( getValue(hows,choosenMode));

    useink.setup_bg_fill();
}

/*
 * given a draw mode name, find out it's value. The value
 * is stored in the object's .value field.
 */
function getValue(ary, name) {
    let value=BLACK_INK_OVER_WHITE;
    ary.forEach( i => {
        if ( i.name === name) {
            value = i.value;
        }
    });
    return value;
}

function resetStyleAndCounters() {
    sel.style('display', 'block');
    sel.style('opacity', '255');
    gCounter=255;
    gFade=255;
    generateParticles();

}

/*
 * Handle devices that have TOUCH capability. So, if they
 * move their finger over the screen, it will bring the
 * option up.
 */
function touchMoved() {
    resetStyleAndCounters();
}

function mySelectHow() {
    let itemName = sel.value();
    let idvalue = getValue(hows, itemName);
    choosenMode = itemName;
    useink = new InkMode( idvalue );
    useink.setup_bg_fill();
    storeItem(FLOWFIELD_SELECTED,choosenMode);

}

let once=true;
function echoOnce(elm) {
    if (once) {
        console.log(elm);
        once=false;
    }
}
function draw() { // Rotating Vectors
       //background(0,0,0,30);
       useink.draw_fill();

       if ( gCounter <= 0 ) {
           gFade--;
           if ( gFade <= 0 ) {
            sel.style('display', 'none');
            echoOnce(sel.style);
           }
           else
           {
            let alpha = gFade/ 255;
            sel.style('opacity', alpha.toString());
           }
       }
       else
       {
            gCounter--;
       }
      
       FlowField();

       for (var k = 0; k < particles.length; k++) {
              particles[k].show();
              particles[k].update();
              particles[k].edge();
              particles[k].follow(flowfield);
       }
}

function FlowField(drawFlowFields){
       xvec = floor((windowWidth+50) / scl);
       yvec = floor((windowHeight+50) / scl);
       flowfield = new Array(xvec * yvec);

       var yNoise = 0;
       for (var y = 0; y < yvec; y++) {
              var xNoise = 0;
              for (var x = 0; x < xvec; x++) {
                     var vecDirect = noise(xNoise, yNoise, time) * 2*(TWO_PI);
                     var dir = p5.Vector.fromAngle(vecDirect);
                     var index = x + y * xvec;
                     flowfield[index] = dir;
                     dir.setMag(3);
                     xNoise += noiseInc;
                     if ( drawFlowFields) {
                        stroke(180);
                        push();
                        translate(x * scl, y * scl);
                        rotate(dir.heading());
                        line(0, 0, scl, 0);
                        pop();
                     }
                    
              }
              yNoise += noiseInc;
              time += .001;
       }
}

function Particle() {
       this.x = random(width);
       this.y = random(height);
       this.pos = createVector(this.x, this.y);
       this.prev = this.pos.copy();
       this.vel = createVector(0, 0);
       this.acc = createVector(0, 0);
       this.r = 2.0;
       this.maxspeed = 5;

       this.update = function() {
              this.pos.add(this.vel);
              this.vel.add(this.acc);
              this.acc.mult(0);
              this.vel.limit(this.maxspeed);
       }

       this.follow = function(vectors) { // flowfield vectors
              var x = floor(this.pos.x / scl);
              var y = floor(this.pos.y / scl);
              var index = x + y * xvec;
              var force = vectors[index];
              this.applyForce(force);
       }

       this.applyForce = function(force) {
              this.acc.add(force);
       }

       this.show = function() {
              useink.color_set(this);
              line(this.pos.x, this.pos.y, this.prev.x, this.prev.y );
              this.prev.x = this.pos.x;
              this.prev.y = this.pos.y;
       }

       this.edge = function() {
              if (this.pos.x < -this.r)  {this.pos.x = width + this.r; this.prev.x = this.pos.x;}
              if (this.pos.y < -this.r)  {this.pos.y = height + this.r; this.prev.y = this.pos.y;}
              if (this.pos.x > width + this.r) { this.pos.x = -this.r; this.prev.x = this.pos.x;}
              if (this.pos.y > height + this.r) { this.pos.y = -this.r; this.prev.y = this.pos.y;}
       }
}

function windowResized() {
    useink.resized = true;
    resizeCanvas(windowWidth, windowHeight);
}