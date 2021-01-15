/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/24/2020
  last modified 12/26/2020
*/
const BFS_PATH = 0b1;
const DFS_PATH = 0b11;
const DIJKSTRA_PATH = 0b111;
const GREEDY_DFS_PATH = 0b1111;

function flow_g_node(id) {
  return "FLOW_GRAPH_" + id;
}
function original_g_node(id) {
  return "ORIGINAL_GRAPH_" + id;
}
/* color the path in both flow and Residual graph */
function color_path(dict) {
  let path = dict.path,
      g = dict.g,
      flow = dict.flow,
      rev_path = dict.rev_path;
  let e, line, reverse_line;

  // Residual Graph
  for (let i = 0; i < path.length; i++) {

    e = path[i];
    line = e.ani_line;
    reverse_line = rev_path[i].ani_line;
    
    line.visible = true;
    if (reverse_line.text === 0) reverse_line.visible = false; 
    else reverse_line.visible = true;

    if (flow > 0) {
      line.ctx_prop.lineWidth = 3;
      line.ctx_prop.strokeStyle = "red";
      e.n1.ani_circle.ctx_prop.fillStyle = "yellow";
      e.n2.ani_circle.ctx_prop.fillStyle = "yellow";

    // reverse process
    } else {
      e.n1.ani_circle.ctx_prop.fillStyle = DEFAULT_CIRCLE_CTX.fillStyle;
      e.n2.ani_circle.ctx_prop.fillStyle = DEFAULT_CIRCLE_CTX.fillStyle;
      line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }
  }

  // Flow Graph
  for (let i = 0; i < path.length; i++) {
    
    e = path[i];
    e = g.get_edge_by_name(flow_g_node(e.n1.id), flow_g_node(e.n2.id), 0, false);
   
    e.weight += flow;
    line = e.ani_line;
    line.text = e.weight;

    if (e.weight === 0) line.visible = false;
    else line.visible = true;
   

    if (flow > 0) {
      line.ctx_prop.lineWidth = 3;
      line.ctx_prop.strokeStyle = "red";
      e.n1.ani_circle.ctx_prop.fillStyle = "yellow";
      e.n2.ani_circle.ctx_prop.fillStyle = "yellow";

    // reverse process
    } else {

      e.n1.ani_circle.ctx_prop.fillStyle = DEFAULT_CIRCLE_CTX.fillStyle;
      e.n2.ani_circle.ctx_prop.fillStyle = DEFAULT_CIRCLE_CTX.fillStyle;
      line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }
  }
}



/* update flow */
function update_path_weight(dict) {
  let flow = dict.flow,
      path = dict.path,
      rev_path = dict.rev_path,
      g = dict.g;

  let e, reverse_e;

  // Residual Graph
  for (let i = 0; i < path.length; i++) {
    e = path[i];
    reverse_e = rev_path[i];

    if (e.n1.id == "S") is_go_back = false; // from node contains source. we got forward.

    e.weight -= flow;
    e.ani_line.text = e.weight;
    e.ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    e.n1.ani_circle.ctx_prop.fillStyle = "yellow";
    e.n2.ani_circle.ctx_prop.fillStyle = "yellow";

    reverse_e.ani_line.visible = true;
    
    if (e.weight === 0) e.ani_line.visible = false;
    else e.ani_line.visible = true;

    reverse_e.weight += flow;
    reverse_e.ani_line.text = reverse_e.weight;
    reverse_e.ani_line.visible = true;
    reverse_e.ani_line.ctx_prop.lineWidth = 3;
    reverse_e.ani_line.ctx_prop.strokeStyle = "red";
  }

}

