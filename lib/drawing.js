var ANIMATION_TIME = 100;
const PADDING = 6;
const FONT = "12px Arial";
const BACKGROUND_COLOR = "white"
const canvas = document.getElementById("draw");
const ctx = document.getElementById("draw").getContext("2d");
const DEFAULT_RECT_CTX = {fillStyle : "#DDDDDD", strokeStyle : "#696969"};
const ROUNDING_THRESHOLD = 0.0001;
var REVERSE_ANIMATION = false;



// deep copy object 
function deep_copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// update dict1 with dict2
function update_dict(dict1, dict2) {
  let dict = deep_copy(dict1);
  for (const [key, value] of Object.entries(dict2)) {
    dict[key] = value;
  }
  return dict;
}

// extra ctx attributes from a dict
function extract_ctx_prop(prop) {
  rv = {};
  if ("fillStyle" in prop) rv.fillStyle = prop.fillStyle;
  if ("strokeStyle" in prop) rv.strokeStyle = prop.strokeStyle;
  if ("shadowColor" in prop) rv.shadowColor = prop.shadowColor;
  if ("shadowBlur" in prop) rv.shadowBlur = prop.shadowBlur;
  return rv;
}

// load ctx attributes
function load_ctx_prop(prop) {
  for (const [key, value] of Object.entries(prop)) {
    ctx[key] = value;
  }
}

class Point {

  constructor(x, y, obj = null) {
    this.x = x;
    this.y = y;
    this.obj = obj;
  }

  copy() {
    return new Point(this.x, this.y, this.obj);
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  to_str() {
    return this.x + ',' + this.y;
  }

  is_euqal(p) {

    if (Math.abs(p.x - this.x) > ROUNDING_THRESHOLD) return false;
    if (Math.abs(p.y - this.y) > ROUNDING_THRESHOLD) return false;

    return true;
  }

}

class Animation {
  constructor() {
    this.connection_map = new Map();
    this.obj_map = new Map();
    this.step_by_step = false;
    this.suspend = false;
    this.has_suspend = false;
    this.start = 0; // the timer for where the animation is
    this.reverse = false;
    this.points = [];
    this.sequence_ani = [];
    this.parallel_ani = [];


  }

 
  get_point(x, y) {
    let p;
    let i;
    p = new Point(x,y);

    for (i = 0; i < this.points.length; i++) {
      if (this.points[i].is_euqal(p)) return this.points[i];
    }
   
    this.points.push(p);

    return p;
  }


  get_connection(ref1, ref2) {
    let key = ref1 + "->" + ref2;
    if (this.connection_map.has(key)) return this.connection_map.get(key);
    else return [];
  }

  get_connection_by_points(p1, p2) {

    for (let l_or_c of this.connection_map.values()) {
      for (let i = 0; i < l_or_c.length; i++) {
        if (l_or_c[i].p1.is_euqal(p1) && l_or_c[i].p2.is_euqal(p2)) return l_or_c[i];
      }
    }
  }


  get_object(ref) {
    if (this.obj_map.has(ref)) return this.obj_map.get(ref);
    else return null;
  }

  add_object(obj) {
    if (!this.obj_map.has(obj.ref)) this.obj_map.set(obj.ref, obj);
  }

  remove_object(ref) {
    let obj, i, j;
    let l_or_c;
    let done = false;
    if (this.obj_map.has(ref)) obj = this.obj_map.get(ref);
    else return;
   

    // remove the connections
    while (!done) {
      done = true;
      for (l_or_c of this.connection_map.values()) {
        if (l_or_c[0].p1.obj == obj || l_or_c[0].p2.obj == obj) {
          this.disconnect_object(l_or_c[0]);
          done = false;
          break;
        }

      }
      
    }

    // remove the points
    for (i = 0; i < obj.points.length; i++) {
      for (j = 0; j < this.points.length; j++) {
        if (this.points[j] == obj.points[i]) {
          this.points.splice(j, 1);
          break;
        }
      }
      
    }

    console.log(this.points);

    this.obj_map.delete(ref);
    console.log(this.obj_map);

  }

