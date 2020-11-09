var ANIMATION_TIME = 100;
const PADDING = 10;
const FONT = "12px Arial";
const BACKGROUND_COLOR = "white"
const canvas = document.getElementById("draw");
const ctx = document.getElementById("draw").getContext("2d");
const DEFAULT_RECT_CTX = {fillStyle : "#DDDDDD", strokeStyle : "#696969"};
const DEFAULT_CIRCLE_CTX = {fillStyle : "#DDDDDD", strokeStyle : "#696969"};
const DEFAULT_LINE_CTX = {lineWidth: 2, strokeStyle: "black"};
const ROUNDING_THRESHOLD = 0.0001;
var OFFSET_X = 0;
var OFFSET_Y = 0;
var REVERSE_ANIMATION = false;
var PRESS_W_KEY = false; // adding edge
var PRESS_D_KEY = false; // deleting edge


var a;


/* This if for graph weight type */
const T_NUMBER = 0b1;
const T_POSITIVE_NUMBER = 0b10;
const T_NON_NEGATIVE_NUMBER = 0b100;
const T_NEGATIVE_NUMBER = 0b1000;
const T_STRING = 0b10000;
const T_CONSTANT = 0b100000;




// calculate perpendicular vector
function perpendicular_vector(p1, p2) {
  let x, y;
  x = p2.x - p1.x;
  y = p2.y - p1.y;

  return unit_vector(-y, x);
}


// calculate unit vector
function unit_vector(x, y) {
  let i;
  i = x * x + y * y;
  i = Math.sqrt(i);

  return new Point(x / i, y / i)
}

