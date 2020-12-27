/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/19/2020
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

class Qnode {
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
    let sn = new Qnode(this.val);
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

    rect.attach_point(this.next_p = ani.get_point(x + R_WIDTH, y + R_HEIGHT * 3 / 4.0));
    rect.attach_point(this.left_top_p = ani.get_point(x, y));
    rect.attach_point(this.right_top_p = ani.get_point(x + R_WIDTH, y));
    ani.connect_object(this.next_line = new quadraticCurve(this.next_p, this.next_p, 0));
    this.next_line.angle_degree = 22;
    this.next_line.angle_length = 13;

  }
}


class Queue {
  constructor() {
    this.first = null;
    this.last = null;
    this.size = 0;
    this.ms = new memorySimulator(2, true);
  }

  push(v) {
    let qnode = new Qnode(v);

    qnode.ref = this.ms.get_reference(qnode);
    if (this.last == null) {
      this.first = qnode;
    } else {
      this.last.next = qnode;
    }

    this.last = qnode;
    this.size++;
    return qnode;
  }

  pop() {
    let rv;
    rv = this.first;
    if (this.first == null) return null;

    this.first = this.first.next;

    if (this.first == null) this.last = null;
    this.size--;
    return rv;
  }

  deep_copy() {
    let pre_n, n;
    let queue = new Queue();
    
    queue.ani = this.ani;
    queue.queue_rect = this.ani;

    n = this.first;
    for (let i = 0; i < this.size; i++) {
      if (i == 0) {
        queue.first = n.deep_copy();
        pre_n = queue.first;
      } else {
        pre_n.next = n.deep_copy();
        pre_n = pre_n.next;
      }
      if (i == this.size - 1) queue.last = pre_n;
      n = n.next;
    }

    queue.size = this.size;
    queue.ms.pre_address = this.ms.pre_address;
  
    return queue;
  }
}

class queueAnimation {
  constructor() {
    let p;
    this.ani = new Animation();
    this.queue_rect = new Rect(350, 30, 240, 50, "QUEUE_CLASS_REF", ["first = NULL", "last = NULL", "size = 0"], "Queue", "top","h");

    p = this.ani.get_point(390, 80);
    this.queue_rect.attach_point(p);
    this.first_ptr_line = new quadraticCurve(p, p, 0);
    this.first_ptr_line.angle_degree = 20;
    this.ani.connect_object(this.first_ptr_line);

    p = this.ani.get_point(470, 80);
    this.queue_rect.attach_point(p);
    this.last_ptr_line = new quadraticCurve(p, p, 0);
    this.last_ptr_line.angle_degree = 20;
    this.ani.connect_object(this.last_ptr_line);
  
    this.queue = new Queue();
    this.ani.draw();
  }


  set_state() {
    let qa = new queueAnimation();
    qa.queue_rect = this.queue_rect;
    qa.first_ptr_line = this.first_ptr_line;
    qa.last_ptr_line = this.last_ptr_line;

    qa.queue = this.queue.deep_copy();
    qa.ani = this.ani.deep_copy();
    this.ani.set_state(qa);
  }

 
  pop() {
    let ani = this.ani,
        queue_rect = this.queue_rect,
        queue = this.queue;
    let qnode, rect, pre_rect;
    let ref, x, y, p, next_node, next_ref;
    let size;

    if (queue.size == 0) {
      $("#elaboration_text").text("queue size is 0. Nothing to pop front");
      return;
    }

    this.ani.set_function_call("pop");
    this.set_state();
    
    qnode = queue.pop();
    next_node = qnode.next;

    this.line_highlight(true, queue.size == 0);

    ani.add_sequence_ani({
      target: qnode.rect,
      text: "Get the first node {}".format_b(qnode.ref),
      prop: {fade_in:true, strokeStyle: 'blue', shadowColor:"#0000FF", shadowBlur:15, step:true, time:1},
    });


    if (next_node != null) {
      p = next_node.right_top_p;
      next_ref = next_node.ref;
    } else { 
      p = this.first_ptr_line.p1;
      next_ref = "NULL";
    }

    
    /* 
      I add additional 1 time here. 
      Here's the interesting fact: when the disconnect_object get called. it change the number of connections.
      Since both first and last line will are pointing to the same object and belong to the same object when queue.size is 0
      after pop(), one of animation property will skip one time frame because the l_or_c.length get changed.
    */
    ani.add_sequence_ani({
      target: this.first_ptr_line,
      text: "Move queue first " + ((queue.size != 0) ? "": "and last ") + "to {}'s next node, which is {}. Decrement the size by one".format_b(qnode.ref, next_ref),
      prop: {p: p, type:"pivot", ani:ani},
      concurrence: queue.size == 0
    });

    if (queue.size == 0) {
      ani.add_sequence_ani({
        target: this.last_ptr_line,
        prop: {p: this.last_ptr_line.p1, type:"pivot", ani:ani},
      });
      ani.add_sequence_ani({pause:1});
    }


    /* set text of queue */
    if (queue.size == 0) {
      ani.add_sequence_ani({
        target: queue_rect,
        prop: {text_fade_in: {text: "last = " + next_ref, index: 1}, time : 1},
        concurrence: true,
      });
    }

    ani.add_sequence_ani({
      target: queue_rect,
      prop: {text_fade_in: {text: "first = " + next_ref, index: 0}, time : 1},
      concurrence: true,
    });
    ani.add_sequence_ani({
      target: queue_rect,
      prop: {text_fade_in: {text: "size = " + queue.size, index: 2}, time : 1, step:true},
    });




    /* rm the rect and its next_line */
    ani.add_sequence_ani({
      target: qnode.rect,
      text: "Done",
      prop: {fade_out: true},
      concurrence: true
    });
    ani.add_sequence_ani({
      target: qnode.next_line,
      prop:{fade_out:true},
    });



   /* move all of other rects to left */
    if (next_node != null) {
      next_node.rect.stop_propagation[qnode.ref] = true;
      next_node.rect.stop_propagation[queue_rect.ref] = true;
      next_node.rect.propagation = true;
      let l = this.first_ptr_line;
      ani.add_sequence_ani({
        target: next_node.rect,
        prop: {p: new Point(0, R_OFFSET_Y)},
      });
    }

    ani.add_sequence_ani({
      pause:1,
      action: {params: {ani:ani, ref: qnode.ref}, func: rm_ani_object},
      rev_action: {params: {ani:ani, obj:qnode.rect, lines: [qnode.next_line]}, func: add_ani_object},
    });

    ani.run_animation();
  }

