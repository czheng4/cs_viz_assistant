/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/18/2020
  Last Modified 12/26/2020
*/

const R_WIDTH = 100;
const R_HEIGHT = 80;
const R_MARGIN = 60;
const R_OFFSET_Y = 160;

/* a callback function to remove a rect object when node is erased */
function rm_ani_object(dict) {
  let ref = dict.ref,
      ani = dict.ani;

  dict.ani.remove_object(ref);
}

function add_ani_object(dict) {
  let obj = dict.obj;
  let lines = dict.lines;
  let ani = dict.ani;
  let i;
  ani.add_object(obj);
  for (i = 0; i < lines.length; i++) {
    ani.connect_object(lines[i]);
  }
}

class Snode {
  constructor(val) {
    this.val = val;

    this.next = null;
    this.rect = null;
    
    /* points */
    this.left_top_p = null;
    this.right_top_p = null;
    this.next_p = null;

    /* line */
    this.next_line = null;
  }

  deep_copy() {
    let sn = new Snode(this.val);
    sn.rect = this.rect;
    sn.left_top_p = this.left_top_p;
    sn.right_top_p = this.right_top_p;
    sn.next_p = this.next_p;
    sn.next_line = this.next_line;
    sn.ref = this.ref;
    return sn;
  }
  set_rect(ani, rect) {
    
    let x = rect.x,
        y = rect.y;

    this.rect = rect;

    rect.attach_point(this.next_p = ani.get_point(x, y + R_HEIGHT * 3 / 4.0));
    rect.attach_point(this.left_top_p = ani.get_point(x, y));
    rect.attach_point(this.right_top_p = ani.get_point(x + R_WIDTH, y));
    ani.connect_object(this.next_line = new quadraticCurve(this.next_p, this.next_p, 0));
    this.next_line.angle_degree = 22;
    this.next_line.angle_length = 13;

  }
}

class Stack {
  constructor() {
    this.top = null;
    this.size = 0;
    this.ms = new memorySimulator(2, true);
  }
  push(v) {
    let snode = new Snode(v);

    snode.ref = this.ms.get_reference(snode);
    if (this.top != null) snode.next = this.top;
    this.top = snode;
    this.size++;
    return snode;
  }

  pop() {
    let rv;
    rv = this.top;
    if (this.top == null) return null;
    this.top = this.top.next;
    this.size--;
    return rv;
  }

  deep_copy() {
    let pre_n, n;
    let stack = new Stack();
    
    stack.ani = this.ani;
    stack.stack_rect = this.ani;

    n = this.top;
    for (let i = 0; i < this.size; i++) {
      if (i == 0) {
        stack.top = n.deep_copy();
        pre_n = stack.top;
      } else {
        pre_n.next = n.deep_copy();
        pre_n = pre_n.next;
      }
      n = n.next;
    }

    stack.size = this.size;
    stack.ms.pre_address = this.ms.pre_address;
  
    return stack;
  }
}

class stackAnimation {
  constructor() {
    let p;
    this.ani = new Animation();
    this.stack_rect = new Rect(350, 30, 150, 50, "STACK_CLASS_REF", ["top = NULL", "size = 0"], "Stack", "top","h");

    p = this.ani.get_point(375, 80);
    this.stack_rect.attach_point(p);
    this.top_ptr_line = new quadraticCurve(p, p, 0);
    this.top_ptr_line.angle_degree = 20;
    this.top_ptr_line.ctx_prop.strokeStyle = "blue";
    this.top_ptr_line.ctx_prop.lineWidth = 2.5;

    this.ani.connect_object(this.top_ptr_line);
    this.ani.draw();
    this.stack = new Stack();
  }


  set_state() {
    let sa = new stackAnimation();
    sa.stack_rect = this.stack_rect;
    sa.top_ptr_line = this.top_ptr_line;

    sa.stack = this.stack.deep_copy();
    sa.ani = this.ani.deep_copy();
    this.ani.set_state(sa);
  }