/* resolve the flow in both directions */
function resolve_flow_graph(dict) {
  let edges = dict.edges,
      rev_edges = dict.rev_edges,
      weights = dict.weights,
      rev_weights = dict.rev_weights,
      reverse = dict.reverse;

  let e, rev_e;
  for (let i = 0; i < edges.length; i++) {
    e = edges[i];
    rev_e = rev_edges[i];

    // resotre to the origranl value before resolving.
    if (reverse) {
      e.weight = weights[i];
      rev_e.weight = rev_weights[i];
    
    /* otherwise resolve it */
    } else {
      if (e.weight > rev_e.weight) {
        e.weight -= rev_e.weight;
        rev_e.weight = 0;
      } else {
        rev_e.weight -= e.weight;
        e.weight = 0;
      }
    }

    e.ani_line.text = e.weight;
    rev_e.ani_line.text = rev_e.weight;

    if (e.weight === 0) e.ani_line.visible = false;
    else e.ani_line.visible = true;

    if (rev_e.weight === 0) rev_e.ani_line.visible = false;
    else rev_e.ani_line.visible = true;


    e.ani_line.ctx_prop.lineWidth = 3;
    e.ani_line.ctx_prop.strokeStyle = "red";
    e.n1.ani_circle.ctx_prop.fillStyle = "yellow";
    e.n2.ani_circle.ctx_prop.fillStyle = "yellow";
    
  }
}

class networkFlowAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = null;
    // this.find_path_type = null;
    this.source = null;
    this.sink = null;
    this.path = [];
    this.is_init_graph = false;
    this.max_flow = 0;
  }

  make_new() {
    $("#run").prop("disabled", false);
    $("#min_cut").prop("disabled", true);

    return new networkFlowAnimation();
  }

  /* create the flow and original graph */
  create_init_graph() {
    let g = this.g;
    let ani = this.ani;
    let n, e, n2;
    let dx, dy;
    let x1, x2, y1, y2, y;
    let text, line;
    let margin = 60;
    let circles = [], edges = [];
    let origin;
    if (g == null) {
      throw new Error("graph is not created. Error");
    }

    g.save_original_graph();

    x1 = 100000;
    x2 = -1;
    y1 = 100000;
    y2 = -1;

    for (let key in g.node_map) {

      n = g.node_map[key].ani_circle;
      circles.push(n);
      if (n.x < x1) x1 = n.x;
      if (n.x > x2) x2 = n.x;
      if (n.y < y1) y1 = n.y;
      if (n.y > y2) y2 = n.y;
    }

    origin = -(x1 + 120);
    dx = x2 - x1 + margin * 2;
    dy = -y1;

    // make canvas bigger if canvas is not wide enough.
    if (3 * dx > canvas.width - 200) set_canvas(3 * dx + 200, 800, 200, 75);


    ani.add_object(new Text("Flow Graph", x1 + origin, -45, x2 - x1, "19px Times New Roman"));
    ani.add_object(new Text("Residual Graph", x1 + dx + origin, -45, x2 - x1, "19px Times New Roman"));
    ani.add_object(new Text("Original Graph", x1 + 2 * dx +origin , -45, x2 - x1, "19px Times New Roman"));

  
    ani.add_object(new quadraticCurve(new Point(x1 + dx - margin + origin, - 50), new Point(x1 + dx - margin + origin, y2 + dy + 50), 0, 0, false));
    ani.add_object(new quadraticCurve(new Point(x1 + 2 * dx - margin + origin, - 50), new Point(x1 + 2 * dx - margin + origin, y2 + dy + 50), 0, 0, false));

    for (let i = 0; i < circles.length; i++) {
      n = circles[i];
      g.get_node(flow_g_node(n.ref), n.x + origin, n.y + dy, n.ref);
      g.get_node(original_g_node(n.ref), n.x + 2 * dx + origin, n.y + dy, n.ref).ani_circle.visible = true;
      n.move(dx + origin, dy);
    }

    // loop through list rather than g.node_map bc we keep adding ele to node_map 
    for (let key in g.edge_map) edges.push(g.edge_map[key]);
    for (let i = 0; i < edges.length; i++) {
      e = edges[i];
      n = g.get_node(original_g_node(e.n1.id));
      n2 = g.get_node(original_g_node(e.n2.id));
      g.get_edge(n, n2, e.weight).ani_line.text_t = e.ani_line.text_t;
    }


    this.ani.draw();

  }

  deep_copy() {
    let net = new networkFlowAnimation();
    net.max_flow = this.max_flow;
    net.is_init_graph = this.is_init_graph;

    net.ani = this.ani.deep_copy();
    net.g = this.g.deep_copy(net.ani);
    
    return net;
  }

  set_state() {
    let state = this.deep_copy();
    this.ani.set_state(state);
  }


  find_min_cut() {
    let g = this.g;
    let text;
    let n, original_n, e;
    let i;
    let reachable_nodes = [], non_reachable_nodes = [];
   
    for (let key in g.node_map) g.node_map[key].visited = 0;
    this.DFS(g.get_node("S"));

    // color the reachable nodes pink and non-rechable nodes lightblue in both Residual and origranl graph.
    for (let key in g.node_map) {
      n = g.node_map[key];
      if (n.id.indexOf("FLOW_GRAPH_") == -1 && n.id.indexOf("ORIGINAL_GRAPH_") == -1) {
        original_n = g.get_node(original_g_node(n.id));

        if (n.visited == 1) {
          reachable_nodes.push(n.id);
          n.ani_circle.ctx_prop.fillStyle = "pink";
          original_n.ani_circle.ctx_prop.fillStyle = "pink";
          original_n.visited = 1;
          for (i = 0; i < n.adj.length; i++) {
            n.adj[i].ani_line.ctx_prop.strokeStyle = "red";
            n.adj[i].ani_line.ctx_prop.lineWidth = 3;
          }
        } else {
          non_reachable_nodes.push(n.id);
          n.ani_circle.ctx_prop.fillStyle = "lightblue";
          original_n.ani_circle.ctx_prop.fillStyle = "lightblue";
          original_n.visited = 0;
          for (i = 0; i < n.adj.length; i++) {
            n.adj[i].ani_line.ctx_prop.strokeStyle = "black";
            n.adj[i].ani_line.ctx_prop.lineWidth = 2;
          }
        }
      }
    }

    // get text for non-rechable and rechable nodes.
    text = '<span style = "color:red">Pink Set</span><span style = "color:black"> \
            denotes a set of reachable nodes from SOURCE that are colored in red. \
            They are </span><span style = "color:red">{ ';
    for (i = 0; i < reachable_nodes.length; i++) {
      if (i != 0) text += ", ";
      text += reachable_nodes[i];
    }
    text += " }</span>";

    text += NEW_LINE + '<span style = "color:blue">Lightblue Set </span> \
            <span style = "color:black">denotes a set of non-reachable nodes from SOURCE are colored in lightblue. \
            They are </span><span style = "color:blue">{ ';
    for (i = 0; i < non_reachable_nodes.length; i++) {
      if (i != 0) text += ", ";
      text += non_reachable_nodes[i];
    }
    text += " }</span>";

    // the minimum cut is composes of a set of edges from reachable nodes of "S" to unreachable nodes.
    // we color these edges red.
    text += NEW_LINE + RED_SPAN + "Minimum Cut is composed of any edges from Pink Set to Lightblue Set in Original Graph: ";
    for (let key in g.node_map) {
      original_n = g.node_map[key];

      if (original_n.id.indexOf("ORIGINAL_GRAPH_") != -1 && original_n.visited == 1) {
        for (i = 0; i < original_n.adj.length; i++) {
          e = original_n.adj[i];
          if (e.weight > 0 && e.n2.visited == 0) {
            text += "( {} ) ".format(e.pretty_edge().replace(/ORIGINAL_GRAPH_/g, ""));
            e.ani_line.ctx_prop.lineWidth = 3;
            e.ani_line.ctx_prop.strokeStyle = "red";
          }
        }
      }
    }
    text += "</span>";

    $("#elaboration_text").text("");
    $("#elaboration_text").append(text);
    this.ani.write_script([text], 0);
    this.ani.draw();
  }


  find_augmenting_path(find_path_type, manual_path = "") {
    let flow, i;
    let e, from, to, reverse_e;
    let line, from_circle, to_circle;
    let g = this.g;
    let ani = this.ani;
    let path;
    let find_path;
    let path_str, rev_path, rev_path_str;

    for (let key in g.node_map) {
      g.node_map[key].visited = 0;
      g.node_map[key].ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }
    for (let key in g.edge_map) {
      g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }

    
    if (g.is_node("S") == false || g.is_node("T") == false) {
      elaboration_append("Must have {} and {} nodes".format_b("S", "T"));
      return;
    }

    this.source = g.get_node("S");
    this.sink = g.get_node("T");

    if (this.is_init_graph == false) {
     
      this.path = [];
      find_path = this.DFS(this.source);
      if (find_path == false) {
        $("#elaboration_text").text("");
        $("#elaboration_text").append("Can't find any path from {} to {}".format_b("S", "T"));
        return 0;
      }

      for (let key in g.node_map) {
        g.node_map[key].visited = 0;
      }

      this.create_init_graph();
      this.is_init_graph = true;
      
    }
    this.set_state();
    ani.set_function_call("find_augmenting_path", [find_path_type, manual_path]);


    


    this.path = [];

    if (find_path_type == "dfs") {
      find_path = this.DFS(this.source);
    } else if (find_path_type == "greedy_dfs") {
      find_path = this.greedy_DFS(this.source);
    } else if (find_path_type == "bfs") {
      find_path = this.BFS();
    } else if (find_path_type == "dijkstra") {
      find_path = this.modified_dijkstra();
    } else if (find_path_type == "manual") {
      find_path = this.manual_path(manual_path);
      // if (find_path == false) return 0;
    }


    

    if (find_path == false) {
      $("#elaboration_text").text("");
      $("#elaboration_text").append("Can't find any path from {} to {}".format_b("S", "T"));
      // $("#min_cut").prop("disabled", false);
      return 0;
    }

    
    // console.log(this.path, find_path)
    path = this.path;
    flow = path[0].weight;

    path_str = "T";
    rev_path_str = "T";

    // find flow
    for (i = 0; i < path.length; i++) {
      e = path[i];
      if (flow > e.weight) flow = e.weight;

      path_str = e.n1.id + RIGHT_ARROW + path_str;
      rev_path_str = rev_path_str + RIGHT_ARROW + e.n1.id;
    }

    // flow = parseFloat(flow);
    rev_path = [];

    // compute reverse path
    for (i = 0; i < path.length; i++) {
      e = path[i];
      reverse_e = g.get_edge(e.n2, e.n1, 0, false);
      if (reverse_e.weight == 0) reverse_e.ani_line.visible = false;
      rev_path.push(reverse_e);
      e.weight -= flow;
      reverse_e.weight += flow;
    }

    for (let key in g.node_map) g.node_map[key].visited = 0;
    find_path = this.DFS(this.source, false);
    
    // change the weight back
    for (i = 0; i < path.length; i++) {
      e = path[i];
      reverse_e = g.get_edge(e.n2, e.n1, 0, false);
      e.weight += flow;
      reverse_e.weight -= flow;
    }

    this.max_flow += parseFloat(flow);

    // color the path in both Residual Graph and Flow Graph
    ani.add_sequence_ani({
      pause: 1,
      text: "Path: {}{}</span>. Flow: {}. &emsp; &emsp; Total Flow: {} + {} = {}".format(BLUE_SPAN, path_str, flow, this.max_flow - flow, flow, this.max_flow),
      action: {params: {path: path, g:g, flow:flow, rev_path: rev_path}, func: color_path},
      rev_action: {params: {path: path, g:g, flow: -flow, rev_path: rev_path}, func: color_path}
    });

    // pause
    ani.add_sequence_ani({
      prop: {step: true, time: ANIMATION_TIME * 2},
    });    

    // update the flow
    ani.add_sequence_ani({
      pause: 1,
      text: "Process Residual Graph. Subtract flow {} from path {}{}</span>, and add it to reverse path {}{}</span>. Total Flow: {} + {} = {}".format(flow, BLUE_SPAN, path_str, BLUE_SPAN, rev_path_str, this.max_flow - flow, flow, this.max_flow),
      action: {params: {path: path, flow:flow, rev_path: rev_path, g:g}, func: update_path_weight},
      rev_action: {params: {path: rev_path, rev_path: path, flow:flow, g:g}, func: update_path_weight},
      concurrence: true,
    });


    // resolve the flow graph. There's a chance we have flow in both directions. We need to resolve it.
    let edges = [], rev_edges = [], weights = [], rev_weights = [];
    for (let i = 0; i < path.length; i++) {
    
      e = path[i];
      reverse_e = g.get_edge_by_name(flow_g_node(e.n2.id), flow_g_node(e.n1.id), 0, false);
      e = g.get_edge_by_name(flow_g_node(e.n1.id), flow_g_node(e.n2.id), 0, false);

      if (e.weight == 0) e.ani_line.visible = false;
      if (reverse_e.weight == 0) reverse_e.ani_line.visible = false;

      edges.push(e);
      rev_edges.push(reverse_e);
      weights.push(e.weight + flow);
      rev_weights.push(reverse_e.weight);

    }
    ani.add_sequence_ani({
      pause: 1,
      action: {params: {reverse: false, edges: edges, rev_edges: rev_edges, weights: weights, rev_weights: rev_weights}, func: resolve_flow_graph},
      rev_action: {params: {reverse: true, edges: edges, rev_edges: rev_edges, weights: weights, rev_weights: rev_weights}, func: resolve_flow_graph},
      prop: {step: !find_path},
    });

    // pause 
    ani.add_sequence_ani({
      pause: ANIMATION_TIME
    });

    if (find_path == false) {
      ani.add_sequence_ani({
        pause:1,
        text: "Done. Can't find any path from S to T. Total Flow: {}".format(this.max_flow),
        rev_action: {params: {g: this.g, rev_path: rev_path, path:path}, func: (dict) => {
          // restore the flow graph and Residual graph ater perfoming minimum cut.
          let g = dict.g;
          let e, n, n2;
          for (let key in g.node_map) {
            g.node_map[key].ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
          }
          for (let key in g.edge_map) {
            g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
          }

          for (let i = 0; i < rev_path.length; i++) {
            rev_path[i].n1.ani_circle.ctx_prop.fillStyle = "yellow";
            rev_path[i].n2.ani_circle.ctx_prop.fillStyle = "yellow";

            rev_path[i].ani_line.ctx_prop.strokeStyle = "red";
            rev_path[i].ani_line.ctx_prop.lineWidth = 3;
          }

          for (let i = 0; i < path.length; i++) {
            e = path[i];
            n = g.get_node(flow_g_node(e.n1.id));
            n2 = g.get_node(flow_g_node(e.n2.id));
            e = g.get_edge(n, n2, 0, false);
            n.ani_circle.ctx_prop.fillStyle = "yellow";
            n2.ani_circle.ctx_prop.fillStyle = "yellow";

            e.ani_line.ctx_prop.strokeStyle = "red";
            e.ani_line.ctx_prop.lineWidth = 3;
          }
        }}
      })
    }

    if (find_path == false) ani.run_animation(() => {
      $("#min_cut").prop("disabled", false);
      $("#run").prop("disabled", true);
    });
    else ani.run_animation();
  
    return flow;
  }

  /* manual enter path */
  manual_path(path_str) {
    let str = path_str;
    let from, to, e;
    let g = this.g;
    str = str.trim();
    str = str.split(" ");

    // console.log(str);
    if (str.length < 2 || str[0] != "S" || str[str.length - 1] != "T") {
      $("#elaboration_text").text("Invalid path {}".format(path_str));
      return false;
    }

    for (let i = str.length - 2; i >= 0; i--) {
      from = g.get_node(str[i]);
      to = g.get_node(str[i + 1]);
      if (from == null) {
        $("#elaboration_text").text("Invalid node {}".format(str[i]));
        return false;
      } else if (to == null) {
        $("#elaboration_text").text("Invalid node {}".format(str[i + 1]));
        return false;
      } else if (g.is_edge(from, to) == false) {
        $("#elaboration_text").text("");
        $("#elaboration_text").append("{}{}{} is not a valid edge".format(str[i], RIGHT_ARROW, str[i + 1]));
        return false;
      } else {
        e = g.get_edge(from, to, 0, false);

        if (e.weight <= 0) {
          $("#elaboration_text").append("Edge {}{}{} has a invalid weight {}".format(str[i], RIGHT_ARROW, str[i + 1], e.weight));
          return false;
        } else this.path.push(e);
       
      }
    }

    return true;
  }

  /* search algorithm greedy_DFS, DFS, BFS, modified Dijkstra */

  modified_dijkstra() {

    let i, flow, e, n, n2, f;

    // here's how it is. Javascript don't have build-in map. May revisit this if 
    // we implement a map.
    let map = []; 

    for (let key in this.g.node_map) {
      this.g.node_map[key].best_flow = 0;
    }

    this.source.best_flow = Number.MAX_SAFE_INTEGER;
    this.source.key =  Number.MAX_SAFE_INTEGER;
    map.push(this.source);

    // console.log(map);
    while (map.length != 0) {

      map.sort(function(a,b) {return a.key - b.key; });  // This's not efficient but fast enough for Animation.
      n = map[map.length - 1];
      f = n.key;
      map.pop();

      // process this node before, skip it.
      if (n.visited == 1) continue;

      n.visited = 1;

      if (n == this.sink) {
        while (n != this.source) {
          this.path.push(n.backedge);
          n = n.backedge.n1;
        }
        return true;
      }

      for (i = 0; i < n.adj.length; i++) {
        e = n.adj[i];
        n2 = e.n2;

        /* find the largest possible flow to "to" node */
        flow = (e.weight > f) ? f : e.weight;
        if (flow > n2.best_flow) {
          n2.best_flow = flow;
          n2.backedge = e;
          n2.key = flow;
          map.push(n2);
        }
      }

    }

    return false;


  }

  BFS() {
    let q, n, e, n2;
    q = new Dlist();
    q.push_back(this.source);

    this.source.visited = 1;
    while (!q.empty()) {
      n = q.first();
      q.pop_front();

      if (n == this.sink) {
        while (n != this.source) {
          this.path.push(n.backedge);
          n = n.backedge.n1;
        }
        return true;
      }

      for (let i = 0; i < n.adj.length; i++) {
        e = n.adj[i];
        n2 = e.n2;
        if(e.weight > 0 && n2.visited == 0) {
          n2.backedge = e;
          n2.visited = 1;
          q.push_back(n2);
        }
      }
    }

    return false;

  }

  greedy_DFS(n) {
    let e, n2;
    let adj;
    if (n == this.sink) return true;
    if (n.visited == 1) return false;
    n.visited = 1;

    /* we don't sort on the original list. 
       BC we still wanna keep the same order in the original list.
    */

    adj = []; 
    for (let i = 0; i < n.adj.length; i++) adj.push(n.adj[i]);
    adj.sort(function(a,b) {return -(a.weight - b.weight); });

    for (let i = 0; i < adj.length; i++) {
      e = adj[i];
      n2 = e.n2;
      if (e.weight > 0 && this.DFS(n2)) {
        this.path.push(e);
        return true;
      } 
    }

    return false;
  }

  DFS(n, store_path = true) {

    let e, n2;

    if (n == this.sink) return true;
    if (n.visited == 1) return false;
    n.visited = 1;
    for (let i = 0; i < n.adj.length; i++) {
      e = n.adj[i];
      n2 = e.n2;
      if (e.weight > 0 && this.DFS(n2, store_path)) {
        if (store_path) this.path.push(e);
        return true;
      } 
    }

    return false;
  }

}