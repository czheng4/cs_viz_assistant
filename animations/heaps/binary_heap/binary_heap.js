/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  01/04/2021
  Last Modified 01/05/2020
*/
"use strict";

const HIGHLIGHT_NODE = {"fillStyle": "pink"};
const HIGHLIGHT_EDGE = {"strokeStyle": "red"};


function swap(v, index1, index2) {
  let tmp;
  tmp = v[index1];
  v[index1] = v[index2];
  v[index2] = tmp;

}
class binaryHeapAnimation {
  constructor(init = true) {
    this.ani = new Animation();
    this.g = new Graph(this.ani, "undirected");
    this.rects = [];
    this.ss = 35;
    this.max_size = 31;
    this.size = 0;
    this.heaps = [];
    this.nodes = [];

    this.func_text = new Text("", 50, 120, 100, "15px Arial");
    this.func_text.text_align = "left";
    this.ani.add_object(this.func_text);

    if (init) this.setup_graph();


  }

  deep_copy() {
    let bh = new binaryHeapAnimation(false);
    bh.ani = this.ani;
    bh.g = this.g;
    bh.rects = this.rects;
    bh.heaps = deep_copy(this.heaps);
    bh.nodes = this.nodes;
    bh.size = this.size;
    bh.func_text = this.func_text;
    return bh;
  }

  set_state() {
    let ani = this.ani;
    
    /* the entire state is composed of the state of graph, Animation and algorithm */
    let state = this.deep_copy(); // this copy the state of algorithm

    state.ani = state.ani.deep_copy(); // this copy the state of animation
    state.g = state.g.deep_copy(state.ani); // this copy the state of Graph
  
    ani.set_state(state);
  }
  setup_graph() {
    let i;
    let x,y;
    let rect, n, n2, e;
    let ani = this.ani;
    let g = this.g;
    let line_width = 0;

    y = 30;
    for (i = 0; i < this.max_size; i++) {
      x = i * (this.ss + line_width) + 50;
      rect = new Rect(x, y, this.ss, this.ss, "RECT_" + i, [""], i, "top", "h");
      rect.fillStyles = ["#F3F5F9"];

      rect.visible = false;
      this.rects.push(rect);
      ani.add_object(rect);
      n = this.g.get_node("NODE_" + i, null, null, i);
      n.ani_circle.label = i;
      n.ani_circle.label_padding = 6;
      n.ani_circle.label_font = "10px Arial";
     
      this.nodes.push(n);
      n.ani_circle.visible = false;
    }

    for (i = 0; i < this.max_size; i++) {
      n = this.nodes[i];
      if (i * 2 + 1 < this.max_size) {
        n2 = this.nodes[i * 2 + 1];
        e = g.get_edge(n, n2);
        e.ani_line.visible = false;
      } 
      if (i * 2 + 2 < this.max_size) {
        n2 = this.nodes[i * 2 + 2];
        e = g.get_edge(n, n2);
        e.ani_line.visible = false;
      }
    }
   
    //console.log(ani.obj_map, ani.connection_map);
    ani.draw();
  }




  swap_ani(child, parent, h_direction = 1) {
    let from, to, from_rect, to_rect;
    let h_scale;
    let val1, val2;
    from = this.nodes[child];
    to = this.nodes[parent];

    val1 = this.heaps[child];
    val2 = this.heaps[parent];
    this.ani.add_sequence_ani({
      text: "Child {} < Parent {} Swap {} and {}".format_b(val1, val2, val1, val2),
      target:from.ani_circle,
      prop: {"swap": {circle: to.ani_circle, h_scale: 0}, time: ANIMATION_TIME * 3},
      concurrence:true
    });

    from_rect = this.rects[child];
    to_rect = this.rects[parent];

    h_scale = -2.8 * 1 / Math.abs(child - parent) * h_direction; 
    this.ani.add_sequence_ani({
      target: from_rect,
      prop: {"swap": {index1:0, rect: to_rect, index2: 0, h_scale:h_scale}, time: ANIMATION_TIME * 3},
    });

    this.color_node(from, "lightblue");
    this.color_node(to, "pink");
    this.rect_ani(child, null, "lightblue", 1);
    this.rect_ani(parent, null, "pink", 1);
  }
  color_node(n, color = "#DDDDDD") {
    if (n == null) return;
    this.ani.add_sequence_ani({
      target: n.ani_circle,
      prop: {fade_in:true, fillStyle: color, time:1},
    });
  }
  color_edge(e, color = "black") {
    if (e == null) return;
    this.ani.add_sequence_ani({
      target: e.ani_line,
      prop: {fade_in:true, strokeStyle: color, time:1},
    });
  }