  pop() {
    let ani = this.ani,
        stack_rect = this.stack_rect,
        stack = this.stack;
    let snode, rect, pre_rect;
    let ref, x, y, p, pre_node, pre_ref;
    let size;

    if (stack.size == 0) {
      $("#elaboration_text").text("Stack size is 0. Nothing to pop off");
      return;
    }


    this.ani.set_function_call("pop");
    this.set_state();
    
    snode = stack.pop();
    pre_node = snode.next;

    ani.add_sequence_ani({
      target: snode.rect,
      text: "Get the top node {}".format_b(snode.ref),
      prop: {fade_in:true, strokeStyle: 'blue', shadowColor:"#0000FF", shadowBlur:15, step:true, time:1},
    });


    if (pre_node != null) {
      p = pre_node.right_top_p;
      pre_ref = pre_node.ref;
    } else { 
      p = this.top_ptr_line.p1;
      pre_ref = "NULL";
    }
    ani.add_sequence_ani({
      target: this.top_ptr_line,
      text: "Move stack top to {}'s next node, which is {}. Decrement the size by one".format_b(snode.ref, pre_ref),
      prop: {p: p, type:"pivot", ani:ani},
    });


    /* set text of stack */
    ani.add_sequence_ani({
      target: stack_rect,
      prop: {text_fade_in: {text: "top = " + pre_ref, index: 0}, time : 1},
      concurrence: true,
    });
     ani.add_sequence_ani({
      target: stack_rect,
      prop: {text_fade_in: {text: "size = " + stack.size, index: 1}, time : 1, step:true},
    });


    /* rm the rect and its next_line */
    ani.add_sequence_ani({
      target: snode.rect,
      text: "Done",
      prop: {fade_out: true},
      concurrence: true
    });
    ani.add_sequence_ani({
      target: snode.next_line,
      prop:{fade_out:true}
    });

    ani.add_sequence_ani({
      pause:1,
      action: {params: {ani:ani, ref: snode.ref}, func: rm_ani_object},
      rev_action: {params: {ani:ani, obj:snode.rect, lines: [snode.next_line]}, func: add_ani_object},
    });

    ani.run_animation();


  }


  push(v) {
    let ani = this.ani,
        stack_rect = this.stack_rect,
        stack = this.stack;
    let snode, rect, pre_rect;
    let ref, x, y, p, pre_node;
    let size;

    this.ani.set_function_call("push", [v]);
    this.set_state();


    size = this.stack.size;
    pre_node = this.stack.top;
    snode = stack.push(v);
    
    ref = snode.ref;


    x = size * (R_WIDTH + R_MARGIN);
    y = R_OFFSET_Y;
    rect = new Rect(x, y, R_WIDTH, R_HEIGHT, ref, ["val = " + v, "next = NULL"], ref, "bottom");
    ani.add_object(rect);
    snode.set_rect(ani, rect);
    rect.alpha = 0;

    if (pre_node != null) {
      ani.add_sequence_ani({
        target:pre_node.rect,
        text: "Get the top node {}".format_b(pre_node.ref),
        prop: {fade_in:true, strokeStyle: 'blue', shadowColor:"#0000FF", shadowBlur:15, step:true, time:1},
      });
    }

    ani.add_sequence_ani({
      target:rect,
      text: "Make a new stack node {}".format_b(ref),
      prop: {fade_in:true, strokeStyle: 'red', shadowColor:"#FF0000", shadowBlur:15, step:true}
    });


    if (pre_node != null) {
     
      // pre_rect = ani.get_object(ms.get_reference(pre_node));
      ani.add_sequence_ani({
        text: "Set added node {}'s next to {}".format_b(snode.ref, pre_node.ref),
        target: snode.next_line,
        prop: {p: pre_node.right_top_p, type:"pivot", ani:ani}
      });

      ani.add_sequence_ani({
        target: snode.rect,
        prop: {text_fade_in: {text: "next = " + pre_node.ref, index:1}, time : 1, step: true}
      });


    }

    p = snode.right_top_p;
    ani.add_sequence_ani({
      text: "Move top point to the new node {}. Increment the size by one".format_b(ref),
      target: this.top_ptr_line,
      prop: {p:p, type: "pivot", ani:ani},
    });



    /* set the stack into */
    ani.add_sequence_ani({
      target: stack_rect,
      prop: {text_fade_in: {text: "top = " + ref, index: 0}, time : 1},
      concurrence: true,
    });
    ani.add_sequence_ani({
      target: stack_rect,
      prop: {text_fade_in: {text: "size = " + stack.size, index: 1}, time : 1, step:true},
    });

    /* disable the shadow */

    ani.add_sequence_ani({
      text: "Done"
    });
    if (pre_node != null ){
      ani.add_sequence_ani({
        target: pre_node.rect,
        prop: {fade_in:true, strokeStyle: '#696969', shadowBlur:0, time:1},
        concurrence: true,
      });
    }
    ani.add_sequence_ani({
      target: snode.rect,
      prop: {fade_in:true, strokeStyle: '#696969', shadowBlur:0, time:1},
    });   


    ani.run_animation();
  }
}