  connect_object(line_or_curve) {
    let from_ref, to_ref, key;
    let from_obj, to_obj;
    from_obj = line_or_curve.p1.obj;
    to_obj = line_or_curve.p2.obj;

    if (from_obj == null || to_obj == null) {
      console.log(line_or_curve);
      console.log("line_or_curve: sp/ep must be attached to a object");
    } else {
      from_obj.to.push(to_obj);
      to_obj.from.push(from_obj);
      from_ref = from_obj.ref;
      to_ref = to_obj.ref;
      
      key = from_ref + "->" + to_ref;
      if (!this.connection_map.has(key)) {
        this.connection_map.set(key, []);
      }
      this.connection_map.get(key).push(line_or_curve);

      if (!this.obj_map.has(from_ref)) this.obj_map.set(from_ref, from_obj);
      if (!this.obj_map.has(to_ref)) this.obj_map.set(to_ref, to_obj);
    }
  }

  disconnect_object(line_or_curve) {
    let i, from_ref, to_ref, key, arr;
    let from_obj, to_obj;

    from_obj = line_or_curve.p1.obj;
    to_obj = line_or_curve.p2.obj;

    if (line_or_curve.p1.obj == null || line_or_curve.p2.obj == null) {
      console.log("line_or_curve: sp/ep must be attached to a object");
      return 0;
    } 

    from_ref = from_obj.ref;
    to_ref = to_obj.ref;
    key = from_ref + "->" + to_ref;

    if (!this.connection_map.has(key)) {
      console.log("line_or_curve is not connected");
      return 0;
    }

    for (i = 0; i < line_or_curve.p1.obj.to.length; i++) {
      if (line_or_curve.p1.obj.to[i] == line_or_curve.p2.obj) {
        line_or_curve.p1.obj.to.splice(i,1);
        break;
      }
    }
    for (i = 0; i < line_or_curve.p2.obj.from.length; i++) {
      if (line_or_curve.p2.obj.from[i] == line_or_curve.p1.obj) {
        line_or_curve.p2.obj.from.splice(i,1);
        break;
      }
    }

    arr = this.connection_map.get(key);
    for (i = 0; i < arr.length; i++) {
      if (arr[i] == line_or_curve) {
        arr.splice(i,1);
        break;
      }
    }
    if (arr.length == 0) {
      this.connection_map.delete(key);
    }
  

    return arr.length;
  }

  add_sequence_ani(p) {

    this.sequence_ani.push(p);
  }

  add_parallel_ani(p) {
    p.prop.start += this.start;
    p.prop.end += this.start;
    if (!("step" in p.prop)) p.prop.step = false;

    this.parallel_ani.push(p);
  }

  sequence_to_parallel() {
    let i;
    let start = this.start;
    let seq;
    let time;
    for (i = 0; i < this.sequence_ani.length; i++) {
      seq = this.sequence_ani[i];


      if (!("prop" in seq)) seq.prop = {};
      seq.prop.start = start;


      if (!("step" in seq.prop)) seq.prop.step = false;

      if ("pause" in seq) time = seq.pause;
      else if ("time" in seq.prop) {
        time = seq.prop.time;
        delete seq.prop.time;
      }
      else time = ANIMATION_TIME;

      seq.prop.end = start + time;
    

      if ('concurrence' in seq && seq.concurrence == true) {

      } else {
        start = seq.prop.end;
      }
      console.log(seq);
      this.parallel_ani.push(seq);
    }
    this.sequence_ani = [];
  }

 

  resume_animation() {
    this.suspend = false;
  }

  reverse_animation() {
    this.reverse = true;
    REVERSE_ANIMATION = true;
  }


