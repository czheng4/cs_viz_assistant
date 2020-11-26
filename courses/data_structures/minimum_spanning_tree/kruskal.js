/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/25/2020
*/

/* disjoint set by rank */
class disjointSet {
  constructor() {
    this.heights = [];
    this.links = [];
    this.num_components = 0;
  }
  init(num_elements) {

    this.num_components = num_elements;
    for (let i = 0; i < num_elements; i++) {
      this.links.push(-1);
      this.heights.push(1);
    }
  }

  union(id1, id2) {
    let heights = this.heights,
        links = this.links;

    let parent, child, parent_n, child_n;
    
    if (links[id1] != -1 || links[id2] != -1) {
      console.log("{} or {} is not set id".format(id1, id2));
    }

    if (heights[id1] > heights[id2]) {
      parent = id1;
      child = id2;
    } else {
      parent = id2;
      child = id1;
    }

    links[child] = parent;
    if (heights[child] == heights[parent]) heights[parent]++;

    this.num_components--;
    return parent;
  }

  find(id) {
    let links = this.links;
    let q = [];
    while (links[id] != -1) {
      q.push(id);
      id = links[id];
    }
    for (let i = 0; i < q.length; i++) links[q[i]] = id;
    return id;
  }
    

}

function init_graph_node(id) {
  return "INIT_GRAPH_" + id;
}

class kruskalAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = null;
    this.sorted_edges = null;
    this.edge_ptr = null;
    this.edge_rect = null;
    this.node_id_to_ds_id = {};
    this.ds = new disjointSet();
    this.init = false;
    this.num_elements = 0;
  }

  /* create init graph and init disjoint set */
  create_init_graph() {
    let g = this.g;
    let ani = this.ani;
    let x1, x2, y1, y2;
    let n, d, nodes;
    let c;
    let margin = 60;
    let rect_width;
      
    x1 = 100000;
    x2 = -1;
    y1 = 100000;
    y2 = -1;

    nodes = [];
    let count = 0;
    this.node_id_to_ds_id = {};
    for (let key in g.node_map) {
      n = g.node_map[key].ani_circle;
      nodes.push(n);
      
      this.node_id_to_ds_id[g.node_map[key].id] = count;
      count++;

      if (n.x < x1) x1 = n.x;
      if (n.x > x2) x2 = n.x;
      if (n.y < y1) y1 = n.y;
      if (n.y > y2) y2 = n.y;
    }
    this.num_elements = count;
    this.ds = new disjointSet();
    this.ds.init(count);

    rect_width = x1 > 0 ? 50 : -x1 + 50;
    d = x2 - x1 + margin * 2 + rect_width;

    if (x1 + 2 * d > canvas.width) set_canvas(x1 + 2 * d, 800, 200, 75);
    
    ani.add_object(new Text("Current State", x1 + rect_width, y1 - 30 - g.node_radius, x2 - x1, "19px Times New Roman"));
    ani.add_object(new Text("Original Graph", x1 + d , y1 - 30 - g.node_radius, x2 - x1, "19px Times New Roman"));
    ani.add_object(new quadraticCurve(new Point(x1 + d - margin, y1 - 50), new Point(x1 + d - margin, y2 + 50), 0, 0, false));

    console.log(ani.obj_map);
    for (let i = 0; i < nodes.length; i++) {
      n = nodes[i];
      g.get_node(init_graph_node(n.ref), n.x + rect_width, n.y, n.ref);
      n.move(d, 0);
    }

    this.ani.draw();
  }
 
  sort_edges() {
    let g = this.g;
    let texts = [];
    let sorted_edges = [];
    let e;
    let ani = this.ani;
    

    for (let key in g.edge_map) {
      sorted_edges.push(g.edge_map[key]);
    }

    sorted_edges.sort(function(a, b) {return a.weight - b.weight; });

    for (let i = 0; i < sorted_edges.length; i++) {
      e = sorted_edges[i];
      texts.push("[ {} -- {} ] : {}".format(e.n1.id, e.n2.id, e.weight));
    }

    ani.add_object(this.edge_rect = new Rect(-180, 0, 130, sorted_edges.length * 26, "SORTED_EDGES_REF", texts, "Sorted Edges", "top", "v", {lineWidth: .5}));
    ani.add_object(this.edge_ptr = new quadraticCurve(new Point(0, 13), new Point(-50, 13), 0, 0, true))
    this.edge_ptr.angle_length = 10;
    this.edge_ptr.ctx_prop.strokeStyle = "red";
    this.edge_ptr.ctx_prop.lineWidth = 2.5;
    
    this.sorted_edges = sorted_edges;
    ani.draw();
  }

  clear() {
    this.edge_ptr.p1 = new Point(0, 13);
    this.edge_ptr.p2 = new Point(-50, 13);
    for (let i = 0; i < this.edge_rect.fillStyles.length; i++)
      this.edge_rect.fillStyles[i] = "#DDDDDD";
    this.ds = new disjointSet();
    this.ds.init(this.num_elements);
  }

  make_new() {
    return new kruskalAnimation();
  }
  run() {

    if (this.init == false) {
      this.create_init_graph();
      this.sort_edges();
      this.init = true;
    } else this.clear();
   
    let sorted_edges = this.sorted_edges,
        map = this.node_id_to_ds_id,
        ds = this.ds,
        g = this.g,
        ani = this.ani;

    let e, tmp_e, id1, id2, n1, n2;
    let sum;
    let line, pre_line;


    let enable_visibility = function(line) {line.visible = true; };
    let disable_visibility = function(line) {line.visible = false; };
    let color_edge_text = function(d) {
      d.obj.fillStyles[d.index1] = "yellow";
      d.obj.fillStyles[d.index2] = "#DDDDDD";
    };
    let color_line = function(d) {
      if (d.b_line != null) d.b_line.ctx_prop.strokeStyle = "black";
      if (d.r_line != null) d.r_line.ctx_prop.strokeStyle = "red";
    };

    ani.clear_animation();

    this.edge_rect.fillStyles[0] = "yellow";
    ani.add_sequence_ani({
      pause:1, 
      prop: {step: true},
      text: "We sort edges in ascending order (in the left) and process them in order." + NEW_LINE + 
            "We connect any edges that will decrement the number of components until it gets 1" + NEW_LINE +
            "Number of Components: " + ds.num_components
    });

    sum = 0;
    pre_line = null;
    for (let i = 0; i < sorted_edges.length; i++) {
      e = sorted_edges[i];
      id1 = map[e.n1.id];
      id2 = map[e.n2.id];

      id1 = ds.find(id1);
      id2 = ds.find(id2);

      // move edge pointer down one.
      if (i != 0) {
        ani.add_sequence_ani({
          pause:1,
          action: {params: {index1:i, index2: i - 1, obj: this.edge_rect}, func: color_edge_text},
          rev_action: {params: {index1:i - 1, index2: i, obj: this.edge_rect}, func: color_edge_text},
        })
      
        ani.add_sequence_ani({
          target: this.edge_ptr,
          prop: {p: new Point(0, 26), type : "parallel"}
        })
      }

      if (id1 != id2) {

        n1 = g.get_node(init_graph_node(e.n1.id));
        n2 = g.get_node(init_graph_node(e.n2.id));
        tmp_e = g.get_edge(n1, n2, e.weight);
        line = tmp_e.ani_line;

        sum += e.weight;
        ds.union(id1, id2);

        // line.ctx_prop.strokeStyle = "red";
        line.ctx_prop.lineWidth = 3;
        line.visible = false;


        ani.add_sequence_ani({
          pause:1,
          text: "Connect edge {} {} {}. Number of Component: {}".format(e.n1.id, "&harr;",e.n2.id, ds.num_components),
          action: {params: line, func: enable_visibility},
          rev_action: {params: line, func:disable_visibility},
          prop: {step: true},
          concurrence:true,
        })

        ani.add_sequence_ani({
          pause:1,
          action: {params: {r_line: line, b_line: pre_line}, func: color_line},
          rev_action: {params: {r_line: pre_line, b_line: line}, func:color_line}
        })


        pre_line = line;
        if (ds.num_components == 1) {
          ani.add_sequence_ani({
            pause: ANIMATION_TIME / 5,
            text: "Done. The sum of the weights of connected edges is {}".format(sum),
          });
          break;
        }

      } else {
        ani.add_sequence_ani({
          pause: ANIMATION_TIME,
          text: "{} and {} are in the same components. We skip it".format(e.n1.id, e.n2.id),
          prop : {step: true}
        })
      }
    }

    ani.run_animation();

  }
}