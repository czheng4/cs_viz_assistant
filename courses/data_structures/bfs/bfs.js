/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/17/2020
  last modified 12/17/2020

*/


function update_rect_height(dict) {
  let q_rect = dict.q_rect,
      num = dict.num;

  q_rect.height = num * 26;
  q_rect.y = 280 - q_rect.height;
}

function dlist_to_rect_texts(dlist) {
  let texts = [];
  let node = dlist.sentinel.blink;

  while (node != dlist.sentinel) {
    texts.push(node.value.id);
    node = node.blink;
  }
  return texts;
}

class bfsAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = null;
    this.ending_node = null;
    this.q_rect = null;
  }


  make_queue_rect() {
    let g = this.g;
    let x1, d, c;

    x1 = 1000000;
    for (let key in g.node_map) {
      c = g.node_map[key].ani_circle;
      if (x1 > c.x) x1 = c.x;
    }

    d = x1 - 200;
    if (d < 0) {
      for (let key in g.node_map) {
        c = g.node_map[key].ani_circle;
        c.move(-d, 0);
      }
    }
    this.ani.add_object(this.q_rect = new Rect(20, 280, 130, 0, "QUEUE_BFS_REF", [], "Queue", "bottom", "v", {lineWidth: .5}))
  }

  run_bfs(node_id, node_id2) {
    let g = this.g;
    let ani = this.ani;
    let n;


    if (node_id === "") {
      $("#elaboration_text").text("Starting node id is empty");
      return;
    } else if (g.is_node(node_id) == false) {
      $("#elaboration_text").text("");
      $("#elaboration_text").append("Node {} does not exist".format_b(node_id));
      return;
    }

    n = g.get_node(node_id);

    this.ending_node = null;
    if (g.is_node(node_id2)) {
      this.ending_node = g.get_node(node_id2);
    }

    this.make_queue_rect();
    this.ani.clear_animation();
    for (let key in g.node_map) {
      n = g.node_map[key];
      n.distance = -1;
      n.ani_circle.label = -1;
      n.ani_circle.label_font = "12px Arial"
      n.ani_circle.label_padding = 5;
      // n.ani_circle.label_strokeStyle = "red";
      n.ani_circle.label_offset_x = -11;
      n.ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }
    for (let key in g.edge_map) {
      g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }

    this.path = [];

    ani.add_sequence_ani({
      text: "Set all nodes' distance to {}. The distance is shown above the node".format_b("-1"),
      prop: {step: true, time: 1},
    });

    this.bfs(g.get_node(node_id));

    // this.ani.add_sequence_ani({
    //   pause:1,
    //   text: "Done",
    // })
    this.ani.run_animation();
  }


  bfs(n) {
    let ani = this.ani,
        g = this.g,
        q_rect = this.q_rect;
    let queue = new Dlist();
    let e, n2, i, pre_n;
    let size;


    ani.add_sequence_ani({
      text: "Push back the starting node {} into queue. And set its distance to {}".format_b(n.id, "0"),
      pause:1,
    })

    queue.push_back(n);
    n.distance = 0;
    queue.print();
    ani.add_sequence_ani({
      target: q_rect,
      prop: {text: [""], time:1},
      action: {params: {q_rect: q_rect, num: 1}, func: update_rect_height},
      rev_action : {params: {q_rect: q_rect, num: 0}, func: update_rect_height},
      concurrence:true,
    })

    ani.add_sequence_ani({
      target: n.ani_circle,
      prop: {label: {text:0, color: "red"}, fade_in: true, fillStyle:"yellow", lineWidth:4, time:1},
      concurrence: true,
    })

    ani.add_sequence_ani({
      target: q_rect,
      prop: {text_fade_in: {index:0, text: n.id, color: "red"}, step: true},
    })

   
    pre_n = n;
    while (!queue.empty()) {


      n = queue.pop_front();
      if (pre_n != n){
        console.log(123);
        ani.add_sequence_ani({
          target: pre_n.ani_circle,
          prop: {fade_in: true, fillStyle:"pink", lineWidth:1, time:1},
        })
      }
      pre_n = n;

      ani.add_sequence_ani({
        target: n.ani_circle,
        text: "Remove node {} from the front of the queue".format_b(n.id),
        prop: {fade_in: true, fillStyle:"yellow", lineWidth:4, time:1},
        concurrence: true,
      });

      ani.add_sequence_ani({
        target: q_rect,
        prop: {text_fade_out: {index:queue.size, color: "red"}, step: true},
      })

      ani.add_sequence_ani({
        pause: 1,
        action: {params: {q_rect: q_rect, num: queue.size}, func: update_rect_height},
        rev_action: {params: {q_rect: q_rect, num: queue.size + 1}, func: update_rect_height},
      })

      size = 0;

      for (i = 0; i < n.adj.length; i++) {
        e = n.adj[i];
        n2 = e.n2;

        if (n2.distance != -1) continue;
         ani.add_sequence_ani({
          target: e.ani_line,
          prop: {fade_in:true, strokeStyle: "red", lineWidth:3, time:1},
          concurrence: true,
        })
        ani.add_sequence_ani({
          target: n.ani_circle,
          prop: {walk: {circle: n2.ani_circle, h_scale: 0}},
          concurrence: true,
        })
      }

      for (i = 0; i < n.adj.length; i++) {
        e = n.adj[i];
        n2 = e.n2;
        if (n2.distance != -1) continue;
        n2.distance = n.distance + 1;
        ani.add_sequence_ani({
          target: n2.ani_circle,
          prop: {fade_in: true, fillStyle: "pink", label: {color:"red", text: n2.distance}, time:1},
          concurrence: true,
        })
        queue.push_back(n2);
        size++;
      }

      ani.add_sequence_ani({
        target: q_rect,
        prop: {text: dlist_to_rect_texts(queue), time: 1},
        action: {params: {q_rect: q_rect, num: queue.size}, func: update_rect_height},
        rev_action: {params: {q_rect: q_rect, num: queue.size - size}, func: update_rect_height},
      })
      ani.add_sequence_ani({pause:1});
    }




  }


  line_width(from, to) {
    let ani = this.ani;
    let e;
    let g = this.g;

    if (from != null) {
      ani.add_sequence_ani({
        target: from.ani_circle,
        prop: {fade_in: true, fillStyle: "yellow", time : 1, lineWidth:1},
      })
    }
    if (to != null) {
      ani.add_sequence_ani({
        target: to.ani_circle,
        prop: {fade_in: true, fillStyle: "yellow", time : 1, lineWidth:4},
      })
    }
  }



  hightlight_adj_test(adj, index) {
    let i, to;

    let text = "{";
    for (i = 0; i < adj.length; i++) {
      to = adj[i].n2;
      if (i == index) text += "{}".format_b(to.id);
      else text += to.id;
      if (i != adj.length - 1) text += ", ";
    }
    text += "}"
    return text;
  }

}