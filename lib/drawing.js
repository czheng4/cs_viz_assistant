/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/24/2020
  last modified 11/27/2020
*/


const ANIMATION_TIME = 100; 
var D_ANIMATION_TIME = 100; // dynamic animation time. It controls the animation speed. The slower the animation, the bigger it is.

const NEW_LINE = "<br><span style=\"visibility: hidden\">Elaboration: </span>";
const PADDING = 10;
const FONT = "13px Arial";
const BACKGROUND_COLOR = "white"
const canvas = document.getElementById("draw");
const ctx = document.getElementById("draw").getContext("2d");
const DEFAULT_RECT_CTX = {fillStyle : "#DDDDDD", strokeStyle : "#696969"};
const DEFAULT_CIRCLE_CTX = {fillStyle : "#DDDDDD", strokeStyle : "#696969"};
const DEFAULT_LINE_CTX = {lineWidth: 2, strokeStyle: "black"};
const ROUNDING_THRESHOLD = 0.0001;
const RIGHT_ARROW = "&rarr;";
const LEFT_ARROW = "&larr;";
var TRANSLATE_X = 0;
var TRANSLATE_Y = 0;
var OFFSET_X = 0;
var OFFSET_Y = 0;
var REVERSE_ANIMATION = false;
var PRESS_W_KEY = false; // adding edge
var PRESS_D_KEY = false; // deleting edge
var PRESS_C_KEY = false; // change the color of node
var PRESS_T_KEY = false; // change the direction of line text.
var ENABLE_IDS = [];
var DISABLE_IDS = [];
var ENABLE_STEP_IDS = [];

/* MAIN_A is the object of any algorithm animation
   MAIN_G is the object of Graph
*/
var MAIN_A, MAIN_G;

/* graph weight type */
const T_NUMBER = 0b1;
const T_POSITIVE_NUMBER = 0b10;
const T_NON_NEGATIVE_NUMBER = 0b100;
const T_NEGATIVE_NUMBER = 0b1000;
const T_STRING = 0b10000;
const T_CONSTANT = 0b100000;


/* graph type */
const T_DIRECTED = 0b1;
const T_UNDIRECTED = 0b10;
const T_DIRECTED_UNDIRECTED = 0b11;

/* graph default sepc */
var MAIN_G_SPEC = { 
  edge_width: 2,
  node_color: "#DDDDDD",
  edge_color: "black",
  node_radius: 20,
  weight_type: T_POSITIVE_NUMBER,
  layout: "grid", 
  gap_x: 100,
  gap_y: 100,
  num_cols :4, 
  center_x : 400,
  enable_node_color_change: true, // allow users to change the color of node and edge.
  enable_edge_color_change: true,
  enable_node_move: true,
  enable_edge_create: true,
  graph_type: T_DIRECTED_UNDIRECTED,
  create_reverse_edge: true,  /* when it comes to undirected graph. 
                                if create_reverse_edge is true, we create new edge otherwise we don't. 
                              */
};



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
  if ("fillStyle" in prop && typeof(prop.fillStyle) != "object") rv.fillStyle = prop.fillStyle;
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

/* Point contains x,y coordinate and obj this point attack to */
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
    // if (p.obj != this.obj) return false;

    return true;
  }

}

/* a tester to play entire animation 
   to Do: support go back and go forward.
*/
class animationTester {
  constructor(speed = 50) {
    this.speed = speed;
    this.function_calls = []

    if (this.speed <= 100 && this.speed >= 0) D_ANIMATION_TIME = 100 - this.speed;
  }

  add_func(name, args = []) {
    let d = {};
    d.name = name;
    d.args = args;
    this.function_calls.push(d);
  }

  /* run test */
  run_test() {

    let id;
    let ani;
    let func_ptr = 0;
    let self = this;
    
    if (this.function_calls.length == 0) return;

    id = setInterval(function(){
      let func;
      ani = MAIN_A.ani;
      if (ani.during_animation) return;
      func = self.function_calls[func_ptr];

      if (func.name == "go_back") {
        $("#go_back").click();
      } else if (func.name == "go_forward") {
        $("#go_forward").click();
      } else {
        MAIN_A[func.name](func.args);
      }
      func_ptr++;
      if (self.function_calls.length == func_ptr) {
        clearInterval(id);
      }

    }, 100)
  }

  
}



/* It handles all the drawing 
   The animation have two types -- continuous and non-continuous animation.
   continuous animation will allow users to undo what has been done by going back. With that being said, programmer have to
   store the state that is composed of Animation, Algorithm, and Graph(used for graph algorithm). depp_copy() functions
   are written for Animation and Graph to copy the current state. 
   programmer have to handle the state of algorithm. (Dlist is one of the examples).
      -- set_function_call(function_name, a list of arguments). The list of arguments must be static. 
         If you have a dynamic object needed to passe to a function, consider making it part of class.
      -- set_state(algorithm) -- algorithm is a new object of algorithm animation. It should be a deep copy of current state
         before running algorithm.
   

   non-continuous animation is much easier. clear_animation() will be called before gathering the info next animation. 
   (See Dijkstra or mergeSort).

*/
class Animation {

  constructor(elaboration_text = null) {
    this.connection_map = new Map();  // store quadraticCurve object
    this.obj_map = new Map();     // store Rect, Circle objects

    this.step_by_step = false;    // set to true when stepping through animation
    this.suspend = false;         // set to true when encountering a stopping point in the animation (prop: {step: true})
    this.has_suspend = false;     // set to true when encountering a stopping point in the animation
    this.start = 0;               // the timer for where the animation is
    
    this.points = [];             // store all points
    this.sequence_ani = [];       // sequential animation property. It will be convered to parallel animation property.
    this.parallel_ani = [];       // parallel animation property
    this.all_anis = [];           // all animations property
    this.elaboration = $("#elaboration_text"); // for writing to elaboration.
    this.elaboration.text("");

    this.during_animation = false;// then animation is running, during_animation will be set to true.
    this.g = null;                // Graph object
    
    
    this.dragging_obj = null;     // the dragging object
    this.edge_line = null;        // the dynamic line when we click circle and move mouse.
    this.press_key = null;        // 'd/D'(delete edge), 'w/W' (add edge), or 'c/C' (change color of circle)
    this.state = null;            // the current state -- Animation, Algorithm, and Graph(used for graph algorithn)
    this.running_ani_index = 0;   // the current animation index. Used of continuous animation.
    this.call = {};               // the function call for next animation of current state
    
    this.function_calls = [];     // function_calls are shared throughtout all instance of Animation
    this.add_func = true;         // when we go forward to next animation, add_func will be false. When we get new animation by
                                  // typing new input, add_func will be true.

    this.callback = null;
   
  }

  /* The state of Animation Object is 
     the points, connection_map, obj_map, points, and all_anis .
  */
  deep_copy() {
    let ani = new Animation();
    let point;
 
    for (let [key, value] of this.connection_map) {
      let v = [];
      for (let i = 0; i < value.length; i++) {
        v.push(value[i]);
      }
      ani.connection_map.set(key, v);
    }

    for (let [key, value] of this.obj_map) {
      ani.obj_map.set(key, value);
    }

    for (let i = 0; i < this.points.length; i++) ani.points.push(this.points[i]);
    for (let i = 0; i < this.all_anis.length; i++) ani.all_anis.push(this.all_anis[i]);

    
    ani.running_ani_index = this.running_ani_index;
    ani.start = this.start;
    ani.step_by_step = this.step_by_step;
    ani.function_calls = this.function_calls;

    return ani;
  }

  /* get a point based on (x, y). When force is ture, it always create a new Point. 
     Ideally, points should have all points that are attached to all Rects and Circles.
  */
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