  run_animation(skip = false) {


    let self = this;
    let ani_p;
    let i;
    let old_start = this.start;
    let max = -1;
    let draw_after_action = true;


    this.sequence_to_parallel();
    this.suspend = false;

   
    let id = setInterval(function() {
      
      
      // reverse to the beginning of animation
      if(self.reverse && self.start == old_start - 1) {

        $("#step_forward").prop("disabled", false);
        return;
      }

      // suspending the animation
      if (self.step_by_step && self.suspend) {
        if (draw_after_action) {
          self.draw();
        }
        draw_after_action = false;
        return; 
      }

      draw_after_action = true;
      // disable inputs during animation
      $(":button").prop("disabled", true);
      $(":input").prop("disabled", true);
     
      self.draw();

      // process animation
     
        

      if (self.reverse == false) {

        // trigger action
        for (i = 0; i < self.parallel_ani.length; i++) {
          ani_p = self.parallel_ani[i];
         
          if (parseInt(ani_p.prop.end) == self.start) {
            ani_p.prop.animation_time = 0;
            console.log(ani_p.prop);
            if ("action" in ani_p) ani_p.action.func(ani_p.action.params);
          }
          if (max < ani_p.prop.end) max = ani_p.prop.end;
        }

        // see if we suspend the animation
        for (i = 0; i < self.parallel_ani.length; i++) {
          ani_p = self.parallel_ani[i];
          if (parseInt(ani_p.prop.end) == self.start) {
            if (self.step_by_step == true && ani_p.prop.step && !self.has_suspend) {
             
              $("#step_forward").prop("disabled", false);
              $("#step_back").prop("disabled", false);
              self.suspend = true;
              self.has_suspend = true;
              return;
            }
          }
        }

        // finally we execute the animation by setting the property.
        for (i = 0; i < self.parallel_ani.length; i++) {
          ani_p = self.parallel_ani[i];

          if (parseInt(ani_p.prop.start) == self.start) {
            ani_p.prop.time = parseInt(ani_p.prop.end - ani_p.prop.start);
            if ("target" in ani_p) {
              ani_p.prop.reverse = false;
              ani_p.target.set_animation_property(ani_p.prop);
            }

          }
        }

      
      } else { // reverse animation

        // action
        for (i = 0; i < self.parallel_ani.length; i++) {
          ani_p = self.parallel_ani[i];
         
          if (parseInt(ani_p.prop.start) == self.start)  {
         
            ani_p.prop.animation_time = 0;
            if ("rev_action" in ani_p) {
              console.log(ani_p);
              ani_p.rev_action.func(ani_p.rev_action.params);
            }
            if (self.start == old_start) self.draw();
          }
        }

        // suspend animation
        for (i = 0; i < self.parallel_ani.length; i++) {
          ani_p = self.parallel_ani[i];
          if (parseInt(ani_p.prop.end) == self.start) {
            if (self.step_by_step == true && ani_p.prop.step && !self.has_suspend) {
              self.suspend = true;
              self.has_suspend = true;

              $("#step_forward").prop("disabled", false);
              $("#step_back").prop("disabled", false);
            
              return;
            }
          }
        }

        for (i = 0; i < self.parallel_ani.length; i++) {
          ani_p = self.parallel_ani[i];
          if (parseInt(ani_p.prop.end) == self.start) {
            ani_p.prop.time = parseInt(ani_p.prop.end - ani_p.prop.start);
            if ("target" in ani_p) {
              ani_p.prop.reverse = true;
              ani_p.target.set_animation_property(ani_p.prop);
            }
          }
        }

      }
        
      

      console.log(self.start, max);
      if (parseInt(max) == self.start) {
        self.draw();
        console.log("done");

        self.suspend = false;
        console.log(self.obj_map);
        clearInterval(id);

        $(":button").prop("disabled", false);
        $(":input").prop("disabled", false);
        $("#step_forward").prop("disabled", true);
        $("#step_back").prop("disabled", true);

      }
      
    
      
      if (self.reverse == true) self.start--;
      else self.start++;
      
      self.has_suspend = false;
      
     

      
    },1)
  }
  

