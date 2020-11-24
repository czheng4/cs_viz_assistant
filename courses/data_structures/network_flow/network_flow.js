/*
  ChaoHui Zheng
  11/22/2020
*/
const BFS_PATH = 0b1;
const DFS_PATH = 0b11;
const DIJKSTRA_PATH = 0b111;
const GREEDY_DFS_PATH = 0b1111;
const ARROW = "&rarr;";

function flow_g_node(id) {
  return "FLOW_GRAPH_" + id;
}

function color_path(dict) {
  let path = dict.path;
  let line, reverse_line;
  for (let i = 0; i < path.length; i++) {
    line = path[i].ani_line;
    reverse_line = path[i].reverse.ani_line;
    if (reverse_line.text === 0) reverse_line.visible = false; 
    line.ctx_prop.lineWidth = 3;
    line.ctx_prop.strokeStyle = "red";
  }

}

function flow_graph_path(dict) {
  let path = dict.path,
      g = dict.g,
      flow = dict.flow;
  let e, line;

  for (let i = 0; i < path.length; i++) {
    e = path[i];
    // console.log(flow_g_node(e.n1.id), flow_g_node(e.n2.id), g);
    // return;
    e = g.get_edge_by_name(flow_g_node(e.n1.id), flow_g_node(e.n2.id), 0, false);
    console.log(e);
    e.weight += flow;
    line = e.ani_line;
    e.ani_line.text = e.weight;
    line.ctx_prop.lineWidth = 3;
    line.ctx_prop.strokeStyle = "red";
  }
}


function update_path_weight(dict) {
  let flow = dict.flow,
      path = dict.path;

  let e, reverse_e;

  for (let i = 0; i < path.length; i++) {
    e = path[i];
    reverse_e = path[i].reverse;

    e.weight -= flow;
    e.ani_line.text = e.weight;
    e.ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    if (e.weight == 0) e.ani_line.visible = false;

    reverse_e.weight += flow;
    reverse_e.ani_line.text = reverse_e.weight;
    reverse_e.ani_line.visible = true;
    reverse_e.ani_line.ctx_prop.lineWidth = 3;
    reverse_e.ani_line.ctx_prop.strokeStyle = "red";
  }
}


class networkFlowAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = null;
    this.find_path_type = null;
    this.source = null;
    this.sink = null;
    this.path = [];
    this.is_flow_graph = false;
    this.max_flow = 0;
  }




  create_flow_graph() {
    let g = this.g;
    let ani = this.ani;
    let d, n;
    let x1, x2, y1, y2, y;
    let margin = 60;
    if (g == null) {
      throw new Error("graph is not created. Error");
    }


    x1 = 100000;
    x2 = -1;
    y1 = 100000;
    y2 = -1;

    for (let key in g.node_map) {
      n = g.node_map[key].ani_circle;
      if (n.x < x1) x1 = n.x;
      if (n.x > x2) x2 = n.x;
      if (n.y < y1) y1 = n.y;
      if (n.y > y2) y2 = n.y;
    }

    d = x2 - x1 + margin * 2;

    ani.add_object(new Text("Flow Graph", x1, y1 - 30 - g.node_radius, x2 - x1, "19px Times New Roman"));
    ani.add_object(new Text("Residual Graph", x1 + d , y1 - 30 - g.node_radius, x2 - x1, "19px Times New Roman"));
    ani.add_object(new quadraticCurve(new Point(x1 + d - margin, y1 - 50), new Point(x1 + d - margin, y2 + 50), 0, 0, false));
    
    for (let key in g.node_map) {
      n = g.node_map[key].ani_circle;
      g.get_node(flow_g_node(n.ref), n.x, n.y, n.ref);
      n.move(d, 0);
      console.log(n);
    }

    console.log(this.ani.obj_map);
    this.ani.draw();

  }

  find_max_flow (g, source, sink, find_path_type) {
    let max_flow, flow;

    this.source = source;
    this.sink = sink;
    this.g = g;
    max_flow = 0;
    
    while (1) {
      flow = this.find_augmenting_path(find_path_type);
      max_flow += flow;
      if (flow == 0) {
        console.log(g.edge_map)
        // g.draw();
        return max_flow;
      }
    }


  }

  find_augmenting_path(find_path_type, manual_path = []) {
    let flow, i;
    let e, from, to, reverse_e;
    let line, from_circle, to_circle;
    let g = this.g;
    let ani = this.ani;
    let path;
    let find_path;
    let path_str;

    for (let key in g.node_map) {
      g.node_map[key].visited = 0;
      g.node_map[key].ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }
    for (let key in g.edge_map) {
      g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }

    this.source = g.get_node("S");
    this.sink = g.get_node("T");
    this.path = [];


    if (find_path_type == "dfs" || find_path_type == "greedy_dfs") {
      find_path = this.DFS(this.source);
    } else if (find_path_type == "bfs") {

    } else if (find_path_type == "dijkstra") {

    }

    if (find_path == false) return 0;

    if (this.is_flow_graph == false) {
      this.create_flow_graph();
      this.is_flow_graph = true;
    }

    path = this.path;

    flow = path[0].weight;

    
    path_str = "T";
    for (i = 0; i < path.length; i++) {
      e = path[i];
      line = e.ani_line;
      if (flow > e.weight) flow = e.weight;
      path_str = e.n1.id + ARROW + path_str;
      
      // ani.add_sequence_ani({
      //   target: line,
      //   prop: {time: 100,  strokeStyle: 'red', lineWidth: 3},
      //   concurrence: true,
      // })
    }

    ani.add_sequence_ani({
      pause: 1,
      text: "Path: {}. Flow: {}".format(path_str, flow),
      action: {params: {path: path}, func: color_path},
      concurrence: true
    });

    ani.add_sequence_ani({
      pause: 1,
      action: {params: {path: path, g:g, flow:flow}, func: flow_graph_path},
      prop: {step: true},
    });


   // ani.add_sequence_ani({pause:1});
   // ani.add_sequence_ani({pause: 1, prop: {step:true}});
   // ani.add_sequence_ani({
   //  pause:1
   // })



    for (i = 0; i < path.length; i++) {
      e = path[i];
      // e.weight -= flow;


      // console.log(e.id + " " + e.weight);
      reverse_e = g.get_edge(e.n2, e.n1, 0, false);

      // reverse_e.weight += flow;

      e.reverse = reverse_e;
      reverse_e.reverse = e;

       console.log(e.ani_line);
      // console.log(path[i].id + " " + path[i].weight);
      // console.log(e.id + " " + e.weight);
    }

    ani.add_sequence_ani({
      pause: 1,
      action: {params: {path: path, flow:flow}, func: update_path_weight},
    });


    ani.run_animation();
    return flow;

   
   




    // if (this.DFS(this.source)) {
    //   path = this.path;
    //   console.log(path)
    //   flow = path[0].weight;
    //   for (i = 0; i < path.length; i++) {
    //     if (flow > path[i].weight) flow = path[i].weight;
    //   }

    //   for (i = 0; i < path.length; i++) {
    //     e = path[i];
    //     e.weight -= flow;

    //     // console.log(e.id + " " + e.weight);
    //     e = g.get_edge(e.n2, e.n1, 0, false);

    //     e.weight += flow;
    //     // console.log(path[i].id + " " + path[i].weight);
    //     // console.log(e.id + " " + e.weight);


    //   }

     
    //   console.log(flow);
    //   return flow;
    // }

    return 0;

  }

  DFS(n) {

    let e, n2;

    if (n == this.sink) return true;
    if (n.visited == 1) return false;
    n.visited = 1;
    for (let i = 0; i < n.adj.length; i++) {
      e = n.adj[i];
      n2 = e.n2;
      if (e.weight > 0 && this.DFS(n2)) {
        this.path.push(e);
        return true;
      } 
    }

    return false;
  }

}