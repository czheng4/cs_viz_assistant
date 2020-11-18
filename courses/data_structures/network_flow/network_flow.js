
const BFS_PATH = 0b1;
const DFS_PATH = 0b11;
const DIJKSTRA_PATH = 0b111;
const GREEDY_DFS_PATH = 0b1111;

class networkFlowAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = null;
    this.find_path_type = null;
    this.source = null;
    this.sink = null;
    this.path = [];
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

  find_augmenting_path(find_path_type) {
    let flow, i;
    let e;
    let g = this.g;
    let path;

    for (let key in g.node_map) {
      g.node_map[key].visited = 0;
    }

    this.path = [];
    if (this.DFS(this.source)) {
      path = this.path;
      console.log(path)
      flow = path[0].weight;
      for (i = 0; i < path.length; i++) {
        if (flow > path[i].weight) flow = path[i].weight;
      }

      for (i = 0; i < path.length; i++) {
        e = path[i];
        e.weight -= flow;

        // console.log(e.id + " " + e.weight);
        e = g.get_edge(e.n2, e.n1, 0, false);

        e.weight += flow;
        // console.log(path[i].id + " " + path[i].weight);
        // console.log(e.id + " " + e.weight);


      }

     
      console.log(flow);
      return flow;
    }

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