  draw() {
    let l_or_c, obj;
    let i;
    // ctx.moveTo(0,0);
    ctx.clearRect(-1000,-1000,4000,4000);

    for (l_or_c of this.connection_map.values()) {
      for (i = 0; i < l_or_c.length; i++) l_or_c[i].draw();
    }
    for (obj of this.obj_map.values()) {
      obj.draw();
    }
  }
  
}



// use point attached 
class quadraticCurve {
  constructor(p1, p2, h_scale = 1/3, w_scale = 0.5, draw_arrow = true, ctx_prop = {lineWidth: 2, strokeStyle: "black"} ) {
    this.p1 = p1;
    this.p2 = p2;
    this.ctx_prop = deep_copy(ctx_prop);


    
    
    this.h_scale = h_scale;
    this.w_scale = w_scale;
    this.draw_arrow = draw_arrow;
    this.cp = this.control_point(p1, p2, h_scale, w_scale);
    // for animation
    // this.animation_time = 0;
    // this.property = null;
    this.animation_type = "parallel";
    this.animations = []
    this.dx = 0;
    this.dy = 0;
    this.dh = 0;
    this.dw = 0;
    
  }


  set_animation_property(p) {
    
    let i;


    for (i = 0; i < this.animations.length; i++) {
      if(this.animations[i] == p) break;
    }
    if (i == this.animations.length) this.animations.push(p);
  
    p.animation_time = p.time;
    

    if (p.reverse) {
      if ("p" in p) {
        this.p2 = this.p2.copy();
      }
      return;
    }

    p.tmp_ctx_prop = this.ctx_prop;
    p.ctx_prop = update_dict(this.ctx_prop, extract_ctx_prop(p));
   

    if ("p" in p) {
      if (p.type == 'pivot') {

        p.dx = (p.p.x - this.p2.x) / p.time;
        p.dy = (p.p.y - this.p2.y) / p.time;

        if ("new_h_scale" in p) p.dh = (p.new_h_scale - this.h_scale) / p.time;
        else p.dh = 0;

        if ("new_w_scale" in p) p.dw = (p.new_w_scale - this.w_scale) / p.time;
        else p.dw = 0;
        
        p.p2 = this.p2;

        this.p2 = this.p2.copy(); // disattach the old one
      } else {
        p.dx = p.p.x / p.time;
        p.dy = p.p.y / p.time;
        p.dh = 0;
        p.dw = 0;
      }
    }



  


    
  }

  move(dx, dy, dh, dw) {
    // let dx = this.dx,
    //     dy = this.dy,
    //     dh = this.dh,
    //     dw = this.dw;

    if (this.animation_type == "parallel") {
      this.p1.move(dx,dy);
      this.p2.move(dx,dy);
    } else {
      this.p2.move(dx,dy);
      this.h_scale += dh
      this.w_scale += dw;
    }
  }