  /* return a list of quadraticCurve that goes from ref1 to ref2 */
  get_connection(ref1, ref2) {
    let key = ref1 + "->" + ref2;
    if (this.connection_map.has(key)) return this.connection_map.get(key);
    else return [];
  }

  /* it's not used so far. but who knows one day */
  get_connection_by_points(p1, p2) {

    for (let l_or_c of this.connection_map.values()) {
      for (let i = 0; i < l_or_c.length; i++) {
        if (l_or_c[i].p1.is_euqal(p1) && l_or_c[i].p2.is_euqal(p2)) return l_or_c[i];
      }
    }
  }

  /* return a object (Rect, Circle) */
  get_object(ref) {
    if (this.obj_map.has(ref)) return this.obj_map.get(ref);
    else return null;
  }

  /* add an object */
  add_object(obj) {
    let i,j;

    /* it add points attahed to this object */
    // for (i = 0; i < obj.points.length; i++) {
    //   for (j = 0; j < this.points.length; j++) {
    //     if (this.points[j] == obj.points[i]) break;
    //   }
    //   if (j == this.points.length) this.points.push(obj.points[i]);
    // }

    if (!this.obj_map.has(obj.ref)) this.obj_map.set(obj.ref, obj);
  }

  /* remove an object -- remove its connection and points too*/
  remove_object(ref) {
    let obj, i, j;
    let l_or_c;
    let num_delete;
    let done = false;

    if (this.obj_map.has(ref)) obj = this.obj_map.get(ref);
    else return;
    
    /* The implementation below is not efficient. Revisit it if 
       you have a better way to do it.
     */

    // remove the connections
    while (!done) {
      done = true;

      for (l_or_c of this.connection_map.values()) {
        for (let i = 0; i < l_or_c.length; i++) {
          if (l_or_c[i].p1.obj == obj || l_or_c[i].p2.obj == obj) {
            
            num_delete = this.disconnect_object(l_or_c[i]);
            if (num_delete != 0) {
              done = false;
              break;
            }
            
          }
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

    this.obj_map.delete(ref);

  }


  /* connect two objects */
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

      // add to adj list
      from_obj.to.push(to_obj);
      to_obj.from.push(from_obj);

      // add to connection map and object map
      this.connection_map.get(key).push(line_or_curve);

      if (!this.obj_map.has(from_ref)) this.obj_map.set(from_ref, from_obj);
      if (!this.obj_map.has(to_ref)) this.obj_map.set(to_ref, to_obj);
    }
  }

  /* disconnect two objects */
  disconnect_object(line_or_curve) {
    let i, from_ref, to_ref, key, arr;
    let from_obj, to_obj;

    from_obj = line_or_curve.p1.obj;
    to_obj = line_or_curve.p2.obj;

    if (line_or_curve.p1.obj == null || line_or_curve.p2.obj == null) {
      console.log(line_or_curve);
      console.log("line_or_curve: sp/ep must be attached to a object");
      return 0;
    } 

    from_ref = from_obj.ref;
    to_ref = to_obj.ref;
    key = from_ref + "->" + to_ref;

    /* check if it exists */
    if (!this.connection_map.has(key)) {
      console.log("{} line_or_curve is not connected".format(key));
      return 0;
    }

    /* remove object 2 from object 1's "to" list */
    for (i = 0; i < line_or_curve.p1.obj.to.length; i++) {
      if (line_or_curve.p1.obj.to[i] == line_or_curve.p2.obj) {
        line_or_curve.p1.obj.to.splice(i,1);
        break;
      }
    }

    /* remove object 1 from object 2's "from" list */
    for (i = 0; i < line_or_curve.p2.obj.from.length; i++) {
      if (line_or_curve.p2.obj.from[i] == line_or_curve.p1.obj) {
        line_or_curve.p2.obj.from.splice(i,1);
        break;
      }
    }

    /* remove it from connection map */
    arr = this.connection_map.get(key);
    for (i = 0; i < arr.length; i++) {
      if (arr[i] == line_or_curve) {
        arr.splice(i,1);
        break;
      }
    }

    /* if the size of array is 0 after remvoing, remove this entry as well 
       Note: two objects may have more than one connection.
    */
    if (arr.length == 0) {
      this.connection_map.delete(key);
    }
  

    return arr.length;
  }

  /* set state. s should a dintionary contains the state of Animation, Algorithm, and potentially Graph */
  set_state(s) {
    this.state = s;
  }


  /* set the function_calls that gets next animation property */
  set_function_call(name, args = []) {
    this.call = {};
    this.call.name = name;
    this.call.args = args;
   
  }

  /* restore the state to previous animation when going back */
  restore_state() {

    if (this.all_anis.length == 0) return;
    if (this.running_ani_index >= this.all_anis.length) return;

    /* the last entry of animation properties is bookkeeping 
       bookkeeping stores the state information.
    */

    let bookkeeping = this.all_anis[this.running_ani_index];    
    bookkeeping = bookkeeping[bookkeeping.length - 1];
    
    if (bookkeeping.state == null) return;

    MAIN_A = bookkeeping.state;
    MAIN_A.ani.step_by_step = this.step_by_step;
    // MAIN_A.ani.reverse = this.reverse;
    if (MAIN_A.g != null) {
      MAIN_G = MAIN_A.g;
    }

    return;

    
  }

  // add a sequential animation
  add_sequence_ani(p) {
    this.sequence_ani.push(p);
  }


  // add a parallel animation
  add_parallel_ani(p) {
    this.parallel_ani.push(p);
  }

  // process both parallel and sequential animation
  process_ani() {
    let bk = this.parallel_ani;
    
    // check if we have process it before by looking at the bookkeeping.
    if (this.parallel_ani.length != 0) {
      bk = this.parallel_ani[this.parallel_ani.length - 1];
      if ("state" in bk) return;
    }

    REVERSE_ANIMATION = false;
    this.process_parallel_ani();
    this.process_sequence_ani();
  }

  /* process parallel animation property */
  process_parallel_ani() {
    let i, p;

    for (i = 0; i < this.parallel_ani.length; i++) {
      p = this.parallel_ani[i];
      // console.log(p, this.parallel_ani.length);

      p.prop.start += this.start;
      p.prop.end += this.start;

      if (!("step" in p.prop)) p.prop.step = false;
    }
  }

  /* 1. convert sequential animation to parallel animation 
     2. compute bookkeeping.
  */
  process_sequence_ani() {
    let i;
    let start = this.start;
    let seq;
    let time;
    let max = -1;
    let bookkeeping = {};

    /* bookkeeping is the last element of parallel_ani array
       it stores the number of parallel animation/ sequence animation converted to parallel animation.
       The index of this animation in all_anis, ending_time and starring_time and the state of animation. 
       The state is the state of algorithm/animation/graph before we run this animation. 
    */
    bookkeeping.num_parallel_ani = this.parallel_ani.length;
    bookkeeping.ani_index = this.all_anis.length;
    bookkeeping.state = this.state;
    bookkeeping.call = this.call;

    /* if the event is not "going forward", we add func to function_calls */
    if (this.add_func && this.call != null && "name" in this.call) {

      // clear up all function from this point forward
      if (this.function_calls.length != 0 || this.running_ani_index + 1 != this.function_calls.length) {
        this.function_calls.splice(this.running_ani_index + 1, this.function_calls.length - 1 - this.running_ani_index);
      }
      this.function_calls.push(this.call);
      this.call.index = this.function_calls.length - 1;
    }

    /* converting */
    for (i = 0; i < this.sequence_ani.length; i++) {
      seq = this.sequence_ani[i];
      if (!("prop" in seq)) seq.prop = {};
      seq.prop.start = start;

      if (!("step" in seq.prop)) seq.prop.step = false;

      if ("pause" in seq) {
        time = seq.pause;
      } else if ("time" in seq.prop) {
        time = seq.prop.time;
      } else {
        time = ANIMATION_TIME;
      }

     
      seq.prop.time = time;
      seq.prop.end = start + time;
      // console.log(seq.prop.time, seq);
      if (max < seq.prop.end) max = seq.prop.end;
      if ('concurrence' in seq && seq.concurrence == true) {

      } else {
        start = max;
      }
      this.parallel_ani.push(seq);
    }

    /* find max time */
    for (i = 0; i < bookkeeping.num_parallel_ani; i++) {
      if (this.parallel_ani[i].prop.end > max) max = this.parallel_ani[i].prop.end;
    }
    bookkeeping.num_sequence_ani = this.sequence_ani.length;
    bookkeeping.ending_time = max;
    bookkeeping.starting_time = this.start;



    this.parallel_ani.push(bookkeeping);

    if (this.running_ani_index != 0 && this.all_anis.length - 1 != this.running_ani_index) {
      throw new Error("wrong index");
    }

    this.all_anis.push(this.parallel_ani);
    this.running_ani_index = this.all_anis.length - 1;
    this.sequence_ani = [];
  }


  /* store the previous elaboration text
     It's used to show the previous elaboration text when going back.
  */
  link_text() {
    let i;
    let start, ani_p;
    let dict = {};
    let keys, pre_text;

    // sort based on starting time.
    keys = [];
    for (i = 0; i < this.parallel_ani.length; i++) {
       ani_p = this.parallel_ani[i];
      
       if ("text" in ani_p) {
        keys.push(ani_p.prop.start);
        dict[ani_p.prop.start] = ani_p;
      }
    }

    keys.sort(function(a,b) {return a - b; });

    /* get prev text */
    if (keys.length != 0) pre_text = dict[keys[0]].text;

    for (i = 0; i < keys.length; i++) {
      dict[keys[i]].pre_text = pre_text;
      pre_text = dict[keys[i]].text;
    }


  } 

  /* resume the animation */
  resume_animation() {
    let func;
    let bookkeeping;

    this.suspend = false;

    /* we go forward to the next animation. We restore to its state and call the function */
    if (!REVERSE_ANIMATION && this.call != null && "name" in this.call) {
      func = this.call;

      console.log(func);
      MAIN_A.ani.add_func = false;
      MAIN_A[func.name].apply(MAIN_A, func.args);
      MAIN_A.ani.add_func = true;
    
    /* otherwise the animation is running step-by-step */
    } else if (this.running_ani_index < this.all_anis.length) {
      this.parallel_ani = this.all_anis[this.running_ani_index];
      this.run_animation(this.callback);
    }


  }

  reverse_animation() {
    REVERSE_ANIMATION = true;
  }

  /* clear the animation */
  clear_animation() {
    this.start = 0;
    this.sequence_ani = [];
    this.parallel_ani = [];
    this.all_anis = [];
    this.call = {};
    this.function_calls = [];
    this.state = null;
    this.suspend = false;
    this.running_ani_index = 0;
  }

  /* run the animation 
     to do, get rid of skip.
     add callback function to bookkeeping????
  */
  run_animation(callback = null) {


    let self = this;
    let ani_p;
    let i;
    let old_start = this.start;
    let max = 0xffffffff;
    let min = -1;
    let next_draw_time, num_draw;

    let bookkeeping;
    let stop_between = false;


    this.process_ani();
    this.link_text();

    this.suspend = false;
    this.call = null;

    this.draw(true);
    this.during_animation = true;
    this.callback = callback;

    let id = setInterval(function() {
      
      
      // reverse to the beginning of animation
      if(REVERSE_ANIMATION && self.start == - 1) {
        console.log("get to the beginning of animation")
        self.during_animation = false;
        clearInterval(id);
        return;
      }

      // suspend the animation
      if ( (stop_between || self.step_by_step) && self.suspend) {
        
        $("#speed").prop("disabled", false);
        $("#step_by_step").prop("disabled", false);
        $("#import_graph").prop("disabled", false);
        $("#import_input").prop("disabled",false);
        for (i = 0; i < ENABLE_STEP_IDS.length; i++) $(ENABLE_STEP_IDS[i]).prop("disabled",false);
        self.draw(true);
        // self.during_animation = false;
        clearInterval(id);
        return; 
      }

      /* this solve race conditon. When we get to at the end of animation. 
        It's potentianlly this function gets called again. So I check slef.start 
        again here.
      */
      if (self.start > max || self.start < min) {
        console.log("race conditon occurs", self.start, min, max, REVERSE_ANIMATION);
        clearInterval(id);
      }

      /* stop before moving to next or previous animation */
      stop_between = false;

      // disable inputs during animation
      $(":button").prop("disabled", true);
      $(":input").prop("disabled", true);
     
      
      /* find starting time and ending time of cureent animation */
      bookkeeping = self.parallel_ani[self.parallel_ani.length - 1];
      max = bookkeeping.ending_time;
      min = bookkeeping.starting_time;
      
      /* go foward or trigger a new action (user inputs) */     
      if (REVERSE_ANIMATION == false) {

        next_draw_time = 0xffffffff;
        /* trigger after-action. The action will be called when the target object 
           finish its execution of property 
        */
        for (i = 0; i < self.parallel_ani.length - 1; i++) {
          ani_p = self.parallel_ani[i];

          if (ani_p.prop.end == self.start && !self.has_suspend) {
            // call action
            if ("action" in ani_p) {
              // set ani to cureent one
              if ("ani" in ani_p.action.params) ani_p.action.params.ani = self;
              // if ("g" in ani_p.action.params) ani_p.action.params.g = MAIN_G;
              console.log(ani_p.action);
              ani_p.action.func(ani_p.action.params);
            }
          } 
        }
        

        // see if we suspend the animation
        if (self.step_by_step) {
          for (i = 0; i < self.parallel_ani.length - 1; i++) {
            ani_p = self.parallel_ani[i];
            if (ani_p.prop.end == self.start && ani_p.prop.step && !self.has_suspend) { 
              /* enable go foward/back button */
              $("#go_forward").prop("disabled", false);
              $("#go_back").prop("disabled", false);
              self.suspend = true;
              self.has_suspend = true;
              console.log("stop forward ", self.start);
              return;
              
            }
          }
        }

        // finally we execute the animation by setting objs' the property.
        for (i = 0; i < self.parallel_ani.length - 1; i++) {
          ani_p = self.parallel_ani[i];
          if ("prop" in ani_p) ani_p.prop.ani_time = self.start;

          // find the closest next draw time
          if (ani_p.prop.end > self.start && ani_p.prop.end < next_draw_time) {
            next_draw_time = ani_p.prop.end;
          }
          
          if (ani_p.prop.start > self.start && ani_p.prop.start < next_draw_time) {
            next_draw_time = ani_p.prop.start;
          }

          if (ani_p.prop.start == self.start) {

            if ("target" in ani_p) {
              /* set animation object to current one */
              if ("ani" in ani_p.prop) ani_p.prop.ani = self;
              ani_p.target.set_animation_property(ani_p.prop);
            }

            // show text
            if ("text" in ani_p) {
              self.elaboration.text("");
              self.elaboration.append(ani_p.text);
            }

          }
        }

      /* reverse animation */
      } else {

        // check any after-reverse-action
        next_draw_time = -1;
        for (i = 0; i < self.parallel_ani.length - 1; i++) {
          ani_p = self.parallel_ani[i];
          
          if (ani_p.prop.start == self.start && !self.has_suspend)  {
         
            if ("rev_action" in ani_p) {
              /* set ani to the current one */
              if ("ani" in ani_p.rev_action.params) ani_p.rev_action.params.ani = self;
              // if ("g" in ani_p.action.params) ani_p.rev_action.params.g = MAIN_G;
              ani_p.rev_action.func(ani_p.rev_action.params);
            }
           
          } 
        }

        // suspend animation
        if (self.step_by_step) {
          for (i = 0; i < self.parallel_ani.length - 1; i++) {
            ani_p = self.parallel_ani[i];
            if (ani_p.prop.end == self.start) {
              if (self.step_by_step == true && ani_p.prop.step && !self.has_suspend) {
                self.suspend = true;
                self.has_suspend = true;

                $("#go_forward").prop("disabled", false);
                $("#go_back").prop("disabled", false);
                console.log("stop ", self.start);
                return;
              }
            }
          }
        }

        // set objs' property
        for (i = 0; i < self.parallel_ani.length - 1; i++) {
          ani_p = self.parallel_ani[i];
          
          if ("prop" in ani_p) ani_p.prop.ani_time = self.start;

          // find the closest next draw time that would either stop the animation or set new animation property.
          if (ani_p.prop.end < self.start && ani_p.prop.end > next_draw_time) {
            next_draw_time = ani_p.prop.end;
          }

          if (ani_p.prop.start < self.start && ani_p.prop.start > next_draw_time) {
            next_draw_time = ani_p.prop.start;
          }


          if (ani_p.prop.end == self.start) {
            if ("target" in ani_p) {
              
              // set to current one
              if ("ani" in ani_p.prop) ani_p.prop.ani = self;
              ani_p.target.set_animation_property(ani_p.prop);
            }

            // show previous text
            if ("pre_text" in ani_p) {
              self.elaboration.text("");
              self.elaboration.append(ani_p.pre_text);
            }
          }



        }

      }
        
      console.log(self.start, min, max);

      /* go to next episode of animation */
      if (!REVERSE_ANIMATION && parseInt(max) == self.start) {
        self.draw();
    
        // I increment it by one here. So the next animation won't interact with previous when stepping back.
        self.start++; 

        console.log(self.obj_map);
        console.log(self.connection_map);
        console.log(self.points);


        // we can still step forward
        console.log(self.running_ani_index, self.function_calls.length);


        $(":button").prop("disabled", false);
        $(":input").prop("disabled", false);
        $("input[type=radio]").prop("disabled", true);
        for (i = 0; i < ENABLE_IDS.length; i++) $(ENABLE_IDS[i]).prop("disabled", false);
        for (i = 0; i < DISABLE_IDS.length; i++) $(DISABLE_IDS[i]).prop("disabled", true);
    
        if (self.running_ani_index < self.function_calls.length - 1) {

          console.log("move to next part of animation");
          self.call = self.function_calls[self.running_ani_index + 1];
          self.suspend = true;
          stop_between = true;
          self.parallel_ani = [];
  
        } else {
          console.log("done");
         
          self.suspend = false;
          self.during_animation = false;
          self.call = null;
          
          $("#go_forward").prop("disabled", true);
          if (self.callback != null) self.callback();
          self.parallel_ani = [];
          clearInterval(id);
        }

        return;
      }
      
      /* go to previous animation */
      if (REVERSE_ANIMATION && min == self.start) {
        self.start--;
        self.draw();

        console.log(self.obj_map);
        console.log(self.connection_map);
        console.log(self.points);
        console.log(self.running_ani_index, self.function_calls.length - 1);
        $(":button").prop("disabled", false);
        $(":input").prop("disabled", false);
        $("input[type=radio]").prop("disabled", true);

        for (i = 0; i < ENABLE_IDS.length; i++) $(ENABLE_IDS[i]).prop("disabled", false);
        for (i = 0; i < DISABLE_IDS.length; i++) $(DISABLE_IDS[i]).prop("disabled", true);


        if (self.running_ani_index != 0) {
          self.suspend = true;
          stop_between = true;
  
        } else {
          $("#go_back").prop("disabled", true);
        }

        // restore the state to previous state and set the function call.
        self.restore_state();
        MAIN_A.ani.call = self.function_calls[self.running_ani_index];
        return;
      }
      if (!REVERSE_ANIMATION && next_draw_time == 0xffffffff) next_draw_time = max;
      if (REVERSE_ANIMATION && next_draw_time == -1) next_draw_time = min;
  

      /* The speed of animation is controled following 
         The number of draws is determined by 
         y = t * t / 3 where t is (D_ANIMATION_TIME / ANIMATION_TIME) - 1.
         As D_ANIMATION_TIME increases, y decrease. y(the number of draws call decrease) decrases.
      */
      
      let t = D_ANIMATION_TIME / ANIMATION_TIME;

      if (t == 0) t = 1;
      else if (t <= 0.1) t = (t - 1) * (t - 1) / 2;
      else t = (t - 1) * (t - 1)/ 3;

      if (!REVERSE_ANIMATION) {

        
        num_draw = parseInt((next_draw_time - self.start) * t) ;

        if (num_draw > next_draw_time - self.start - 1) num_draw = next_draw_time - self.start - 1;
        if (num_draw == 0) num_draw = 1;
        
        for (i = 0; i < num_draw; i++) {
          self.start++;
          self.draw();
        } 
      } else {

        num_draw = parseInt((self.start - next_draw_time) * t) ;

        if (num_draw > self.start - next_draw_time - 1) num_draw = self.start - next_draw_time - 1;
        if (num_draw == 0) num_draw = 1;
        
        for (i = 0; i < num_draw; i++) {
          self.start--;
          self.draw();
        } 
      }

      self.has_suspend = false;
      
    },1)
  }
  
  /* mouse down event -- set dragging_obj */
  mouse_down(x, y) {
    let obj;
    let l_or_c;
    let i;
    let keys = [];

    for (let key of this.obj_map.keys()) keys.push(key);
    

    /* check if we click a circle */
    for (i = keys.length - 1; i >= 0; i--) {
      obj = this.obj_map.get(keys[i]);

      if ("mouse_down" in obj && obj.mouse_down(x - OFFSET_X, y - OFFSET_Y) ) {

        // change the color -- Press "C" and click object at the same time.
        if (this.g != null && this.g.enable_node_color_change && PRESS_C_KEY) {
          obj.ctx_prop.fillStyle = this.g.node_color;
          obj.mouse_up();
          this.draw();
        // set dragging_obj
        } else this.dragging_obj = obj;
        return;
      }
    }
    
    // click on the text of a line.
    for (l_or_c of this.connection_map.values()) {
      for (i = 0; i < l_or_c.length; i++) {
        if ("mouse_down" in obj && l_or_c[i].mouse_down(x - OFFSET_X, y - OFFSET_Y)) {
          this.dragging_obj = l_or_c[i];
          this.draw();
          return;
        }
      }
    }
  }

  /* mouse up event -- 
      1. create edge 
      2. release a dragging_obj
  */
  mouse_up(x, y) {
    let w;
    let e;
    let g = this.g;
    x = x - OFFSET_X;
    y = y - OFFSET_Y;


    if (this.dragging_obj != null) {
      if (this.edge_line != null) {
        
        // if the mouse is on another object when releasing. Create or delete an edge.
        for (let obj of this.obj_map.values()) {
          if (obj != this.dragging_obj && "mouse_down" in obj && obj.mouse_down(x,y)) {
            
            // create a new edge
            if (this.press_key == 'W') { 
              if (g.weight_type != T_CONSTANT) w = prompt("Please enter the weight of edge");

              if (w != null) {
                g.get_edge(g.get_node(this.dragging_obj.ref), g.get_node(obj.ref), w);
                if (w != "") PRESS_W_KEY = false;
              } 
            
            // delete the edge
            } else if (this.press_key == 'D') { 
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

  /* mouse move event  -- move the line or dragging object
  */
  mouse_move(x, y) {

    if (this.dragging_obj != null) {

      // move the line
      if ( (PRESS_W_KEY || PRESS_D_KEY) && 
           !this.during_animation && 
           (this.g == null || this.g.enable_edge_create)) {

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

      // move the object
      } else {
        if (this.edge_line == null){
          if (this.g == null || this.g.enable_node_move) {
            this.dragging_obj.mouse_move(x - OFFSET_X, y - OFFSET_Y);
          }
        } 
        this.draw(true); 
      }
      return;
    }
  }

  /* draw on the canvas */
  draw(skip_animation = false) {
    let l_or_c, obj;
    let i;
    
    ctx.clearRect(-1000,-1000,4000,4000);

    for (l_or_c of this.connection_map.values()) {
      for (i = 0; i < l_or_c.length; i++) l_or_c[i].draw(skip_animation);
    }
    for (obj of this.obj_map.values()) {
      obj.draw(skip_animation);
    }
    reset_canvas_offset();
  }
  
}

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

    // most of time we didn't use ref for quadraticCurve. In case we want to add quadraticCurve 
    // to obj_map of animations instead of connection_map.
    this.ref = Math.random() + p1.to_str(); 

    this.visible = true;
    // this.dx = 0;
    // this.dy = 0;
    // this.dh = 0;
    // this.dw = 0;
    
  }

  update_cp() {
     this.cp = this.control_point(this.p1, this.p2, this.h_scale, this.w_scale);
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
      if (PRESS_T_KEY) {
        this.text_direction = (this.text_direction == "left")? "right" : "left";
        return true;
      }
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



  set_animation_property(p) {
    
    let i;


    for (i = 0; i < this.animations.length; i++) {
      if(this.animations[i] == p) {
        // console.log("same1", i, this.animations.length);
        break;
      }
    }

    if (i == this.animations.length) this.animations.push(p);
   
    if (REVERSE_ANIMATION) {
      if ("p" in p) {
        // p.p2 is old one
        if (p.type == "pivot") {
          p.dx = (p.p2.x - this.p2.x) / p.time;
          p.dy = (p.p2.y - this.p2.y) / p.time;
          p.dh = -p.dh;
          p.dw = -p.dw;
          // console.log(p.dx, p.dy)

          this.p2 = this.p2.copy();
        } else {
          p.dx = -p.dx;
          p.dy = -p.dy;
        }

      }
      return;
    }
       
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


    if ("tmp_ctx_prop" in p) return;

    p.tmp_ctx_prop = this.ctx_prop;
    p.ctx_prop = update_dict(this.ctx_prop, extract_ctx_prop(p));
    
  }
  
  
  draw(skip_animation = false) {
    let i, p;
    let animation_done = 0;

    if (!this.visible) return;

    if (!skip_animation) {
      for (i = 0; i < this.animations.length; i++) {
        p  = this.animations[i];

        
        if (p.ani_time >= p.start && p.ani_time <= p.end) {

          /* in the beginning of animation or in the beginning of reverse animation */
          if ( (p.ani_time == p.start && !REVERSE_ANIMATION) || (p.ani_time == p.end && REVERSE_ANIMATION) ) {
            this.animation_type = p.type;
            this.ctx_prop = p.ctx_prop;
          } 

          if ( (p.ani_time == p.end && !REVERSE_ANIMATION) || 
               (p.ani_time == p.start && REVERSE_ANIMATION)) {}
          else {

            if ("type" in p) {
              this.move(p.dx, p.dy, p.dh, p.dw);
            }
            
          }
 
        } 

        /* at the end of animation, we restore to the last state */
        if ( p.ani_time < p.start || p.ani_time > p.end || 
             (p.ani_time == p.end - 1 && !REVERSE_ANIMATION) || 
             (p.ani_time == p.start + 1 && REVERSE_ANIMATION)) {

          this.ctx_prop = p.tmp_ctx_prop;
          animation_done++;

          // console.log(p);
          // this is implementation choice. We didn't change the graph when we disconnect/connect a line 
          // but at the end of animation. The graph and Ani class should have the same graph representaion.
          // so it's not necessarily to change the graph here. We may one day. If we do, i will get there.

          if (p.type == "pivot" && "ani" in p) {
            p.ani.disconnect_object(this);

            if (REVERSE_ANIMATION && p.p2.obj != null) {

              this.p2 = p.p2;
              // console.log(this.p1.obj.ref, this.p2.obj.ref, p.ani.g);
              // if (p.ani.g != null) p.ani.g.get_edge_by_name(this.p1.obj.ref, this.p2.obj.ref, this.text);
              // else p.ani.connect_object(this);
              p.ani.connect_object(this);
              // console.log(p.ani.connection_map);
              // console.log(p.ani.connection_map);
            } else if (p.p.obj != null) {
              
              this.p2 = p.p; // attach to the new one.
              // console.log(this.p1.obj.ref, this.p2.obj.ref);
              // if (p.ani.g != null) p.ani.g.get_edge_by_name(this.p1.obj.ref, this.p2.obj.ref, this.text);
              // else p.ani.connect_object(this);
              p.ani.connect_object(this);
              // p.ani.connect_object(this);

            }
          }

        }


      }
    }


    if (animation_done != 0 && animation_done == this.animations.length) {
      p = this.animations[0];
      this.ctx_prop = p.tmp_ctx_prop;
      this.animations = [];
    }



    if (this.p1.is_euqal(this.p2)) return;
    
    this.cp = this.control_point(this.p1, this.p2, this.h_scale, this.w_scale);
    if (this.draw_arrow) this.draw_angle();
    ctx.save();

    load_ctx_prop(this.ctx_prop);
    ctx.beginPath();

    ctx.moveTo(this.p1.x,this.p1.y);
    
    ctx.quadraticCurveTo(this.cp.x, this.cp.y, this.p2.x, this.p2.y);
    ctx.stroke();

    this.draw_text();
    ctx.restore();


  }

  draw_text() {
    if (this.text === "") return;
    let p = this.get_xy(this.text_t);
    let pv, dx, dy;
    let tw;


    ctx.fillStyle = "black";
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

    ctx.fillText(this.text, p.x + dx - tw / 2, p.y + 10 * pv.y);

  }


  draw_angle(position = 1, angle_length = this.angle_length, angle_degree = this.angle_degree, reverse = false) {
    if (this.p1.is_euqal(this.p2)) return;
    let coord, coord1;
    let line, obj;
    let i, p, t1;

    if (this.line_type.indexOf("undirect") != -1) return;
    else if (this.line_type.indexOf("direct") != -1) {
      obj = this.p2.obj;
      for (i = 1; i >= 0; i -= 0.01) {
        p = this.get_xy(i);
       
        if (cal_distance(p.x, p.y, obj.x, obj.y) >= obj.r * obj.r) {
          break;
        }
      }
      position = i;
    }
   
    
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

    this.visited = false;
    this.propagation = false;

    this.animations = [];
    this.ref = ref;
    this.points = []; // only one center point if it has element
    this.to = [];
    this.from = [];
    this.stop_propagation = {}

    this.visible = true;
  }

  attach_point(p) {

    if (p.is_euqal(new Point(this.x, this.y))) {
      p.obj = this;
      this.points.push(p);
    } else {
      console.log("point must be center of circle");
    }    
  }


  move (dx, dy) {
    let i, tmp_propagation;
    this.x += dx;
    this.y += dy;
    
    for (i = 0; i < this.points.length; i++) {
      this.points[i].move(dx,dy);
    }

    // console.log(this.propagation);
    if (this.propagation && this.visited == false) {
      this.visited = true;
      // to array
      for (i = 0; i < this.to.length; i++) {

        if (this.to[i] != this) {
          // console.log(this.to[i].ref);
          tmp_propagation = this.to[i].propagation;
          this.to[i].propagation = true
          
          if(!this.to[i].visited && !this.stop_propagation[this.to[i].ref]) this.to[i].move(dx,dy);

          this.to[i].propagation = tmp_propagation;
        }
      }

      // from array
      for (i = 0; i < this.from.length; i++) {

        if (this.from[i] != this) {

          tmp_propagation = this.from[i].propagation;
          this.from[i].propagation = true
          
          if (!this.from[i].visited && !this.stop_propagation[this.from[i].ref]) this.from[i].move(dx,dy);
          this.from[i].propagation = tmp_propagation;
        }
      }


      this.visited = false;
    }

  }

  enable_mouse_move() {
    this.move_circle = true;
  }

  set_animation_property(p) {
    
    let arr = [];
    let i;

    for (i = 0; i < this.animations.length; i++) {
      if(this.animations[i] == p) break;
    }
    if (i == this.animations.length) this.animations.push(p);

    if(REVERSE_ANIMATION) {
      // console.log(p);
      if ("rev_p" in p) {
        p.dx = (p.rev_p.x - this.x) / p.time;
        p.dy = (p.rev_p.y - this.y) / p.time;
      }
      return;
    }

    
    if ("p" in p) {

      p.dx = (p.p.x - this.x) / p.time;
      p.dy = (p.p.y - this.y) / p.time;
      p.rev_p = new Point(this.x, this.y);
    } 

  
    if ("tmp_ctx_prop" in p) return;

    if ("stop_propagation" in p) p.tmp_stop_propagation = this.stop_propagation;

    // console.log(p);

    console.log(this.ref, p);
    p.tmp_ctx_prop = this.ctx_prop;
    p.ctx_prop = update_dict(this.ctx_prop, extract_ctx_prop(p));
    
  }

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


    if (!this.visible) return;
    animation_done = 0;
    

    if (!skip_animation) {
      for (i = 0; i < this.animations.length; i++) {
        p  = this.animations[i];

        
        if (p.ani_time >= p.start && p.ani_time <= p.end) {

          /* in the beginning of animation or in the beginning of reverse animation */
          if ( (p.ani_time == p.start && !REVERSE_ANIMATION) || (p.ani_time == p.end && REVERSE_ANIMATION) ) {
            this.ctx_prop = p.ctx_prop;
            if ("stop_propagation" in p) this.stop_propagation = p.stop_propagation;

          } 

          if ( (p.ani_time == p.end && !REVERSE_ANIMATION) || 
               (p.ani_time == p.start && REVERSE_ANIMATION)) {}
          else {

            if ("p" in p) { 
              this.move(p.dx, p.dy);
            } else if ("path" in p) {
              line = p.path;
              if (REVERSE_ANIMATION) {
                t = (p.ani_time - p.start + 1)  / p.time;
              } else {
                t = (p.end - p.ani_time + 1) / p.time;
              }
              next_p = line.get_xy(t);
              this.move(next_p.x - this.x, next_p.y - this.y);

            } 
          }
          
        } 

        /* at the end of animation, we restore to the last state. */
        if ( p.ani_time < p.start || p.ani_time > p.end || 
             (p.ani_time == p.end - 1 && !REVERSE_ANIMATION) || 
             (p.ani_time == p.start + 1 && REVERSE_ANIMATION)) {

          this.ctx_prop = p.tmp_ctx_prop;
          if ("stop_propagation" in p) this.stop_propagation = p.tmp_stop_propagation;

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
      // this.fillStyles = p.tmp_fillStyles;
      if ("stop_propagation" in p) this.stop_propagation = p.tmp_stop_propagation;
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

    ctx.fillStyle = "black";
    ctx.textBaseline = "middle";
    ctx.font = FONT;
    tw = ctx.measureText(text).width;
    ctx.fillText(text, x + (width - tw) / 2, y_middle);
   
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
    this.visited = false; // for propagation
    this.text_fade_in = {};
    this.text_fade_out = {};
    this.text_color = {};


    for (i = 0; i < this.text.length; i++) this.fillStyles.push(this.ctx_prop.fillStyle);

    this.animations = []
    // animation
   
    this.propagation = false;

    this.visible = true;
  }

  center_point() {
    return new Point(this.x + this.width / 2, this.y + this.height / 2);
  }
  
  copy_to_entry(t, index1, rect, index2, h_scale, w_scale) {
    let p, p1, p2, l, x, y1, y2;
    let size;
    let rect1;
    let block_size;
    let cp;

    let prop = deep_copy(DEFAULT_RECT_CTX);
    prop.fillStyle = this.fillStyles[index1];
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
  swap_entries(t, index1, index2, h_scale = 2, w_scale = 0.5) {
    let p, p1, p2, l, x, y1, y2;
    let size = this.text.length;
    let rect1, rect2;
    let block_size;
    let cp;

    let prop1 = deep_copy(DEFAULT_RECT_CTX);
    let prop2 = deep_copy(DEFAULT_RECT_CTX);
    prop1.fillStyle = this.fillStyles[index1];
    prop2.fillStyle = this.fillStyles[index2];

    prop1.globalAlpha = 0.5;
    prop2.globalAlpha = 0.5;

    if (index1 > size || index2 > size) {
      console.log("index1/index2 are out of boundary");
      return;
    }
    if (this.text_direction == "h") {
      block_size = this.width / size;
      p1 = new Point(this.x + block_size * index1 + block_size / 2, this.y + this.height / 2);
      p2 = new Point(this.x + block_size * index2 + block_size / 2, this.y + this.height / 2);
      rect1 = new Rect(p1.x - block_size / 2, p1.y - this.height / 2, this.width / size, this.height, "1", [this.text[index1]],"", "top", "h", prop1);
      rect2 = new Rect(p2.x - block_size / 2, p2.y - this.height / 2, this.width / size, this.height, "2", [this.text[index2]],"", "top", "h", prop2);
    } else {
      block_size = this.height / size;
      p1 = new Point(this.x, this.y + block_size * index1 + block_size / 2);
      p2 = new Point(this.x, this.y + block_size * index2 + block_size / 2);
      rect1 = new Rect(p1.x - this.width / 2, p1.y - block_size / 2, this.width, this.height / size, "1", [this.text[index1]],"", "top", "h", prop1);
      rect2 = new Rect(p2.x - this.width / 2, p2.y - block_size / 2, this.width, this.height / size, "2", [this.text[index2]],"", "top", "h", prop2);
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
    ctx.globalCompositeOperation = "destination-over";
    // l.draw();
    ctx.restore();
    
   

  }

  


  move(dx,dy) {
    let i;
    this.x += dx;
    this.y += dy;
    
    for (i = 0; i < this.points.length; i++) {
      this.points[i].move(dx,dy);
    }

    if (this.propagation && this.visited == false) {
      this.visited = true;
      for (i = 0; i < this.to.length; i++) {

        if (this.to[i] != this) {
          console.log(this.to.ref);
          this.to[i].move(dx,dy);
        }
      }
      this.visited = false;
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
  set_animation_property(p) {
    
    let arr = [];
    let i;

    for (i = 0; i < this.animations.length; i++) {
      if(this.animations[i] == p) break;
    }
    if (i == this.animations.length) this.animations.push(p);

    if(REVERSE_ANIMATION) {
      p.dx = -p.dx;
      p.dy = -p.dy;
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
    if ("tmp_ctx_prop" in p) return;
    // console.log(p);

    
    /* the fillStyle is either an array or string */
    p.tmp_fillStyles = this.fillStyles;
    if ("fillStyle" in p) {
      console.log(typeof p.fillStyle);
      if (typeof(p.fillStyle) == "string") {
        for (i = 0; i < this.text.length; i++) arr.push(p.fillStyle);
        p.fillStyle = arr;
      }
    } else {
      p.fillStyle = this.fillStyles;
    }

    p.tmp_ctx_prop = this.ctx_prop;
    p.ctx_prop = update_dict(this.ctx_prop, extract_ctx_prop(p));
    

    if ("text_fade_in" in p) {
      p.text_fade_in.text = this.text[p.text_fade_in.index]
    }
    if ("text_fade_out" in p) {
      p.text_fade_out.text = this.text[p.text_fade_out.index]
    }
    
  }

  draw (skip_animation = false) {
    let i,j, x, y, alpha;
    let num_fields = this.text.length;
    let p;
    let animation_done = 0;
    let line;
    let t;
    let next_p;
    let tmp;
  
    if (!this.visible) return;
    if (!skip_animation) {
      for (i = 0; i < this.animations.length; i++) {
        p  = this.animations[i];

        
        if (p.ani_time >= p.start && p.ani_time <= p.end) {

          /* in the beginning of animation or in the beginning of reverse animation */
          if ( (p.ani_time == p.start && !REVERSE_ANIMATION) || (p.ani_time == p.end && REVERSE_ANIMATION) ) {
            this.fillStyles = p.fillStyle;
            this.ctx_prop = p.ctx_prop;
            if ("propagation" in p) this.propagation = p.propagation;
            
            if (REVERSE_ANIMATION && "text_fade_out" in p) {
             
              this.text[p.text_fade_out.index] = p.text_fade_out.text;
      
            }
            if (!REVERSE_ANIMATION && "text_fade_in" in p) {
              this.text[p.text_fade_in.index] = p.text_fade_in.text;
            }
            // if (REVERSE_ANIMATION && "text_fade_in" in p) {
            //   this.text[p.text_fade_out.index] = p.text_fade_out.text;
            // }

          } 

          if ( (p.ani_time == p.end && !REVERSE_ANIMATION) || 
               (p.ani_time == p.start && REVERSE_ANIMATION)) {}
          else {

            

            if ("text_fade_out" in p) {
              alpha = 1 - (p.ani_time - p.start + 1) / p.time;
              // if (REVERSE_ANIMATION) alpha = 1 - alpha;
              this.text_fade_out[p.text_fade_out.index] = {
                fillStyle : p.text_fade_out.color, 
                alpha: alpha,
              }
            }

            if ("text_fade_in" in p) {
              alpha = (p.ani_time - p.start + 1) / p.time;
              // if (REVERSE_ANIMATION) alpha = 0;
              // if (REVERSE_ANIMATION) alpha = 1 - alpha;
              this.text_fade_in[p.text_fade_in.index] = {
                fillStyle : p.text_fade_in.color, 
                alpha: alpha,
              }
            }

            if ("p" in p) { 
              this.move(p.dx, p.dy);
            } else if ("path" in p) {
              line = p.path;
              if (REVERSE_ANIMATION) {
                t = (p.ani_time - p.start + 1)  / p.time;
              } else {
                t = (p.end - p.ani_time + 1) / p.time;
              }
              next_p = line.get_xy(t);
              this.move(next_p.x - this.x, next_p.y - this.y);

            } else if ("swap" in p) {
              if (REVERSE_ANIMATION) t = p.end - p.ani_time + 1;
              else t = p.ani_time - p.start + 1;

              this.swap_entries( t / p.time, 
                                 p.swap.index1, p.swap.index2, 
                                 p.swap.h_scale, p.swap.w_scale);

            } else if ("copy" in p) {
              if (!REVERSE_ANIMATION) {
                this.copy_to_entry((p.ani_time - p.start + 1) / p.time, 
                                    p.copy.index1, p.copy.rect, p.copy.index2, 
                                    p.copy.h_scale, p.copy.w_scale, p.copy.ctx_prop);
              }
            }
          }
          
        } 

        /* at the end of animation, we restore to the last state */
        if ( p.ani_time < p.start || p.ani_time > p.end || 
             (p.ani_time >= p.end - 1 && !REVERSE_ANIMATION) || 
             (p.ani_time <= p.start + 1 && REVERSE_ANIMATION)) {

          this.ctx_prop = p.tmp_ctx_prop;
          this.fillStyles = p.tmp_fillStyles;
          if ("swap" in p) {
            tmp = this.text[p.swap.index1]
            this.text[p.swap.index1] = this.text[p.swap.index2];
            this.text[p.swap.index2] = tmp;
          } else if ("copy" in p) {
           
            if (REVERSE_ANIMATION) p.copy.rect.text[p.copy.index2] = p.copy.text2;
            else p.copy.rect.text[p.copy.index2] = p.copy.text1;
          }

          if ("text_fade_out" in p) {
            
            if (!REVERSE_ANIMATION) {
              this.text[p.text_fade_out.index] = "";
              if (p.text_fade_out.index in this.text_color) delete this.text_color[p.text_fade_out.index]; 
            }
            if (REVERSE_ANIMATION) this.text_color[p.text_fade_out.index] = this.text_fade_out[p.text_fade_out.index];

      
            delete this.text_fade_out[p.text_fade_out.index];
          }
          if ("text_fade_in" in p) {
            if (REVERSE_ANIMATION) {
              this.text[p.text_fade_in.index] = "";
              if (p.text_fade_in.index in this.text_color) delete this.text_color[p.text_fade_in.index];
            }
            if (!REVERSE_ANIMATION) this.text_color[p.text_fade_in.index] = this.text_fade_in[p.text_fade_in.index];

            delete this.text_fade_in[p.text_fade_in.index];

          }
          animation_done++;
        }


      }
    }

    // when all of animations are done, we restore the rect property.
    // the first animation's tmp store the original rect property.
    if (animation_done != 0 && animation_done == this.animations.length) {

      p = this.animations[0];
      console.log(this.ref, " done: ", this.animations);
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
    // ctx.beginPath();
  
    for (i = 0; i < this.text.length; i++) {
      // if (this.text[i] === "") continue;
      let draw_text_prop = {fillStyle: "black", alpha: 1};
      if (i in this.text_fade_out) draw_text_prop = this.text_fade_out[i];
      else if (i in this.text_fade_in) draw_text_prop = this.text_fade_in[i];
      else if (i in this.text_color) draw_text_prop = this.text_color[i];

      if (this.text_direction == "v")
        this.draw_text(this.x, this.y + this.height / num_fields / 2 * (2*i + 1), this.width, this.text[i], draw_text_prop);
      else 
        this.draw_text(this.x + this.width / num_fields * i, this.y + this.height / 2, this.width / num_fields, this.text[i], draw_text_prop);
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

  draw_text(x, y_middle, width, text, ctx_prop = {fillStyle: "black", alpha: 1} ) {
    let tw;
    

    ctx.globalAlpha = ctx_prop.alpha;
    ctx.fillStyle = ctx_prop.fillStyle;
    ctx.textBaseline = "middle";
    ctx.font = FONT;
    tw = ctx.measureText(text).width;

    ctx.fillText(text, x + (width - tw) / 2, y_middle);
   
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


class Text {
  constructor(text, x, y, width, font = FONT) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.width = width;
    this.font = font;
    this.visible = true;
    // ref is the key of obj_map in the Animation. 
    // Math.random() should be unique enough where it doesn't produce two same number
    this.ref = Math.random() + text;
  }

  draw() {
    if (!this.visible) return;
    let tw;
    ctx.strokeStyle = "black";
    ctx.textBaseline = "middle";
    ctx.font = this.font;
    tw = ctx.measureText(this.text).width;
    ctx.fillText(this.text, this.x + (this.width - tw) / 2, this.y);
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
  shallow_copy() {
    let e = new Edge(this.n1, this.n2, this.weight);
    e.ani_line = this.ani_line;
    return e;
  }
  pretty_edge() {
    return this.n1.id +  "&rarr;" + this.n2.id;
  }
  
}

class Graph {
  constructor(ani, graph_type = "undirect", non_removable_nodes = []) {

    this.node_map = {};
    this.edge_map = {};

    this.ani = ani;
    this.ani.g = this;
    this.graph_type = graph_type;

    this.non_removable_nodes = {};
    for (let i = 0; i < non_removable_nodes.length; i++) {
      this.non_removable_nodes[non_removable_nodes[i]] = true;
    }
   

    this.label = "";
    this.label_position = "top";

    // we change MAIN_G_SPEC to change these default specs.
    this.node_radius = MAIN_G_SPEC.node_radius;
    this.node_color = MAIN_G_SPEC.node_color;
    this.edge_color = MAIN_G_SPEC.edge_color;
    this.edge_width = MAIN_G_SPEC.edge_width;
    this.weight_type = MAIN_G_SPEC.weight_type;
    
    this.center_x = MAIN_G_SPEC.center_x;  // this is for tree layout  
    this.num_cols = MAIN_G_SPEC.num_cols;
    this.gap_x = MAIN_G_SPEC.gap_x;
    this.gap_y = MAIN_G_SPEC.gap_y;
    this.layout = MAIN_G_SPEC.layout;

    this.enable_node_move = MAIN_G_SPEC.enable_node_move;
    this.enable_edge_create = MAIN_G_SPEC.enable_edge_create;
    this.enable_node_color_change = MAIN_G_SPEC.enable_node_color_change;
    this.enable_edge_color_change = MAIN_G_SPEC.enable_edge_color_change;
    this.create_reverse_edge = MAIN_G_SPEC.create_reverse_edge;
    

  }

  // set_label(label = "", label_position = "top") {
  //   this.label = label;
  //   this.label_position = label_position;
  // }

  // draw_label() {

  //   if (this.label == "") return;
  //   let tw;
  //   let n;
  //   let x1, x2, y1, y2, y;

  //   x1 = 100000;
  //   x2 = -1;
  //   y1 = 100000;
  //   y2 = -1;

  //   for (let key in this.node_map) {
  //     n = this.node_map[key].ani_circle;
  //     if (n.x < x1) x1 = n.x;
  //     if (n.x > x2) x2 = n.x;
  //     if (n.y < y1) y1 = n.y;
  //     if (n.y > y2) y2 = n.y;
  //   }

  //   ctx.strokeStyle = "black";
  //   ctx.textBaseline = "middle";
  //   ctx.font = "18px Times New Roman";
  //   tw = ctx.measureText(this.label).width;

  //   if (this.label_position == "top") y = y1 - 15 - this.node_radius;
  //   else y = y2 + 15 + this.node_radius;
  //   ctx.fillText(this.label, (x1 + x2) / 2 - tw / 2, y);
    
   
  // }

  deep_copy(ani = null) {
    let a;

    if (ani == null) a = this.ani;
    else a = ani;

    let g = new Graph(a, this.graph_type);
    for (let key in this.node_map) {
      g.node_map[key] = this.node_map[key];
    }

    for (let key in this.edge_map) {
      g.edge_map[key] = this.edge_map[key];
    }

    return g;
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
        y = row * this.gap_y;
        x = col * this.gap_x;
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
          y += this.gap_y;
          gap = this.gap_x;
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
    if (id in this.non_removable_nodes) {
      $("#elaboration_text").text("{} can't be removoed".format(id));
      return;
    }

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
  get_node (id, x = null, y = null, name = null) {


    if (id in this.node_map) return this.node_map[id];
    let n = new Node(id);
    let c, p;
    let x_y;

    if (x == null || y == null) x_y = this.get_node_position();
    else x_y = [x, y];
    
    if(name == null) name = id;
    c = new Circle(x_y[0], x_y[1], this.node_radius, id, name);
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
  get_edges_by_name(edges, force = true) {
    for (let i = 0; i < edges.length; i++) {
      this.get_edge_by_name(edges[i][0], edges[i][1], edges[i][2], force);
    }
  }

  remove_edge_by_name(id1, id2) {
    let n1 = null,
        n2 = null;
    if (this.is_node(id1)) n1 = this.get_node(id1);
    if (this.is_node(id2)) n2 = this.get_node(id2);
    if (n1 == null || n2 == null) {
      return null;
    } else this.remove_edge(n1, n2);
  }
  get_edge_by_name(id1, id2, weight = 0, force = true) {
    let n1 = null,
        n2 = null;
    if (this.is_node(id1)) n1 = this.get_node(id1);
    if (this.is_node(id2)) n2 = this.get_node(id2);
    if (n1 == null || n2 == null) {
      return null;
    } else return this.get_edge(n1, n2, weight, force);
  }

  get_edge(n1, n2, weight = 0, force = true) {
    let id = n1.id + "->" + n2.id;
    let id2 = n2.id + "->" + n1.id;
    let e, l;
    let l_or_c;

    if (n1.id == n2.id) return;

    if (!this.create_reverse_edge && id2 in this.edge_map) return this.edge_map[id2]; 
    // console.log(force)

    // check weight_type
    if ((force && id in this.edge_map) || !(id in this.edge_map)) {
      switch(this.weight_type) {
        case T_CONSTANT:
          weight = "";
          break;
        case T_STRING:
          break;
        case T_NUMBER: 
          weight = parseFloat(weight);
          if (isNaN(weight)) return null;
          break;
        case T_POSITIVE_NUMBER:
          weight = parseFloat(weight);
          if (isNaN(weight) || weight <= 0) return null;
          break;
        case T_NON_NEGATIVE_NUMBER:

          weight = parseFloat(weight);
          if (isNaN(weight) || weight < 0) return null;
          break;
        case T_NEGATIVE_NUMBER: 
          weight = parseFloat(weight);
          if (isNaN(weight) || weight >= 0) return null;
          break;

        default:
          return null;
          console.log("wrong weight_type");
      }
    }


    if (id in this.edge_map) {
      e = this.edge_map[id];
    
     
      if (force) e.weight = weight;
      if (e.ani_line != null) {
        if (force) e.ani_line.text = weight;
        e.ani_line.ctx_prop.lineWidth = this.edge_width;
        e.ani_line.ctx_prop.strokeStyle = this.edge_color;
      }
      if (this.graph_type == "undirect" || this.graph_type == "undirected") {
        if (id2 in this.edge_map && force) this.edge_map[id2].weight = weight;
      }
      
      return e;
    }

    e = new Edge(n1, n2, weight);
    l_or_c = this.ani.get_connection(n1.id, n2.id);
    if (l_or_c.length != 0) l = l_or_c[0];
    else {
      l = new quadraticCurve(n1.ani_circle.points[0], n2.ani_circle.points[0], 0, 0.5);
      l.line_type = this.graph_type;
      l.text_t = 0.65;
      l.angle_degree = 25;
      l.angle_length = 11;
      l.text = weight;
      l.ctx_prop.strokeStyle = this.edge_color;
      l.ctx_prop.lineWidth = this.edge_width;
    }

    e.ani_line = l;
    l.enable_mouse_move();
    n1.adj.push(e);

    this.ani.connect_object(l);
    this.edge_map[id] = e;

    if (this.graph_type == "undirect" || this.graph_type == "undirected") {
      if (this.create_reverse_edge) {
        e = new Edge(n2, n1, weight);
        e.ani_line = l;
        this.edge_map[id2] = e;
        n2.adj.push(e);
      }

    /* if it's direct graph we have two edges, we set change line to curve with h_scale 0.1 */
    } else if (this.is_edge(n2, n1) == true) {
      // console.log("123");
      l.h_scale = 0.1;
      e = this.get_edge(n2, n1, 0, false);
      e.ani_line.h_scale = 0.1;
      l.update_cp();
      e.ani_line.update_cp();
      
    }

    return this.edge_map[id];
  }

  draw() {
    this.ani.draw();
  }

}
