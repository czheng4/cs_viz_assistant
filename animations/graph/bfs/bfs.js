/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/17/2020
  last modified 12/26/2020

*/
"use strict";
function update_rect_height(dict) {
  let q_rect = dict.q_rect,
      num = dict.num;
  q_rect.height = num * 26;
  q_rect.y = 250 - q_rect.height;
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
    this.ani.add_object(this.q_rect = new Rect(20, 250, 130, 0, "QUEUE_BFS_REF", [], "Queue", "bottom", "v", {lineWidth: .5}));
    for (let i = 0; i < 20; i++) {
      this.q_rect.fillStyles.push("");
    }
  }
  make_new() {
    return new bfsAnimation();
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
    if (this.ending_node != null && n == this.ending_node) {
      $("#elaboration_text").text("Please enter different node ids for starting node and ending node");
      return;
    }
    
    
    this.ani.clear_animation();
    for (let key in g.node_map) {
      n = g.node_map[key];
      n.distance = -1;
      n.backedge = null;
      n.ani_circle.label = -1;
      n.ani_circle.label_font = "12px Arial";
      n.ani_circle.label_padding = 5;
      // n.ani_circle.label_strokeStyle = "red";
      n.ani_circle.label_offset_x = -11;
      n.ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }
    for (let key in g.edge_map) {
      g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }

    g.save_original_graph();
    if (this.q_rect == null) this.make_queue_rect();
    
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
    let visited_text, unvisited_text, text;

    queue.push_back(n);
    n.distance = 0;

    ani.add_sequence_ani({
      target: q_rect,
      text: "Push back the starting node {} into queue. And set its distance to {}".format_b(n.id, "0"),
      prop: {text: [""], time:1},
      action: {params: {q_rect: q_rect, num: 1}, func: update_rect_height},
      rev_action : {params: {q_rect: q_rect, num: 0}, func: update_rect_height},
      concurrence:true,
    });

    ani.add_sequence_ani({
      target: n.ani_circle,
      prop: {label: {text:0, color: "red"}, fade_in: true, fillStyle:"yellow", lineWidth:4, time:1},
    });

    ani.add_sequence_ani({
      target:q_rect,
      prop: {fade_in: true, fillStyle: this.make_fillstyles(1, 0, 1), time:1}
    });

    ani.add_sequence_ani({
      target: q_rect,
      prop: {text_fade_in: {index:0, text: n.id}, step: true},
    });

   
    pre_n = n;
    while (!queue.empty()) {


      n = queue.pop_front();
      if (pre_n != n){
        ani.add_sequence_ani({
          target: pre_n.ani_circle,
          prop: {fade_in: true, fillStyle:"pink", lineWidth:1, time:1},
        });
      }
      pre_n = n;

      ani.add_sequence_ani({
        target: n.ani_circle,
        text: "Remove node {} from the front of the queue".format_b(n.id),
        prop: {fade_in: true, fillStyle:"yellow", lineWidth:4, time:1},
        concurrence: true,
      });


      ani.add_sequence_ani({
        target:q_rect,
        prop: {fade_in: true, fillStyle: this.make_fillstyles(queue.size + 1, queue.size, queue.size + 1), time:1},
      });

    
      ani.add_sequence_ani({
        target: q_rect,
        prop: {text_fade_out: {index:queue.size}}
      });
    
      ani.add_sequence_ani({
        target: q_rect,
        prop: {fade_in: true, text: dlist_to_rect_texts(queue), fillStyle: this.make_fillstyles(queue.size, 0,0), time: 1},
        action: {params: {q_rect: q_rect, num: queue.size}, func: update_rect_height},
        rev_action: {params: {q_rect: q_rect, num: queue.size + 1}, func: update_rect_height}
      });


      ani.add_sequence_ani({prop:{step:true, time:1}});

      size = 0;
      visited_text = this.hightlight_adj_text(n.adj, true);
      unvisited_text = this.hightlight_adj_text(n.adj, false);

      /* color adj edges and "to" nodes 
         walk animation from "From" node to "to" node */
      for (i = 0; i < n.adj.length; i++) {
        e = n.adj[i];
        n2 = e.n2;

        if (n2.distance != -1) {
          ani.add_sequence_ani({
            target: e.ani_line,
            prop: {fade_in:true, strokeStyle: "red", lineWidth:3, time:1},
            concurrence: true,
          });
          continue;
        }
        n2.distance = n.distance + 1;
        n2.backedge = e;
        queue.push_back(n2);
        size++;

        ani.add_sequence_ani({
          target: e.ani_line,
          prop: {fade_in:true, strokeStyle: "red", lineWidth:3, time:1},
          concurrence: true,
        });
        ani.add_sequence_ani({
          target: n.ani_circle,
          prop: {walk: {circle: n2.ani_circle, h_scale: 0}},
          concurrence: true,
        });

        ani.add_sequence_ani({
          target: n2.ani_circle,
          prop: {fade_in: true, fillStyle: "pink", label: {color:"red", text: n2.distance}, time:1},
          concurrence: true,
        });

       
        if (n2 == this.ending_node) {

          ani.add_sequence_ani({pause:1});
          if (n2.backedge != null) {
            ani.add_sequence_ani({
              text: "Reach the ending node {}. Now we traverse back through the backedge".format_b(this.ending_node.id),
              target: n2.ani_circle,
              prop: {fade_in:true, fillStyle:"lightblue", time:1, step:true},
            });
          }
          
          while (n2.backedge != null) {
            if (n2 == this.ending_node) text = "{}".format_b(n2.backedge.n1.id + " " + RIGHT_ARROW + " " + n2.id);
            else text = "{}".format_b(n2.backedge.n1.id + " " + RIGHT_ARROW + " ") + text;

            ani.add_sequence_ani({
              text: "Path: " + text,
              target: n2.backedge.ani_line,
              prop: {fade_in: true, strokeStyle: "blue", lineWidth:3, time : 1},
            });
           
            ani.add_sequence_ani({
              target: n2.ani_circle,
              prop: {walk: {circle: n2.backedge.n1.ani_circle, h_scale: 0}},
            })

            ani.add_sequence_ani({
              target: n2.backedge.n1.ani_circle,
              prop: {fade_in: true, fillStyle: "lightblue", time: 1, step:true},
            });
            n2 = n2.backedge.n1;
          }
          return true;
        }



      }


      text = "";
      if (unvisited_text != "") {
        text = "Push back unvisited adjacent nodes {} into queue, update their distance to {}, and set corresponding backedge. ".format_b(unvisited_text, n.distance + 1);
      }

      if (visited_text != "") {
        text += "Do nothing for visited adjacent nodes {}".format_b(visited_text);
      }

      if (text == "") {
        text = "Node {} has no adjacent nodes. Do nothing".format_b(n.id);
      }

      /* update the rect */
      ani.add_sequence_ani({
        text: text,
        pause:ANIMATION_TIME
      });
      ani.add_sequence_ani({
        target: q_rect,
        prop: {text: dlist_to_rect_texts(queue), time: 1},
        action: {params: {q_rect: q_rect, num: queue.size}, func: update_rect_height},
        rev_action: {params: {q_rect: q_rect, num: queue.size - size}, func: update_rect_height}
      });

      ani.add_sequence_ani({
        target:q_rect,
        prop: {fade_in: true, fillStyle: this.make_fillstyles(queue.size, 0, size), time:1},
      });

      /* fade in effect for push back nodes */
      for (i = 0; i < size; i++) {
        ani.add_sequence_ani({
          target: q_rect,
          prop: {text_fade_in: {index:i}},
          concurrence: i != size - 1
        });
      }

      

      ani.add_sequence_ani({
        pause:1,
        prop: {step: true}
      });

      ani.add_sequence_ani({pause:1});
    }




  }

  make_fillstyles(size, start, end) {
    let i;
    let fillStyle = [];
    for (i = 0; i < size; i++) {
      if (i >= start && i < end) fillStyle.push("lightblue");
      else fillStyle.push(BACKGROUND_COLOR);
    }
    return fillStyle;
  }

  hightlight_adj_text(adj, visited = false) {
    let i, to;
    let text = BLUE_SPAN + "{";
    for (i = 0; i < adj.length; i++) {
      to = adj[i].n2;
      if (visited == false && to.distance == -1) {
        text += "{}".format_b(to.id);
        text += ", ";
      } else if (visited == true && to.distance != -1) {
        text += "{}".format_b(to.id);
        text += ", ";
      }
    }

    if (text[text.length - 1] == '{') return "";
    else text = text.slice(0, -2);
    
    text += "}</span>";
    return text;
  }

}