  fade_in(obj, prop, concurrence = true) {
    prop = update_dict(prop, {fade_in:true, visible:true});
    this.ani.add_sequence_ani({
      target:obj,
      prop: prop,
      concurrence: concurrence
    });
    
  }
  fade_out(obj, concurrence = true) {
    this.ani.add_sequence_ani({
      target: obj,
      prop: {"fade_out": true},
      concurrence: concurrence
    });
  }

  rect_ani(index, val = null, color = "pink", time = ANIMATION_TIME) {
    let prop = {visible:true, fade_in: true, time:time};

    if (val != null) prop.text = [val];
    prop.fillStyle = color;

    this.ani.add_sequence_ani({
      target: this.rects[index],
      prop : prop,
    });
  }

  clear_ctx_prop() {
    let g = this.g;
    let n;
    for (let key in g.node_map) {
      n = g.node_map[key];
      n.ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }
    for (let key in g.edge_map) {
      g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }
    for (let i = 0; i < this.heaps.length; i++) {
      this.rects[i].fillStyles = ["#F3F5F9"];
    }
  }
  push(val) {
    val = parseFloat(val);
    let ani = this.ani;
    let index, parent, child;
    let n, parent_n, e;
    let tmp;

    if (this.heaps.length >= this.max_size) {
      $("#elaboration_text").text("Heap is full. Max size is {}".format(this.max_size));
      return;
    }

    this.ani.set_function_call("push", [val]);
    this.set_state();
    this.func_text.text = "Push {}".format(val);
    this.clear_ctx_prop();
    e = null;
    this.heaps.push(val);
    index = this.heaps.length - 1;
    parent = parseInt((index - 1) / 2);

    n = this.nodes[index];
    parent_n = this.nodes[parent];
   
    e = this.g.get_edge_if_exists(parent_n, n);
    ani.add_sequence_ani({
      pause:1,
      text: "Push back value {} into vector and then bubble up".format_b(val),
    });
    this.fade_in(n.ani_circle, update_dict(HIGHLIGHT_NODE, {text: val}), e != null);
    if (e != null) this.fade_in(e.ani_line, HIGHLIGHT_EDGE, false);
    this.rect_ani(index, val);
    ani.add_sequence_ani({prop:{step:true, time:1}});

    // n.ani_circle.visible = true;
    child = index;
    while (1) {
      if (child == 0) break;
      parent = parseInt((child - 1) / 2);

      this.color_node(this.nodes[child], "pink");
      this.color_node(this.nodes[parent], "lightblue");
      this.rect_ani(child, null, "pink", 1);
      this.rect_ani(parent, null, "lightblue", 1);
      e = this.g.get_edge(this.nodes[parent], this.nodes[child]);
      this.color_edge(e, "red");
      ani.add_sequence_ani({
        text: "Check parent's value {} against child's value {}".format_b(this.heaps[parent], this.heaps[child]),
        prop:{step:true, time:1},
      });

      if (this.heaps[parent] > this.heaps[child]) {
        
        
        this.swap_ani(child, parent);
        ani.add_sequence_ani({prop:{step:true, time:1}});
        swap(this.heaps, child, parent);
        
      } else {
        ani.add_sequence_ani({
          text: "Parent {} <= Child {}. We are done".format_b(this.heaps[parent], this.heaps[child]),
          prop:{step:true, time:1},
        });
        this.func_text_ani();
        ani.run_animation();
        return;
      }

      if (parent != 0) this.rect_ani(child, null, "#F3F5F9", 1);
      child = parent;
    }
    

    ani.add_sequence_ani({
      text: "Done",
      pause:1,
    });
    this.func_text_ani();
    ani.run_animation();
  }