// calculate distance 
function cal_distance(x1, y1, x2, y2) {
  return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}

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
  if ("lineWidth" in prop) rv.lineWidth = prop.lineWidth;
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
  constructor(elaboration_text = null) {
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
    this.elaboration = $("#elaboration_text");
    this.elaboration.text("");
    this.g = null; // Graph object
    // for dragging node and connecting two nodes.
    this.dragging_obj = null;
    this.edge_line = null;
    this.press_key = null; // either 'd/D' or 'w/W'

  }

 
  get_point(x, y, force = false) {
    let p;
    let i;
    p = new Point(x,y);

    if (!force) {
      for (i = 0; i < this.points.length; i++) {
        if (this.points[i].is_euqal(p)) return this.points[i];
      }
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
    let i;
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

      // make sure it doesn't exist.
      for (i = 0; i < this.connection_map.get(key).length; i++) {
        if (this.connection_map.get(key)[i] == line_or_curve) return;
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
      console.log("{} line_or_curve is not connected".format(key));
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
    let max = -1;

    for (i = 0; i < this.sequence_ani.length; i++) {
      seq = this.sequence_ani[i];

      if (!("prop" in seq)) seq.prop = {};
      seq.prop.start = start;


      if (!("step" in seq.prop)) seq.prop.step = false;

      if ("pause" in seq) {
        time = seq.pause;
        // if ('ref' in seq)
        //   console.log(start, start+time, seq);
      }
      else if ("time" in seq.prop) {
        time = seq.prop.time;
        delete seq.prop.time;
      } else time = ANIMATION_TIME;

      seq.prop.end = start + time;
      if (max < seq.prop.end) max = seq.prop.end;
      if ('concurrence' in seq && seq.concurrence == true) {

      } else {
        start = max;
      }
      this.parallel_ani.push(seq);
    }
    this.sequence_ani = [];
  }

  link_text() {
    let i;
    let start, ani_p;
    let dict = {};
    let keys, pre_text;

    for (i = 0; i < this.parallel_ani.length; i++) {
       ani_p = this.parallel_ani[i];
      
       if ("text" in ani_p) dict[ani_p.prop.start] = ani_p;
    }

    keys = Object.keys(dict);

    if (keys.length != 0) pre_text = dict[keys[0]].text;
    for (i = 1; i < keys.length; i++) {
      dict[keys[i]].pre_text = pre_text;
      pre_text = dict[keys[i]].text;
    }

  }

  resume_animation() {
    this.suspend = false;
  }

  reverse_animation() {
    this.reverse = true;
    this.elaboration.text("")
    REVERSE_ANIMATION = true;

  }

  clear_animation() {
    this.start = 0;
    this.sequence_ani = [];
    this.parallel_ani = [];
  }

  run_animation(skip = false) {


    let self = this;
    let ani_p;
    let i;
    let old_start = this.start;
    let max = -1;
    let draw_after_action = true;
    let call_draw = 0;
    this.sequence_to_parallel();
    this.link_text();
    this.suspend = false;

    this.draw();

    // for (i = 0; i < self.parallel_ani.length; i++) {
    //   // console.log(self.parallel_ani[i].prop.start, self.parallel_ani[i].prop.end);
    //   // if (self.parallel_ani[i].prop.end == 347) console.log(self.parallel_ani[i]);
    // }
    // return;

    let id = setInterval(function() {
      
      
      // reverse to the beginning of animation
      if(self.reverse && self.start == old_start - 1) {
        console.log("get to old start", self.start)
        $("#step_forward").prop("disabled", false);
        return;
      }

      // suspending the animation
      if (self.step_by_step && self.suspend) {
        
        if (draw_after_action) {
          self.draw(true);
        }
        draw_after_action = false;
        return; 
      }

      
      draw_after_action = true;
      // disable inputs during animation
      $(":button").prop("disabled", true);
      $(":input").prop("disabled", true);
     
     
      // process animation
     
        
     
      if (self.reverse == false) {

        // trigger action
        for (i = 0; i < self.parallel_ani.length; i++) {
          ani_p = self.parallel_ani[i];
         
          if (parseInt(ani_p.prop.end) == self.start) {
            ani_p.prop.animation_time = 0;
            if ("action" in ani_p) {
              console.log(self.start, ani_p);
              ani_p.action.func(ani_p.action.params);
            }
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
               console.log("stop forward ", self.start);
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
              console.log(ani_p.target, ani_p.prop);
              ani_p.target.set_animation_property(ani_p.prop);
            }

            if ("text" in ani_p) {
              self.elaboration.text(ani_p.text);
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
              // console.log(ani_p);
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
              console.log("stop ", self.start);
              return;
            }
          }
        }

        for (i = 0; i < self.parallel_ani.length; i++) {
          ani_p = self.parallel_ani[i];
          if (parseInt(ani_p.prop.end) == self.start) {
            ani_p.prop.time = parseInt(ani_p.prop.end - ani_p.prop.start);
            if ("target" in ani_p) {
              // console.log(ani_p);
              ani_p.prop.reverse = true;
              ani_p.target.set_animation_property(ani_p.prop);
            }

            // to do need previous text
            if ("pre_text" in ani_p) {
              self.elaboration.text(ani_p.pre_text);
            }
          }



        }

      }
        
      

      console.log(self.start, max);
      if (parseInt(max) == self.start) {
        self.draw();
        console.log("done");

        self.suspend = false;

        // I increment it by one here. So the next animation won't interact with previous when stepping back.
        self.start++; 
        console.log(self.obj_map);
        console.log(self.connection_map);
        clearInterval(id);

        $(":button").prop("disabled", false);
        $(":input").prop("disabled", false);
        $("input[name=graph_type]").prop("disabled", true);
        $("#step_forward").prop("disabled", true);
        $("#step_back").prop("disabled", true);
        return;
      }
      
    
      
      if (self.reverse == true) self.start--;
      else self.start++;
      
      self.has_suspend = false;
      
      self.draw();
      call_draw++;

     

      
    },1)
  }
  
  mouse_down(x, y) {
    let obj;
    let l_or_c;
    let i;
    let keys = [];
    for (let key of this.obj_map.keys()) keys.push(key);
   
    for (i = keys.length - 1; i >= 0; i--) {
      obj = this.obj_map.get(keys[i]);
      if ("mouse_down" in obj && obj.mouse_down(x - OFFSET_X, y - OFFSET_Y) ) {
        this.dragging_obj = obj;
        return;
      }
    }
   
    for (l_or_c of this.connection_map.values()) {
      for (i = 0; i < l_or_c.length; i++) {
        if ("mouse_down" in obj && l_or_c[i].mouse_down(x - OFFSET_X, y - OFFSET_Y)) {
          this.dragging_obj = l_or_c[i];
          return;
        }
      }
    }
  }

  mouse_up(x, y) {
    let w;
    let e;
    let g = this.g;
    x = x - OFFSET_X;
    y = y - OFFSET_Y;
    if (this.dragging_obj != null) {
      if (this.edge_line != null) {
        console.log(x, y);
        for (let obj of this.obj_map.values()) {
          if (obj != this.dragging_obj && "mouse_down" in obj && obj.mouse_down(x,y)) {
            
            if (this.press_key == 'W') { // add
              if (g.weight_type != T_CONSTANT) w = prompt("Please enter the weight of edge");

              if (w != null) {
                g.get_edge(g.get_node(this.dragging_obj.ref), g.get_node(obj.ref), w);
              }
            } else if (this.press_key == 'D') { // delete
              g.remove_edge(g.get_node(this.dragging_obj.ref), g.get_node(obj.ref));
            }
            
            obj.mouse_up();
            // PRESS_W_KEY = false;
            // PRESS_D_KEY = false;
            break;
          }
        }
        
        this.draw(true);
      }
      this.dragging_obj.mouse_up();
      this.dragging_obj = null;
      this.edge_line = null;
    }
  }

  mouse_move(x, y) {
    if (this.dragging_obj != null) {
      if (PRESS_W_KEY || PRESS_D_KEY) {
        this.edge_line = new quadraticCurve(new Point(this.dragging_obj.x, this.dragging_obj.y), new Point(x - OFFSET_X, y - OFFSET_Y),0);
        this.edge_line.draw_arrow = false;
        if (this.g != null) {
          this.edge_line.ctx_prop.strokeStyle = this.g.edge_color;
          this.edge_line.ctx_prop.lineWidth = this.g.edge_width;
        }
        this.draw(true);
        this.edge_line.draw();

        if (PRESS_W_KEY) this.press_key = 'W';
        if (PRESS_D_KEY) this.press_key = 'D';
      } else {
        if (this.edge_line == null){
          this.dragging_obj.mouse_move(x - OFFSET_X, y - OFFSET_Y);
        } 
        this.draw(true); 
      }
      return;
    }
  }

  draw(skip_animation = false) {
    let l_or_c, obj;
    let i;
    // ctx.moveTo(0,0);
    ctx.clearRect(-1000,-1000,4000,4000);

    for (l_or_c of this.connection_map.values()) {
      for (i = 0; i < l_or_c.length; i++) l_or_c[i].draw(skip_animation);
    }
    for (obj of this.obj_map.values()) {
      obj.draw(skip_animation);
    }
  }
  
}