  get_xy(t) {

    return new Point(
       (Math.pow(1 - t, 2) * this.p1.x) + (2 * (1 - t) * t * this.cp.x) + (Math.pow(t, 2) * this.p2.x),
       (Math.pow(1 - t, 2) * this.p1.y) + (2 * (1 - t) * t * this.cp.y) + (Math.pow(t, 2) * this.p2.y),
    );
  }

  
  draw() {
    let i, p;
    let animation_done = 0;
 
    for (i = 0; i < this.animations.length; i++) {
      p = this.animations[i];
      // console.log(p.animation_time)
      if (p.animation_time > 0) {
        
        // console.log(p);

        if (p.animation_time == p.time) {

          this.animation_type = p.type;
          this.ctx_prop = p.ctx_prop;
         
        }
        if ("type" in p ) {
          if (p.reverse) this.move(-p.dx, -p.dy, -p.dh, -p.dw);
          else this.move(p.dx, p.dy, p.dh, p.dw);
        }
        // this.ctx_prop = p.ctx_prop;
        p.animation_time--;

        if (p.animation_time == 0 && p.type == 'pivot') {
          
          p.ani.disconnect_object(this);
          if (p.reverse) {
            this.p2 = p.p2;
            p.ani.connect_object(this);
          } else if (p.p.obj != null) {
           
            this.p2 = p.p; // attach to the new one.
            p.ani.connect_object(this);

          }
        }

      } else {
        animation_done++;
      }
    }

    if (animation_done != 0 && animation_done == this.animations.length) {
      p = this.animations[0];
      this.ctx_prop = p.tmp_ctx_prop;
      this.animations = [];
    }


   


    if (this.p1.is_euqal(this.p2)) return;
    if (this.draw_arrow) this.draw_angle();
    ctx.save();
    load_ctx_prop(this.ctx_prop);
    ctx.beginPath();

    ctx.moveTo(this.p1.x,this.p1.y);
    this.cp = this.control_point(this.p1, this.p2, this.h_scale, this.w_scale);
    ctx.quadraticCurveTo(this.cp.x, this.cp.y, this.p2.x, this.p2.y);
    ctx.stroke();
    ctx.restore();

  }

  draw_angle(position = 1, angle_length = 20, angle_degree = 30) {
    let coord, coord1;
    let line;
    if (position == 0) {
      coord = this.get_xy(position);
      coord1 = this.get_xy(position + 0.00001);
    } else {
      coord = this.get_xy(position - 0.00001);
      coord1 = this.get_xy(position);
    }
    

    line = new Line(coord, coord1, true, this.ctx_prop);
    line.draw_angle(1, angle_length, angle_degree);
  }


  control_point(p1, p2, h_scale, w_scale) {

    let x1 = p1.x, 
        y1 = p1.y,
        x2 = p2.x,
        y2 = p2.y;
    
    let m = [-(y2 - y1), x2 - x1];  
    let mid = [                
      (((x2 - x1) * w_scale) + x1), 
      (((y2 - y1) * w_scale) + y1)
    ];
    let normal = [m[0] * h_scale, m[1] * h_scale];        
    return { x: normal[0] + mid[0], y: normal[1] + mid[1] };
  }
}



/* 
  This is a class drawing a rect. 
  (x, y) is the left-top point of rect. 
  ref is a unique value to the instance. It's useful for quick look up.
  text is a list of the text showing in rect. 
  (it divides the rect into sub rects where each sub rect show one entry of text)
*/


class Rect {

  constructor(x, y, width, height, ref, text, label, label_position = "top", ctx_prop = {}) {
    let i;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.label = label;
    this.label_position = label_position;
    this.ctx_prop = update_dict(DEFAULT_RECT_CTX, ctx_prop);
  
    
    this.ref = ref; 
    this.points = []; // attach points
    this.to = []; // to object
    this.from = []; // from object

    this.fillStyles = []; // the fillStyle of each subrect
    this.visted = false; // for propagation

    for (i = 0; i < this.text.length; i++) this.fillStyles.push(this.ctx_prop.fillStyle);
   

    this.animations = []
    // animation
   
    this.propagation = false;
    this.dx = 0;
    this.dy = 0;
    // this.animation_type = "parallel";
  }

 

  set_animation_property(p) {
    
    let arr = [];
    let i;

    for (i = 0; i < this.animations.length; i++) {
      if(this.animations[i] == p) break;
    }
    if (i == this.animations.length) this.animations.push(p);

    p.animation_time = p.time;


    if("reverse" in p && p.reverse) {
      console.log(p);
      return;
    }

    if ("p" in p) {


      p.dx = (p.p.x - this.x) / p.time;
      p.dy = (p.p.y - this.y) / p.time;
    }
    console.log(p);

    p.tmp_fillStyles = this.fillStyles;
    if ("fillStyle" in p) {
      if (typeof(p.fillStyle) == "string") {
        for (i = 0; i < this.text.length; i++) arr.push(p.fillStyle);
        p.fillStyles = arr;
      }
    } else {
      p.fillStyle = this.fillStyles;
    }

    p.tmp_ctx_prop = this.ctx_prop;
    p.ctx_prop = update_dict(this.ctx_prop, extract_ctx_prop(p));
    
  }