  pop() {

    let first_node, last_node, parent_node, e;
    let lci, rci;
    let index, parent;
    let ani = this.ani;
    let g = this.g;
    let e_text;
    if (this.heaps.length == 0) {
      $("#elaboration_text").text("Heap is empty");
      return;
    }

    this.ani.set_function_call("pop", []);
    this.set_state();
    this.func_text.text = "Pop";

    this.clear_ctx_prop();
    index = this.heaps.length - 1;
    last_node = this.nodes[index];
    first_node = this.nodes[0];
    parent_node = this.nodes[parseInt((index - 1) / 2)];

    this.rect_ani(0, null, "pink", 1);
    this.rect_ani(index, null, "pink", 1);
    this.color_node(first_node, "pink");
    this.color_node(last_node, "pink");
    ani.add_sequence_ani({
      text: "Copy the value of last element {} into the first element. Pop off the last element and then perfrom bubble down".format_b(this.heaps[index]),
      target: last_node.ani_circle,
      prop: {copy: {circle: first_node.ani_circle, h_scale : 0}, time: ANIMATION_TIME * 3},
      concurrence: true,
    });
    ani.add_sequence_ani({
      target: this.rects[index],
      prop: {copy: {rect: this.rects[0], index1: 0, index2: 0, h_scale: -2.8 * 1 / index}, time: ANIMATION_TIME * 3},
      concurrence: true,
    });
    ani.add_sequence_ani({
      target: this.rects[index],
      prop:{fade_out: true, time :ANIMATION_TIME * 3},
    });


    e = g.get_edge_if_exists(parent_node, last_node);
    this.fade_out(last_node.ani_circle, e != null);
    if (e != null) this.fade_out(e.ani_line, false);
    ani.add_sequence_ani({
      prop:{step:true, time:1},
    });


    this.heaps[0] = this.heaps[index];
    this.heaps.pop();

    index = 0;
    while (1) {
      lci = index * 2 + 1;
      rci = lci + 1;
      if (lci >= this.heaps.length) {
        ani.add_sequence_ani({
          text: "No children. We are done",
          pause:1,
        });
        break;
      }

      this.color_node(this.nodes[index], "pink");
      // this.color_node(this.nodes[lci], "lightblue");
      // this.color_node(this.nodes[rci], "lightblue");

      this.rect_ani(index, null, "pink", 1);
      // this.rect_ani(parent, null, "lightblue", 1);

      // e = this.g.get_edge(this.nodes[parent], this.nodes[child]);
      // this.color_edge(e, "red");
     



      if (this.heaps[lci] <= this.heaps[rci] || rci >= this.heaps.length) {
       
          
        this.color_node(this.nodes[lci], "lightblue");
        e = g.get_edge_if_exists(this.nodes[index], this.nodes[lci]);
        this.color_edge(e, "red");
        this.rect_ani(lci, null, "lightblue", 1);
        if (rci >= this.heaps.length) {
          e_text = "No right child. ";
        } else {
          e_text = "Left Child {} <= right Child {}. ".format_b(this.heaps[lci], this.heaps[rci]);
        }
        e_text += "Check left child {} against parent {}".format_b(this.heaps[lci], this.heaps[index]);
        ani.add_sequence_ani({
          text: e_text,
          prop:{step:true, time:1},
        });


        if (this.heaps[lci] < this.heaps[index]) {

          this.swap_ani(index, lci, -1);
          ani.add_sequence_ani({prop:{step:true, time:1}});
          swap(this.heaps, index, lci);
          this.rect_ani(index, null, "#F3F5F9", 1);
          index = lci;
        } else {
          ani.add_sequence_ani({
            text: "Parent {} <= left child {}. We are done".format_b(this.heaps[index], this.heaps[lci]),
            prop:{step:true, time:1},
          });
          break;
        }

          
      } else {
        this.color_node(this.nodes[rci], "lightblue");
        e = g.get_edge_if_exists(this.nodes[index], this.nodes[rci]);
        this.color_edge(e, "red");
        this.rect_ani(rci, null, "lightblue", 1);
       
        ani.add_sequence_ani({
          text: "Right child {} < left child {}. Check right child {} against parent {}".format_b(this.heaps[rci], this.heaps[lci], this.heaps[rci], this.heaps[index]),
          prop:{step:true, time:1},
        });

        if (this.heaps[rci] < this.heaps[index]) {
          
          this.swap_ani(index, rci,  -1);
          ani.add_sequence_ani({prop:{step:true, time:1}});
          swap(this.heaps, index, rci);
          this.rect_ani(index, null, "#F3F5F9", 1);
          index = rci;
        } else {
          ani.add_sequence_ani({
            text: "Parent {} <= right child {}. We are done".format_b(this.heaps[index], this.heaps[rci]),
            prop:{step:true, time:1},
          });
          break;
        }

      }

    }
    this.func_text_ani();
    ani.run_animation();

  }

  func_text_ani() {
    this.ani.add_sequence_ani({
      target: this.func_text,
      prop: {text: this.func_text.text, time:1},
    });
  }
}