// use point attached 
class quadraticCurve {
  constructor(p1, p2, h_scale = 1/3, w_scale = 0.5, draw_arrow = true, text = "", text_direction = "right", ctx_prop = {} ) {
    this.p1 = p1;
    this.p2 = p2;
    this.ctx_prop = update_dict(DEFAULT_LINE_CTX, ctx_prop);


    this.h_scale = h_scale;
    this.w_scale = w_scale;
    this.draw_arrow = draw_arrow;
    this.text = text;
    this.cp = this.control_point(p1, p2, h_scale, w_scale);
    this.adjust_line = false;
    this.is_move = false;
    this.text_direction = text_direction;
    this.line_type = "";
    this.angle_length = 20;
    this.angle_degree = 30;

    // for animation
    // this.animation_time = 0;
    // this.property = null;
    this.animation_type = "parallel";
    this.text_t = 0.5;
    this.animations = [];

    // this.dx = 0;
    // this.dy = 0;
    // this.dh = 0;
    // this.dw = 0;
    
  }

  update_cp() {
     this.cp = this.control_point(this.p1, this.p2, this.h_scale, this.w_scale);
  }

  set_animation_property(p) {
    
    let i;


    for (i = 0; i < this.animations.length; i++) {
      if(this.animations[i] == p) {
        console.log("same1", i, this.animations.length);
        break;
      }
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
   
     console.log(p.animation_time, p.time, p.ctx_prop);

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

  enable_mouse_move() {
    this.adjust_line = true;
  }

  mouse_down(x, y) {
    let i;
    let p, pv;
    let tw, dx;
    let w, h;

    if (!this.adjust_line) return;
    if (this.text == "") return;

    
    tw = this.tw;
    p = this.get_xy(this.text_t);

    dx = 0;
    if (this.text_direction == "left") {
      pv = perpendicular_vector(p, this.get_xy(this.text_t - 0.00001));
      if (this.p1.y > this.p2.y) dx = tw * pv.x;
    } else if (this.text_direction == "right") {
      pv = perpendicular_vector(p, this.get_xy(this.text_t + 0.00001));
      if (this.p1.y < this.p2.y) dx = -tw + pv.x;
    } else {
      console.log("text_direction must be left or right");
    }

    if (dx == 0) dx = tw / 2 + pv.x * 5;
    else dx += tw / 2 + pv.x * 5;

    // console.log(p.x + 10 * pv.x + dx - tw / 2,  p.y + 10 * pv.y - 12, tw, 24)
    // ctx.strokeRect(p.x + 10 * pv.x + dx - tw / 2,  p.y + 10 * pv.y - 12, tw, 24);
   
    if (x >= p.x + dx - tw / 2 && x <= p.x + dx + tw / 2 && y >= p.y + 10 * pv.y - 12 && y <= p.y + 10 * pv.y + 12) {
      this.is_move = true;
      this.last_x = x;
      this.last_y = y;
      return true;
    }

    return false;


  }

  mouse_up() {
    this.is_move = false;
  }

  mouse_move(x, y) {

    if (!this.is_move) return false;
   

    let dist1, dist2, dist3, dist4, dist5, dist6, d;
    let sensitivity;

    dist1 = cal_distance(this.last_x, this.last_y, this.p1.x, this.p1.y);
    dist2 = cal_distance(x, y, this.p1.x, this.p1.y);
    
    dist3 = cal_distance(this.last_x, this.last_y, this.p2.x, this.p2.y);
    dist4 = cal_distance(x,  y, this.p2.x, this.p2.y);

    sensitivity = cal_distance(this.last_x, this.last_y, x, y);
    sensitivity = sensitivity / cal_distance(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
    sensitivity = Math.sqrt(sensitivity);
   
    if (dist4 > dist3 && dist2 > dist1) { // move away from both points
   
    } else if (dist4 < dist3 && dist2 < dist1) {// move toward both boths
   
    } else if (dist2 > dist1) { // move toward to point
      console.log("move to");
      this.text_t += sensitivity;
    } else if (dist2 < dist1) { // move toward from point
      console.log("move form");
      this.text_t -= sensitivity;
    }

    if (this.text_t >= 0.9) this.text_t = 0.9;
    if (this.text_t <= 0.1) this.text_t = 0.1;

    this.last_x = x;
    this.last_y = y;

    return true;
  }

  
  
  draw(skip_animation = false) {
    let i, p;
    let animation_done = 0;
  
    if (!skip_animation) {
      for (i = 0; i < this.animations.length; i++) {
        p = this.animations[i];
        
        // console.log(p.animation_time)
        if (p.animation_time > 0) {
          
          // console.log(p);

          if (p.animation_time == p.time) {

            this.animation_type = p.type;
            this.ctx_prop = p.ctx_prop;
             // console.log(this.ctx_prop, p.animation_time, this.animations.length);
          }
          if ("type" in p ) {
            if (p.reverse) this.move(-p.dx, -p.dy, -p.dh, -p.dw);
            else this.move(p.dx, p.dy, p.dh, p.dw);
          }

          if (REVERSE_ANIMATION && p.reverse == false) {
            p.animation_time++;
          } else p.animation_time--;

          if (p.animation_time == 0 || p.animation_time == p.time) {
            animation_done++;
            this.ctx_prop = p.tmp_ctx_prop;
          }


          if ( (p.animation_time == p.time || p.animation_time == 0) && p.type == 'pivot') {
            
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

    this.draw_text();
    ctx.restore();


  }

  draw_text() {
    if (this.text == "") return;
    let p = this.get_xy(this.text_t);
    let pv, dx, dy;
    let tw;


    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.textBaseline = "middle";
    ctx.font = FONT;
    tw = ctx.measureText(this.text).width;
    this.tw = tw;

    dx = 0;
    if (this.text_direction == "left") {
      pv = perpendicular_vector(p, this.get_xy(this.text_t - 0.00001));
      if (this.p1.y > this.p2.y) dx = tw * pv.x;
    } else if (this.text_direction == "right") {
      pv = perpendicular_vector(p, this.get_xy(this.text_t + 0.00001));
      if (this.p1.y < this.p2.y) dx = -tw + pv.x;
    } else {
      console.log("text_direction must be left or right");
    }

    if (dx == 0) dx = tw / 2 + pv.x * 5;
    else dx += tw / 2 + pv.x * 5;

    ctx.strokeText(this.text, p.x + dx - tw / 2, p.y + 10 * pv.y);

  }


  draw_angle(position = 1, angle_length = this.angle_length, angle_degree = this.angle_degree, reverse = false) {
    if (this.p1.is_euqal(this.p2)) return;
    let coord, coord1;
    let line, obj;
    let i, p, t1;


    if (this.line_type == "direct") {
      obj = this.p2.obj;
      for (i = 1; i >= 0; i -= 0.01) {
        p = this.get_xy(i);
       
        if (cal_distance(p.x, p.y, obj.x, obj.y) >= obj.r * obj.r) {
          break;
        }
      }
      position = i;
    } else if (this.line_type == "undirect") return;
   
    
    if (position == 0) {
      coord = this.get_xy(position);
      coord1 = this.get_xy(position + 0.00001);
    } else {
      coord = this.get_xy(position - 0.00001);
      coord1 = this.get_xy(position);
    }
    
    if (reverse) line = new Line(coord1, coord, true, this.ctx_prop);
    else line = new Line(coord, coord1, true, this.ctx_prop);
  
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


class Circle {
  constructor(x, y, r, 
              ref = "", text = "", label = "", 
              label_position = "top", text_direction = 'v', ctx_prop = {}) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.text = text;
    this.label = label;
    this.label_position = label_position;
    this.text_direction = text_direction;
    this.ctx_prop = update_dict(DEFAULT_CIRCLE_CTX, ctx_prop);
    this.move_circle = false;
    this.is_move = false;

    this.visted = false;
    this.propagation = false;

    this.animations = [];
    this.ref = ref;
    this.points = []; // only one center point if it has element
    this.to = [];
    this.from = [];
  }

  attach_point(p) {

    if (p.is_euqal(new Point(this.x, this.y))) {
      p.obj = this;
      this.points.push(p);
    } else {
      console.log("point must be center of circle");
    }    
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

   
    p.tmp_ctx_prop = this.ctx_prop;
    p.ctx_prop = update_dict(this.ctx_prop, extract_ctx_prop(p));
    
  }


  move (dx, dy) {
    let i;
    this.x += dx;
    this.y += dy;
    
    for (i = 0; i < this.points.length; i++) {
    
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

  enable_mouse_move() {
    this.move_circle = true;
  }

  // enable_create_edge() {
  //   // this.move_circle = false;
  //   this.create_edge = true;
  // }

  draw(skip_animation = false) {
    let x = this.x,
        y = this.y,
        r = this.r;
    let i, animation_done;
    let line;
    let t;
    let next_p;
    let tmp;
    let p;

    animation_done = 0;
    

    if (!skip_animation) {
      for (i = 0; i < this.animations.length; i++) {
        p  = this.animations[i];

        if (p.animation_time > 0) {

          if (p.animation_time == p.time) {
            this.ctx_prop = p.ctx_prop;
            if ("propagation" in p) this.propagation = p.propagation;
          }
         
          
          if ("p" in p) { // move based on a point
            if (p.reverse) {
              // console.log("reverse");
              this.move(-p.dx, -p.dy);
            }
            else this.move(p.dx, p.dy);
          } else if ("path" in p) { // move based on a path
            line = p.path;
            if (p.reverse) {
              t = (p.animation_time - 1)  / p.time;
             
            } else {
              t = (p.time - p.animation_time + 1) / p.time;
             
            }
            next_p = line.get_xy(t);
            this.move(next_p.x - this.x, next_p.y - this.y)
          } 

          if (REVERSE_ANIMATION && p.reverse == false) {
            p.animation_time++;
          } else p.animation_time--;

          if (p.animation_time == 0 || p.animation_time == p.time) {
            animation_done++;
            this.ctx_prop = p.tmp_ctx_prop;
          }

          // console.log("time: ", p.animation_time)
        } else {
          animation_done++;
        }
        if (this.ref == 2) 
         console.log(p.animation_time);
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
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
   
    if (this.text !== "") this.draw_text(x - r, y, 2 * r, this.text);
    if (this.label !== "") {
      if (this.label_position == "top") this.draw_text(x - r, y - r - PADDING, 2 * r, this.label);
      else this.draw_text(x - r, y + r + PADDING, 2 * r, this.label);
    }
    ctx.restore();
  }

  mouse_down(x, y) {

    if (!this.move_circle) return;
    
    let distance;
    distance = (this.x - x) * (this.x - x) + (this.y - y) * (this.y - y);

    if (distance <= this.r * this.r) {
      this.is_move = true;
      return true;
    }

    return false;

  }
  mouse_up() {
    this.is_move = false;
  }

  mouse_move(x, y) {

    // console.log(this.is_move);

    if (this.is_move) {
      this.move(x - this.x, y - this.y);
      return true;
    } else if (this.is_edge) {

    }

    return false;
    
  }

  draw_text(x, y_middle, width, text) {
    let tw;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.textBaseline = "middle";
    ctx.font = FONT;
    tw = ctx.measureText(text).width;
    console.log()
    ctx.strokeText(text, x + (width - tw) / 2, y_middle);
   
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

  constructor(x, y, width, height, ref = "", text = [], label = "", label_position = "top", text_direction = 'v', ctx_prop = {}) {
    let i;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.label = label;
    this.label_position = label_position;
    this.ctx_prop = update_dict(DEFAULT_RECT_CTX, ctx_prop);
    this.text_direction = text_direction;
  
    
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
  }

  center_point() {
    return new Point(this.x + this.width / 2, this.y + this.height / 2);
  }
  
  copy_to_entry(t, index1, rect, index2, h_scale, w_scale, ctx_prop = {}) {
    let p, p1, p2, l, x, y1, y2;
    let size;
    let rect1;
    let block_size;
    let cp;

    let prop = update_dict(DEFAULT_RECT_CTX, ctx_prop);
    prop.globalAlpha = 0.5;
    
    if (index1 > this.text.length || index2 > rect.text.length) {
      console.log("index1/index2 are out of boundary");
      return;
    }
    // I assume the text_direction are same for both objects
    if (this.text_direction == 'h') {
      size = this.text.length;
      block_size = this.width / size;
      p1 = new Point(this.x + block_size * index1 + block_size / 2, this.y + this.height / 2);
      rect1 = new Rect(p1.x - block_size / 2, p1.y - this.height / 2, this.width / size, this.height, "1", [this.text[index1]],"", "top", "h", prop);
      
      size = rect.text.length;
      block_size = rect.width / size;
      p2 = new Point(rect.x + block_size * index2 + block_size / 2, rect.y + rect.height / 2);
    

    } else {
      size = this.text.length;
      block_size = this.height / size;
      p1 = new Point(this.x, this.y + block_size * index1 + block_size / 2);
      rect1 = new Rect(p1.x - this.width / 2, p1.y - block_size / 2, this.width, this.height / size, "1", [this.text[index1]],"", "top", "h", prop);
      
      size = rect.text.length;
      block_size = rect.width / size;
      p2 = new Point(rect.x, rect.y + block_size * index2 + block_size / 2);
     

    }
    
    l = new quadraticCurve(p1, p2, h_scale, w_scale, false, {lineWidth: 5, strokeStyle: "rgb(255,0,0,0.5)"} );
    p = l.get_xy(t);
    cp = rect1.center_point();
    rect1.move(p.x - cp.x, p.y - cp.y);
    rect1.draw();


    ctx.save();
    ctx.globalCompositeOperation = "destination-over"
    // l.draw();
    ctx.restore();

  }
  swap_entries(t, index1, index2, h_scale = 2, w_scale = 0.5, ctx_prop = {}) {
    let p, p1, p2, l, x, y1, y2;
    let size = this.text.length;
    let rect1, rect2;
    let block_size;
    let cp;

    let prop = update_dict(DEFAULT_RECT_CTX, ctx_prop);
    prop.globalAlpha = 0.5;

    if (index1 > size || index2 > size) {
      console.log("index1/index2 are out of boundary");
      return;
    }
    if (this.text_direction == "h") {
      block_size = this.width / size;
      p1 = new Point(this.x + block_size * index1 + block_size / 2, this.y + this.height / 2);
      p2 = new Point(this.x + block_size * index2 + block_size / 2, this.y + this.height / 2);
      rect1 = new Rect(p1.x - block_size / 2, p1.y - this.height / 2, this.width / size, this.height, "1", [this.text[index1]],"", "top", "h", prop);
      rect2 = new Rect(p2.x - block_size / 2, p2.y - this.height / 2, this.width / size, this.height, "2", [this.text[index2]],"", "top", "h", prop);
    } else {
      block_size = this.height / size;
      p1 = new Point(this.x, this.y + block_size * index1 + block_size / 2);
      p2 = new Point(this.x, this.y + block_size * index2 + block_size / 2);
      rect1 = new Rect(p1.x - this.width / 2, p1.y - block_size / 2, this.width, this.height / size, "1", [this.text[index1]],"", "top", "h", prop);
      rect2 = new Rect(p2.x - this.width / 2, p2.y - block_size / 2, this.width, this.height / size, "2", [this.text[index2]],"", "top", "h", prop);
    }


    l = new quadraticCurve(p1, p2, h_scale, w_scale, false, {lineWidth: 5, strokeStyle: "rgb(255,0,0,0.5)"} );
    
    p = l.get_xy(t);
    cp = rect1.center_point();
    rect1.move(p.x - cp.x, p.y - cp.y);
    rect1.draw();

    p = l.get_xy(1 - t);
    cp = rect2.center_point();
    rect2.move(p.x - cp.x, p.y - cp.y);
    rect2.draw();
    ctx.save();
    ctx.globalCompositeOperation = "destination-over"
    // l.draw();
    ctx.restore();
    
   

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
    } else if ("swap" in p) {
      if (!("h_scale" in p.swap)) p.swap.h_scale = 2;
      if (!("w_scale" in p.swap)) p.swap.w_scale = 0.5;
    } else if ("copy" in p) {
      if (!("h_scale" in p.copy)) p.copy.h_scale = 2;
      if (!("w_scale" in p.copy)) p.copy.w_scale = 0.5;
      if (!("ctx_prop" in p.copy)) p.copy.ctx_prop = {};
      p.copy.text1 = this.text[p.copy.index1];
      p.copy.text2 = p.copy.rect.text[p.copy.index2];

    }

    console.log(p);

    p.tmp_fillStyles = this.fillStyles;
    if ("fillStyle" in p) {
      if (typeof(p.fillStyle) == "string") {
        for (i = 0; i < this.text.length; i++) arr.push(p.fillStyle);
        p.fillStyle = arr;
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
    if (this.text_direction == "v")
      ctx.fillRect(this.x, this.y + this.height / this.text.length * i, this.width, this.height / this.text.length);
    else 
      ctx.fillRect(this.x + this.width / this.text.length * i, this.y, this.width / this.text.length, this.height);
  }
  
  draw (skip_animation = false) {
    let i, x, y;
    let num_fields = this.text.length;
    let p;
    let animation_done = 0;
    let line;
    let t;
    let next_p;
    let tmp;
    // update animation

    if (!skip_animation) {
      for (i = 0; i < this.animations.length; i++) {
        p  = this.animations[i];


        if (p.animation_time > 0) {

          if (p.animation_time == p.time) {
            this.fillStyles = p.fillStyle;
            this.ctx_prop = p.ctx_prop;
            if ("propagation" in p) this.propagation = p.propagation;
          }
         
          
          if ("p" in p) { // move based on a point
            if (p.reverse) {
              // console.log("reverse");
              this.move(-p.dx, -p.dy);
            }
            else this.move(p.dx, p.dy);
          } else if ("path" in p) { // move based on a path
            line = p.path;
            if (p.reverse) {
              t = (p.animation_time - 1)  / p.time;
             
            } else {
              t = (p.time - p.animation_time + 1) / p.time;
             
            }
            next_p = line.get_xy(t);
            this.move(next_p.x - this.x, next_p.y - this.y)
          } else if ("swap" in p) {
            this.swap_entries( (p.time - p.animation_time) / p.time, 
                                p.swap.index1, p.swap.index2, 
                                p.swap.h_scale, p.swap.w_scale);
          } else if ("copy" in p) {
            // console.log("copy")
            if (!p.reverse)
              this.copy_to_entry((p.time - p.animation_time) / p.time, 
                                  p.copy.index1, p.copy.rect, p.copy.index2, 
                                  p.copy.h_scale, p.copy.w_scale, p.copy.ctx_prop);
          }

          if (REVERSE_ANIMATION && p.reverse == false) {
            // console.log(p)
            p.animation_time++;
          } else p.animation_time--;

          if (p.animation_time == 0) {
            animation_done++;
            this.ctx_prop = p.tmp_ctx_prop;
            this.fillStyles = p.tmp_fillStyles;
            if ("swap" in p) {
              tmp = this.text[p.swap.index1]
              this.text[p.swap.index1] = this.text[p.swap.index2];
              this.text[p.swap.index2] = tmp;
            } else if ("copy" in p) {
             
              if (p.reverse) p.copy.rect.text[p.copy.index2] = p.copy.text2;
              else p.copy.rect.text[p.copy.index2] = p.copy.text1;
            }
          }

        } else {
          animation_done++;
        }
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
      if (this.text_direction == 'v') {
        ctx.moveTo(this.x, this.y + this.height / num_fields * i);
        ctx.lineTo(this.x + this.width, this.y + this.height / num_fields * i);
      } else {
        ctx.moveTo(this.x + this.width / num_fields * i, this.y);
        ctx.lineTo(this.x + this.width / num_fields * i, this.y + this.height);
      }

     
    }
    ctx.stroke();
   
    // draw text
    ctx.beginPath();
  
    for (i = 0; i < this.text.length; i++) {
      if (this.text_direction == "v")
        this.draw_text(this.x, this.y + this.height / num_fields / 2 * (2*i + 1), this.width, this.text[i]);
      else 
        this.draw_text(this.x + this.width / num_fields * i, this.y + this.height / 2, this.width / num_fields, this.text[i]);
    }
    if (this.label !== "") {
      if (this.label_position == "top") {
        this.draw_text(this.x, this.y - PADDING, this.width, this.label);
      } else if (this.label_position == "bottom"){
        this.draw_text(this.x, this.y + this.height + PADDING, this.width, this.label);
      } else {
        console.log("Rect.draw(): label_position is either top or bottom");
      }
    }
    ctx.restore();
   
    
  }

  draw_text(x, y_middle, width, text) {
    let tw;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.textBaseline = "middle";
    ctx.font = FONT;
    tw = ctx.measureText(text).width;

    ctx.strokeText(text, x + (width - tw) / 2, y_middle);
   
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





class Node {
  constructor(id) {
    this.id = id;
    this.adj = [];
    this.visited = 0;
    this.ani_circle = null;
    this.itr = null;
    this.distance = -1;
    this.backedge = null;
  }

  shallow_copy() {
    let n = new Node(this.id);
    n.adj = this.adj;
    n.visited = this.visited;
    n.ani_circle = this.ani_circle;
    n.itr = this.itr;
    n.distance = this.distance;
    n.backedge = this.backedge;
    return n;
  }
}

class Edge {
  constructor(n1, n2, weight = 0) {
    this.id = n1.id + "->" + n2.id;
    this.n1 = n1;
    this.n2 = n2;
    this.ani_line = null;
    this.weight = weight;
  }
  
}

class Graph {
  constructor(ani, graph_type = "undirect", weight_type = T_POSITIVE_NUMBER, layout = "grid", node_radius = 20, gap = 100, num_cols = 4, center_x = 400) {
    this.ani = ani;
    this.ani.g = this;
    this.graph_type = graph_type;
    this.weight_type = weight_type;
    this.node_map = {};
    this.edge_map = {};
    this.gap = gap;
    this.num_cols = num_cols;
    this.node_radius = node_radius;
    this.layout = layout;
    this.node_color = "#DDDDDD";
    this.edge_color = "black";
    this.edge_width = 2;
    this.center_x = center_x; // this is for tree layout  

  }

  get_node_position() {
    let i, j, row, col, x, y;
    let n, level, next_level;
    let gap;
    let ok = false;
    
    if (this.layout == "grid") {
      i = 0;
      while (1) {
        row = parseInt(i / this.num_cols);
        col = i % this.num_cols;
        y = row * this.gap;
        x = col * this.gap;
        ok = true;
        for (let key in this.node_map) {
          n = this.node_map[key].ani_circle;

          if (cal_distance(x,y,n.x,n.y) <= this.node_radius * this.node_radius) {
            ok = false; 
            break;
          }
        }
        if (ok == true) break;
        i++;
      }
    } else if (this.layout == "tree") {
      i = 1;
      
      x = this.center_x;
      y = 0;
      gap = 0;
      level = 0;
      next_level = 2;

      while (1) {
      
        if (i == next_level) {
          
          level += 1;
          next_level *= 2;
          y += 75;
          gap = this.gap;
          x = this.center_x;
          
          for (j = 0; j < level; j++) {
            x -= 1/2 * gap;
            gap /= 2;
          }
          gap *= 2;
        }
        
        ok = true;
        for (let key in this.node_map) {
          n = this.node_map[key].ani_circle;
          if (cal_distance(x,y,n.x,n.y) <= this.node_radius * this.node_radius) {
            ok = false; 
            break;
          }
        }
        if (ok == true) break;
        x += gap;
        i++;

      }

    } else {
      console.log("get_node_position(): wrong layout must be tree or grid");
    }
    
    return [x, y];
  }

  remove_node(id) {
    let n;
    let i;

    if (id in this.node_map) {

      for (let key in this.node_map) {
        n = this.node_map[key];
        for (i = 0; i < n.adj.length; i++) {
          if (n.adj[i].n1 == this.node_map[id] || n.adj[i].n2 == this.node_map[id]) 
            this.remove_edge(n.adj[i].n1, n.adj[i].n2);
        }
      }
      this.ani.remove_object(this.node_map[id].ani_circle.ref);
      delete this.node_map[id];
    } 
  }
  remove_edge(n1, n2) {
    let id1 = n1.id + "->" + n2.id;
    let id2 = n2.id + "->" + n1.id;
    let e, i;
    if (id1 in this.edge_map) {
      e = this.edge_map[id1];
      if (e.ani_line != null) this.ani.disconnect_object(e.ani_line);
      delete this.edge_map[id1];
      for (i = 0; i < e.n1.adj.length; i++) {
        if (e.n1.adj[i]== e) e.n1.adj.splice(i, 1);
      }
    }
    if (this.graph_type == "undirect" && id2 in this.edge_map) {
      e = this.edge_map[id2];

      // the undirect grph will share the same ani_line actually. The disconnect_object will do nothing
      // if ani_line has been removed
      // if (e.ani_line != null) this.ani.disconnect_object(e.ani_line);
      delete this.edge_map[id2];

      for (i = 0; i < e.n1.adj.length; i++) {
        if (e.n1.adj[i] = e) e.n1.adj.splice(i, 1);
      }
    }
  }

  get_nodes(ids) {
    for (let i = 0; i < ids.length; i++) {
      this.get_node(ids[i]);
    }
  }
  get_node (id) {
    if (id in this.node_map) return this.node_map[id];
    let n = new Node(id);
    let c, p;
    let x_y = this.get_node_position();


    c = new Circle(x_y[0], x_y[1], this.node_radius, id, id);
    c.ctx_prop.fillStyle = this.node_color;
    p = this.ani.get_point(x_y[0], x_y[1], true);
    c.attach_point(p);
    c.enable_mouse_move();
    this.ani.add_object(c);
    this.node_map[id] = n;
    n.ani_circle = c;

    return n;
  }
  is_edge(n1, n2) {
    let id = n1.id + "->" + n2.id;
    if (id in this.edge_map) return true;
    return false;
  }

  is_node(id) {
    if (id in this.node_map) return true;
    return false;
  }

  // edges is 2-D list
  get_edges_by_name(edges) {
    for (let i = 0; i < edges.length; i++) {
      this.get_edge_by_name(edges[i][0], edges[i][1], edges[i][2]);
    }
  }

  get_edge_by_name(id1, id2, weight = 0) {
    let n1 = null,
        n2 = null;
    if (this.is_node(id1)) n1 = this.get_node(id1);
    if (this.is_node(id2)) n2 = this.get_node(id2);
    if (n1 == null || n2 == null) {
      return null
    } else return this.get_edge(n1, n2, weight);
  }

  get_edge(n1, n2, weight = 0) {
    let id = n1.id + "->" + n2.id;
    let id2 = n2.id + "->" + n1.id;
    let e, l;

    if (n1.id == n2.id) return;


    // check weight_type
    switch(this.weight_type) {
      case T_CONSTANT:
        weight = "";
        break;
      case T_STRING:
        break;
      case T_NUMBER: 
        weight = parseFloat(weight);
      case T_POSITIVE_NUMBER:
        weight = parseFloat(weight);
        if (isNaN(weight) || weight <= 0) return;
        break;
      case T_NON_NEGATIVE_NUMBER:
        weight = parseFloat(weight);
        if (isNaN(weight) || weight < 0) return;
        break;
      case T_NEGATIVE_NUMBER: 
        weight = parseFloat(weight);
        if (isNaN(weight) || weight >= 0) return;
        break;

      default:
        console.log("wrong weight_type");
    }


    if (id in this.edge_map) {
      e = this.edge_map[id];
  
      e.weight = weight;
      if (e.ani_line != null) {
        e.ani_line.text = weight;
        e.ani_line.ctx_prop.lineWidth = this.edge_width;
        e.ani_line.ctx_prop.strokeStyle = this.edge_color;
      }
      if (this.graph_type == "undirect") {
        this.edge_map[id2].weight = weight;
      }
      
      return e;
    }

    e = new Edge(n1, n2, weight);
    l = new quadraticCurve(n1.ani_circle.points[0], n2.ani_circle.points[0], 0, 0.5);
    l.line_type = this.graph_type;
    l.text_t = 0.65;
    l.angle_degree = 25;
    l.angle_length = 13;
    l.text = weight;
    l.ctx_prop.strokeStyle = this.edge_color;
    l.ctx_prop.lineWidth = this.edge_width;
    e.ani_line = l;
    l.enable_mouse_move();
    n1.adj.push(e);

    this.ani.connect_object(l);
    this.edge_map[id] = e;

    if (this.graph_type == "undirect") {
      e = new Edge(n2, n1, weight);
      e.ani_line = l;
      this.edge_map[id2] = e;
      n2.adj.push(e);

    /* if it's direct graph we have two edges, we set change line to curve with h_scale 0.1 */
    } else if (this.is_edge(n2, n1) == true) {
      
      l.h_scale = 0.1;
      e = this.get_edge(n2, n1);
      e.ani_line.h_scale = 0.1;
      l.update_cp();
      e.ani_line.update_cp();
      
    }

    return e;
  }

  draw() {
    this.ani.draw();
  }

}
