/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/27/2020
  last modified 12/18/2020
*/

const HIGHLIGHT_LINE = {lineWidth: 3, strokeStyle: "red"};

function init_graph_node(id) {
  return "INIT_GRAPH_" + id;
}
function compare(edge1, edge2) {
  return (edge1.key - edge2.key < 0)? false :  true;
}
function set_node_color(dict) {
  let nodes = dict.nodes;
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].ani_circle.ctx_prop.fillStyle = dict.color;
  }
}
function set_line_color(dict) {
  dict.line.ctx_prop = deep_copy(dict.ctx_prop);
}

function line_visibility(dict) {
  dict.line.visible = dict.visible;
}
function update_rect_text(dict) {
  let map_rect = dict.map_rect,
      texts = dict.texts;

  map_rect.text = deep_copy(texts);
  map_rect.height = texts.length * 26;
  
}
function set_color(dict) {
  if (dict.reverse) dict.map_rect.text_color = dict.map_rect.tmp_text_color;
  else {
    dict.map_rect.tmp_text_color = dict.map_rect.text_color;
    dict.map_rect.text_color = {};
  }
}


function highlight(text) {
  return "<span style = \"color:blue; font-weight:bold\">[ " + text + " ]</span>";
}
function edge_pos_in_map(dlist, edge) {

  let node = dlist.sentinel.flink;
  let i = 0;
   while (node != dlist.sentinel) {
    if (node.value === edge) return i;
    node = node.flink;
    i++;
  }
}

function dlist_to_rect_texts(dlist, map_rect = null) {
  let texts = [];
  let node = dlist.sentinel.flink;
  let e;

  while (node != dlist.sentinel) {
    e = node.value;
    texts.push("{} : [ {} -- {} ]".format(e.key, e.n1.id, e.n2.id));
    node = node.flink;
  }

  if (map_rect != null) {
    map_rect.text = texts;
    map_rect.height = dlist.size * 26;
  }

  return texts;
}

class primAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = null;
    this.map_rect = null;
    this.init = true;
  }

  /* create init graph */
  create_init_graph() {
    let g = this.g;
    let ani = this.ani;
    let x1, x2, y1, y2;
    let n, d, nodes, dy;
    let c;
    let margin = 60;
    let origin;
      
    x1 = 100000;
    x2 = -1;
    y1 = 100000;
    y2 = -1;

    nodes = [];
    g.save_original_graph();
    for (let key in g.node_map) {
      n = g.node_map[key].ani_circle;
      nodes.push(n);
      
      

      if (n.x < x1) x1 = n.x;
      if (n.x > x2) x2 = n.x;
      if (n.y < y1) y1 = n.y;
      if (n.y > y2) y2 = n.y;
    }


    origin = -x1;
    d = x2 - x1 + margin * 2;
    dy = -y1;
    if (2 * d + 50 > canvas.width - 250) set_canvas(2 * d + 300, 800, 250, 75);
    d += origin;
    
    ani.add_object(new Text("Original Graph", x1 + origin, -45, x2 - x1, "19px Times New Roman"));
    ani.add_object(new Text("Spanning Tree", x1 + d , -45, x2 - x1, "19px Times New Roman"));
    ani.add_object(new quadraticCurve(new Point(x1 + d - margin, - 50), new Point(x1 + d - margin, y2 + 50 + dy), 0, 0, false));

    //console.log(ani.obj_map);
    for (let i = 0; i < nodes.length; i++) {
      n = nodes[i];
      g.get_node(init_graph_node(n.ref), n.x + d, n.y + dy, n.ref);
      n.move(origin, dy);
    }

    this.ani.draw();
  }
 
  multimap_init() {
    this.ani.add_object(this.map_rect = new Rect(-230, -20, 130, 26, "SORTED_EDGES_REF", [], "Multimap (weight, edge)", "top", "v", {lineWidth: .5}));
    for (let i = 0; i < 50; i++) {
      this.map_rect.fillStyles.push("#DDDDDD");
    }
  }


  make_new() {
    return new primAnimation();
  }


  reset_text_color() {
    this.ani.add_sequence_ani({
      pause:1,
      action: {params: {map_rect:this.map_rect, reverse: false}, func: set_color},
      rev_action: {params: {map_rect:this.map_rect, reverse: true}, func: set_color},
    });
  }


  highlight_adj(adj) {
    let text = "";
    let c = 'style = "color:blue; font-weight:bold"';
    let texts = [];
    for (let index = 0; index < adj.length; index++) {
      text = "";
      for (let i = 0; i < adj.length; i++) {
        if (i == index) text += "<span {}>".format(c);
        text += "[ {} : {} ]".format(adj[i].pretty_edge(), adj[i].weight);
        if (i != adj.length - 1) text += ", ";
        if (i == index) text += "</span>";
      }
      texts.push(text);
    }
    return texts;
  }
  

  run(starting_node_id) {

    starting_node_id = starting_node_id.trim();
    
    if (starting_node_id === "") {
      $("#elaboration_text").text("Starting Node Id is empty");
      return false;
    } else if (!this.g.is_node(starting_node_id)) {
      $("#elaboration_text").text("");
      $("#elaboration_text").append("Starting Node Id {} does not exist".format_b(starting_node_id));
      return false;
    }

    if (this.init == true) {
      this.create_init_graph();
      this.multimap_init();
      this.init = false;
    }
    
    let starting_node, edge, node, node2, s_edge;
    let line, s_line;
    let i, sum, key, best_d, pos;
    let e_text, texts, pre_texts, highlight_texts, base_text;
    let multimap = new Dlist();
    let map_rect = this.map_rect,
        g = this.g,
        ani = this.ani;

    starting_node = g.get_node(starting_node_id);
    for (let key in g.node_map) {
      g.node_map[key].visited = 0;
      g.node_map[key].distance = null;
      g.node_map[key].backedge = null;
      g.node_map[key].itr = null;
      g.node_map[key].ani_circle.ctx_prop.fillStyle = "#DDDDDD";
    }

    for (let key in g.edge_map) {
      edge = g.edge_map[key];
      edge.ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
      if (edge.n1.id.indexOf("INIT_GRAPH_") != -1) edge.ani_line.visible = true;
    }

    starting_node.distance = 0;
    starting_node.visited = 1;


    for (i = 0; i < starting_node.adj.length; i++) {
      edge = starting_node.adj[i];
      edge.key = edge.weight;
      edge.n2.distance = edge.weight;
      edge.n2.itr = multimap.insert_sort_func(edge, compare);
    }

    ani.clear_animation();
    ani.add_sequence_ani({
      pause: 1,
      text: "Start by inserting starting node {}'s adjacent edges into multimap".format(starting_node.id),
      action: { params: {nodes: [starting_node], color :"pink"}, func: set_node_color },
      concurrence: true,
    });

    ani.add_sequence_ani({pause: ANIMATION_TIME, prop: {step: true}});
    dlist_to_rect_texts(multimap, map_rect);

    pre_texts = dlist_to_rect_texts(multimap);
    sum = 0;
    let first_line = true;
    while (!multimap.empty()) {
      edge = multimap.first();
      multimap.pop_front();
      key = edge.key;
      node = edge.n2;
      sum += key;
      node.visited = 1;

      s_edge = g.get_edge_by_name(init_graph_node(edge.n1.id), init_graph_node(edge.n2.id), edge.weight);
      
      /* sync the text direction and text position */
      if (edge.n1.ani_circle == edge.ani_line.p1.obj) {
        s_edge.ani_line.text_t = edge.ani_line.text_t;
        s_edge.ani_line.text_direction = edge.ani_line.text_direction;
      } else {
        s_edge.ani_line.text_t = 1 - edge.ani_line.text_t;
        if ( edge.ani_line.text_direction == "right")  s_edge.ani_line.text_direction = "left";
        else s_edge.ani_line.text_direction = "right";
      }

      s_edge.ani_line.ctx_prop = deep_copy(HIGHLIGHT_LINE);
      s_edge.ani_line.visible = false;
      
      
      // remove the first element in the multimap 
      
      this.reset_text_color();
      ani.add_sequence_ani({ 
        target: map_rect,
        text: "Process the first edge {}  in the multimap and remove it".format(highlight(edge.pretty_edge())),
        prop: {text_fade_out: {color: "red", index: 0}, step: true, time : ANIMATION_TIME * 3},
      });

      e_text = "Process element: {}".format("{} ".format_b(key+ ":") + highlight(edge.pretty_edge())) + NEW_LINE;

      // update the multimap texts.
      texts = dlist_to_rect_texts(multimap);
      pre_texts[0] = "";
      ani.add_sequence_ani({
        pause: 1,
        action: {params: {map_rect: map_rect, texts: texts}, func: update_rect_text},
        rev_action: {params: {map_rect: map_rect, texts: pre_texts}, func: update_rect_text},
        concurrence: true
      });
      pre_texts = deep_copy(texts);


      // add edges to the spanning tree
      ani.add_sequence_ani({
        pause:1,
        text: e_text + "Add edge {} to Spanning Tree".format(highlight(edge.pretty_edge())),
        action: {params: {line: s_edge.ani_line, visible: true}, func: line_visibility},
        rev_action: {params: {line: s_edge.ani_line, visible: false}, func: line_visibility},
        concurrence: true,
      });

      // set node color
      if (first_line) {
        first_line = false;
        ani.add_sequence_ani({
          pause:1,
          action: {params: {nodes: [s_edge.n1], color: "pink"}, func: set_node_color},
          rev_action:  {params: {nodes: [s_edge.n1], color: "#DDDDDD"}, func: set_node_color},
          concurrence: true
        });
      }

      ani.add_sequence_ani({
        pause:1,
        action: {params: {nodes: [s_edge.n2, edge.n2], color: "pink"}, func: set_node_color},
        rev_action:  {params: {nodes: [s_edge.n2, edge.n2], color: "#DDDDDD"}, func: set_node_color},
        concurrence: true
      });

      // set line color
      ani.add_sequence_ani({
        pause:1,
        action: {params: {line: edge.ani_line, ctx_prop: HIGHLIGHT_LINE}, func: set_line_color},
        rev_action: {params: {line: edge.ani_line, ctx_prop: DEFAULT_LINE_CTX}, func: set_line_color},
        concurrence: true
      });

      // pause here.
      ani.add_sequence_ani({
        pause: ANIMATION_TIME,
        prop: {step: true}
      });

      highlight_texts = this.highlight_adj(node.adj);
      e_text += "Process {}'s adjacent edges { ".format(edge.n2.id);
      
      base_text = e_text;
     
      // e_text += "Process {}'s adjacent edges".format(edge.n2.id) + NEW_LINE;

      for (i = 0; i < node.adj.length; i++) {
        e_text = base_text + highlight_texts[i];
        e_text += " }" + NEW_LINE;
        edge = node.adj[i];

        node2 = edge.n2;
        best_d = edge.weight;

        // console.log(node2.id, node2.distance, best_d);
        if (node2.visited == 0 && (node2.distance == null || best_d < node2.distance)) {

          if (node2.distance != null) {

            
            pos = edge_pos_in_map(multimap, node2.itr.value);
            //console.log(pos);
            multimap.erase(node2.itr);
            this.reset_text_color();
            pre_texts[pos] = "";
            ani.add_sequence_ani({
              target: map_rect,
              text: e_text + "Edge {} improves \"to\" node's {} current distance {}. Erase edge {} from multimap".format(highlight(edge.pretty_edge() + " : " + edge.weight), node2.id, node2.distance, highlight(node2.itr.value.pretty_edge())),
              prop: {text_fade_out: {color: "red", index: pos}, step: true, time: ANIMATION_TIME * 3}
            });
          }


          node2.distance = best_d;
          edge.key = best_d;
          node2.itr =  multimap.insert_sort_func(edge, compare);
          texts = dlist_to_rect_texts(multimap);
          pos = edge_pos_in_map(multimap, edge);

          this.reset_text_color();


          ani.add_sequence_ani({
            pause:1,
            text: e_text + "Add edge {} into multimap".format(highlight(edge.pretty_edge())),
            action: {params: {map_rect: map_rect, texts: texts}, func: update_rect_text},
            rev_action: {params: {map_rect: map_rect, texts: pre_texts}, func: update_rect_text},
            concurrence: true
          });
          pre_texts = deep_copy(texts);

          ani.add_sequence_ani({
            target: map_rect,
            prop: {text_fade_in: {color:"red", index: pos}, step: true, time: ANIMATION_TIME * 3}
          });

        } else {
         
            if (node2.visited == 1) {
              ani.add_sequence_ani({
                pause: ANIMATION_TIME,
                text: e_text + "Edge {} . Node {} is in the spanning tree. Do nothing".format(highlight(edge.pretty_edge() + " : " + edge.weight), node2.id),
                prop: {step: true}
              });
            } else {
              ani.add_sequence_ani({
                pause: ANIMATION_TIME,
                text: e_text + "Edge {} is not improving \"to\" node {}'s current distance {}. Do nothing".format(highlight(edge.pretty_edge() + " : " + edge.weight), node2.id, node2.distance),
                prop: {step: true}
              });
            }
          
        }

      }

    }

    ani.add_sequence_ani({
      pause: 1,
      text: "Done. The sum of the weights of connected edges is " + sum
    });

    ani.run_animation();
    return true;


  }
}