  move(dx,dy) {
    let i;
    this.x += dx;
    this.y += dy;
    
    for (i = 0; i < this.points.length; i++) {
      // this.points[i].animation_type = "parallel";
      this.points[i].move(dx,dy);
    }

    if (this.propagation && this.visted == false) {
      this.visted = true;
      for (i = 0; i < this.to.length; i++) {

        if (this.to[i] != this) {
          console.log(this.to.ref);
          this.to[i].move(dx,dy);
        }
      }
      this.visted = false;
    }
  }


  attach_points(ps) {
    for (let i = 0; i < ps.length; i++) {
      this.attach_point(ps[i]);
    }
  }

  attach_point(p) {
    if (p.x >= this.x && p.x <= this.x + this.width &&
        p.y >= this.y && p.y <= this.y + this.height) {

      p.obj = this;
      for (let i = 0; i < this.points.length; i++) {
        if (p.is_euqal(this.points[i])) return;
      }
      this.points.push(p);

    } else {
      console.log("point is not within rect");
    }
    
  }

 
  // add option of horizontal
  fill_sub_rect(i) {
    ctx.fillStyle = this.fillStyles[i];
    ctx.fillRect(this.x, this.y + this.height / this.text.length * i, this.width, this.height / this.text.length);
  }
  
  draw () {
    let i, x, y;
    let num_fields = this.text.length;
    let p;
    let animation_done = 0;
    // update animation

    for (i = 0; i < this.animations.length; i++) {
      p  = this.animations[i];


      if (p.animation_time > 0) {

        if (p.animation_time == p.time) {
          this.fillStyles = p.fillStyle;
          this.ctx_prop = p.ctx_prop;
          if ("propagation" in p) this.propagation = p.propagation;
        }
       
       
        if ("p" in p) {
          if (p.reverse) {
            // console.log("reverse");
            this.move(-p.dx, -p.dy);
          }
          else this.move(p.dx, p.dy);
        }

        if (REVERSE_ANIMATION && p.reverse == false) {
          // console.log(p)
          p.animation_time++;
        }
        else p.animation_time--;
        if (p.animation_time == 0) {
          
          this.ctx_prop = p.tmp_ctx_prop;
          this.fillStyles = p.tmp_fillStyles;
        }

      } else {
        animation_done++;
      }
    }

    // when all of animations are done, we restore the rect property.
    // the first animation's tmp store the original rect property.
    if (animation_done != 0 && animation_done == this.animations.length) {

      p = this.animations[0];
      console.log(p);
      this.ctx_prop = p.tmp_ctx_prop;
      this.fillStyles = p.tmp_fillStyles;
      this.animations = [];
    }

  

    ctx.save();
    load_ctx_prop(this.ctx_prop);

    // draw the shadow
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
    
    // fill the subrect
    for (i = 0; i < num_fields; i++) this.fill_sub_rect(i);
   
    // draw the border of rect.
    ctx.strokeRect(this.x, this.y, this.width, this.height);
   

    // draw the line to separate each text field.
    ctx.beginPath();

    for (i = 1; i < num_fields; i++) {
      ctx.moveTo(this.x, this.y + this.height / num_fields * i);
      ctx.lineTo(this.x + this.width, this.y + this.height / num_fields * i);
     
    }
    ctx.stroke();
   
    // draw text
    ctx.beginPath();
  
    for (i = 0; i < this.text.length; i++) {
      this.draw_text(PADDING + this.x, this.y + this.height / num_fields / 2 * (2*i + 1), this.text[i]);
    }
    if (this.label != "") {
      if (this.label_position == "top") {
        this.draw_text(this.x + (this.width - ctx.measureText(this.label).width) / 2, this.y - 2 * PADDING, this.label);
      } else if (this.label_position == "bottom"){
        this.draw_text(this.x + (this.width - ctx.measureText(this.label).width) / 2, this.y + this.height + 2 * PADDING, this.label);
      } else {
        console.log("Rect.draw(): label_position is either top or bottom");
      }
    }
    ctx.restore();
   
    
  }

