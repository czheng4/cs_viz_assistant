/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/15/2020
  last modified 12/16/2020

*/

class dfsAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = null;
    this.ending_node = null;
  }

  run_dfs(node_id, node_id2) {
    let g = this.g;
    let n;

    if (node_id == "") {
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

    this.ani.clear_animation();
    for (let key in g.node_map) {
      n = g.node_map[key];
      n.visited = 0;
      n.ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }
    for (let key in g.edge_map) {
      g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }

    this.path = [];
    this.dfs(g.get_node(node_id), null);

    this.ani.add_sequence_ani({
      pause:1,
      text: "Done",
    })
    this.ani.run_animation();
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

  dfs(n, from) {
    let i, rv;
    let to_n, c, e;
    let g = this.g;
    let ani = this.ani;


    this.line_width(from, n);

    ani.add_sequence_ani({ pause: 1, prop: {step:true} });
    if (n.visited == 1) {
      ani.add_sequence_ani({
        prop: {step: true, time: 1},
        text: "Node {} has been visited before. Do nothing".format_b(n.id),
      })
    }

    rv = false;
    
    if (n.visited == 0) {

      ani.add_sequence_ani({
        target: n.ani_circle,
        text: "Mark node {} visited".format_b(n.id),
        prop: {step:true},
      })

      n.visited = 1;
      if (n == this.ending_node) {
        ani.add_sequence_ani({
          text: "Reach the destination node {}. Store the path as DFS() returns true".format_b(this.ending_node.id),
          prop: {step:true, time:1},
        });
        this.path.push(n);
        rv = true;
      }
      if (!rv) {
        for (i = 0; i < n.adj.length; i++) {
          e = n.adj[i];
          to_n = e.n2;
          
          ani.add_sequence_ani({
            target: e.ani_line,
            text: "Call {}. Adjacency list {}".format("{}".format_b("DFS({})".format(to_n.id)), this.hightlight_adj_test(n.adj, i)),
            prop: {fade_in: true, strokeStyle: "red", time : 1},
            concurrence:true,
          });

          ani.add_sequence_ani({ 
            target: n.ani_circle,
            prop: {"walk": {circle: to_n.ani_circle, h_scale : 0}},
          });
          if (this.dfs(to_n, n)) {
            this.path.push(n);
            rv = true;
            ani.add_sequence_ani({
              target: e.ani_line,
              prop: {fade_in: true, strokeStyle: "blue", lineWidth:3, time : 1},
            });
          }
          ani.add_sequence_ani({prop:{step:true, time: 1}});
          if (rv) break;
        }
      }
    }

    let path_text = "";
    if (rv) {
      path_text = BLUE_SPAN;
      if (from != null) path_text += from.id + RIGHT_ARROW;
      for (i = this.path.length - 1; i >= 0; i--) {
        path_text += this.path[i].id;
        if (i != 0) path_text += RIGHT_ARROW;
      }
      path_text += "</span>";
    }
    if (from != null) {

      if (path_text != "") path_text = "Path: " + path_text;
      ani.add_sequence_ani({ 
        target: n.ani_circle,
        text: "Node {} returns to node {}.".format_b(n.id, from.id) +  path_text,
        prop: {"walk": {circle: from.ani_circle, h_scale : 0}},
      });

    }

    this.line_width(n, from);
   
    return rv;
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