  push(v) {
    let ani = this.ani,
        queue_rect = this.queue_rect,
        queue = this.queue;
    let qnode, rect, pre_rect;
    let ref, x, y, p, pre_node;
    let size;

    this.ani.set_function_call("push", [v]);
    this.set_state();


    size = this.queue.size;
    pre_node = this.queue.last;
    qnode = queue.push(v);
    
    ref = qnode.ref;


    x = size * (R_WIDTH + R_MARGIN);
    y = R_OFFSET_Y;
    rect = new Rect(x, y, R_WIDTH, R_HEIGHT, ref, ["val = " + v, "next = NULL"], ref, "bottom");
    ani.add_object(rect);
    qnode.set_rect(ani, rect);
    rect.alpha = 0;

    if (pre_node != null) {
      ani.add_sequence_ani({
        target:pre_node.rect,
        text: "Get the last node {}".format_b(pre_node.ref),
        prop: {fade_in:true, strokeStyle: 'blue', shadowColor:"#0000FF", shadowBlur:15, step:true, time:1},
      });
    }

    ani.add_sequence_ani({
      target:rect,
      text: "Make a new queue node {}".format_b(ref),
      prop: {fade_in:true, strokeStyle: 'red', shadowColor:"#FF0000", shadowBlur:15, step:true},
      concurrence:true,
    });

    this.line_highlight(queue.size == 1, true);

    if (pre_node != null) {
     
      ani.add_sequence_ani({
        text: "Set node {}'s next to {}".format_b(pre_node.ref, qnode.ref),
        target: pre_node.next_line,
        prop: {p: qnode.left_top_p, type:"pivot", ani:ani}
      });

      ani.add_sequence_ani({
        target: pre_node.rect,
        prop: {text_fade_in: {text: "next = " + qnode.ref, index:1}, time : 1, step: true}
      });


    }

    p = qnode.right_top_p;
    ani.add_sequence_ani({
      text: "Move last" + ((queue.size == 1) ? " and first": "") + " point to the new node {}. Increment the size by one".format_b(ref),
      target: this.last_ptr_line,
      prop: {p:p, type: "pivot", ani:ani},
      concurrence: queue.size == 1
    });

    if (queue.size == 1) {
      ani.add_sequence_ani({
        target: this.first_ptr_line,
        prop: {p:p, type: "pivot", ani:ani}
      });
      ani.add_sequence_ani({
        target: queue_rect,
        prop: {text_fade_in: {text: "first = " + ref, index: 0}, time : 1},
        concurrence: true,
      });
    }



    /* set the queue into */
    ani.add_sequence_ani({
      target: queue_rect,
      prop: {text_fade_in: {text: "last = " + ref, index: 1}, time : 1},
      concurrence: true,
    });
     ani.add_sequence_ani({
      target: queue_rect,
      prop: {text_fade_in: {text: "size = " + queue.size, index: 2}, time : 1, step:true},
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
      target: qnode.rect,
      prop: {fade_in:true, strokeStyle: '#696969', shadowBlur:0, time:1},
    });  


    ani.run_animation();
  }


  line_highlight(first = true, last = true) {
 
    let lines = [this.first_ptr_line, this.last_ptr_line];
    let highlight;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (i == 0 && first) highlight = true;
      else if (i == 1 && last) highlight = true;
      else highlight = false;

      if (highlight) {
        this.ani.add_sequence_ani({
          target: line,
          prop: {fade_in: true, time: 1, strokeStyle: "blue", lineWidth:2.5},
          concurrence: i == 0,
        });
      } else {
        this.ani.add_sequence_ani({
          target: line,
          prop: {fade_in: true, time: 1, strokeStyle: "black", lineWidth:2},
          concurrence: i == 0,
        });
      }
    }
  }


}