  draw_text(x, y_middle, text) {

    ctx.strokeStyle = "black";
    ctx.textBaseline = "middle";
    ctx.font = FONT;
    ctx.strokeText(text, x, y_middle);
   
  }

} 











/* draw a line 
   if rotation is specified, it's going to rotate "rotation" degress around point(x,y); then it draws a line along 
   with new x-axis with the length of dest_x. dest_y is ignored in this case.
*/
class Line {
  constructor(p1, p2, draw_arrow = true, ctx_prop = {lineWidth: 2, strokeStyle: "black"} ) {
    this.p1 = p1;
    this.p2 = p2;
    this.ctx_prop = ctx_prop;
    this.draw_arrow = draw_arrow;
    // for animation
    this.animation_time = 0;
    this.animation_type = "";
  
    this.dx = 0;
    this.dy = 0;
  }



  set_animation_property(p) {
   
    this.animation_time = ANIMATION_TIME;

    if ("type" in p) {
      this.animation_type = p.type;
    } else {
      console.log("Line: wrong spec for set_animation_property");
      return;
    }

    if ("p" in p) {

      if (p.type == 'pivot') {
        this.dx = (p.p.x - this.p2.x) / ANIMATION_TIME;
        this.dy = (p.p.y - this.p2.y) / ANIMATION_TIME;
      } else {
        this.dx = (p.p.x - this.p1.x) / ANIMATION_TIME;
        this.dy = (p.p.y - this.p1.y) / ANIMATION_TIME;
      }
    
    } else {
      console.log("Line: wrong spec for set_animation_property");
    }
  
  

   
  }

  move() {
    let dx = this.dx,
        dy = this.dy;

    if (this.animation_type == "parallel") {
      this.p1.move(dx,dy);
      this.p2.move(dx,dy);
    } else if (this.animation_type == "pivot") {
      this.p2.move(dx,dy);
    }
  }



 
  draw() {

    if (this.animation_time > 0) {
      this.animation_time--;
      this.move();
    }

    if (this.draw_arrow) this.draw_angle();
    ctx.save();
    load_ctx_prop(this.ctx_prop);

    ctx.beginPath();
    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);

    ctx.stroke();
    ctx.restore();
  }

  get_angle() {
   
    let radian = Math.atan((this.p2.y - this.p1.y) / (this.p2.x - this.p1.x));
    if (this.p2.x- this.p1.x >= 0) radian += Math.PI;
    else radian += 2 * Math.PI;
    // console.log(radian * 180 / Math.PI)
    return radian;
  }


  draw_angle(t = 1, angle_length = 10, angle_degree = 30) {
    let x,y;

    x = this.p1.x + (this.p2.x - this.p1.x) * t;
    y = this.p1.y + (this.p2.y - this.p1.y) * t;

    /* the angle is composed of two lines */

    // first line
    ctx.save();
    load_ctx_prop(this.ctx_prop);
    ctx.translate(x,y);
    ctx.rotate(this.get_angle() + angle_degree / 180 * Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(angle_length, 0);
    ctx.stroke();
    ctx.restore();

    // second line
    ctx.save();
    load_ctx_prop(this.ctx_prop);
    ctx.translate(x,y);
    ctx.rotate(this.get_angle() - angle_degree / 180 * Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(angle_length, 0);
    ctx.stroke();
    ctx.restore();

  }

  
}
