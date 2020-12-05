/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/30/2020
  last modified 12/04/2020
*/



function set_color(dict) {
  if (dict.reverse) dict.q_rect.text_color = dict.q_rect.tmp_text_color;
  else {
    dict.q_rect.tmp_text_color = dict.q_rect.text_color;
    dict.q_rect.text_color = {};
  }
}

function table_td(id, content) {
  return "<td id = " + id + " >" + content + "</td>";
}

function set_circle_color(c) {
  c.ctx_prop = { fillStyle:"pink", strokeStyle : "#696969"};
}
function html_table(g) {
  let keys;
  let i,n, id;

  keys = Object.keys(g.node_map);

  $("#node").text("");
  $("#distance").text("");
  $("#backedge").text("");
  $("#num_incoming").text("");
  $("#num_path").text("");

  $("#node").append(table_td("nodeH", "Node"));
  $("#distance").append(table_td("distanceH", "Distance"));
  $("#backedge").append(table_td("backedgeH", "Backedge"));
  $("#num_incoming").append(table_td("num_incomingH", "# Incoming"));
  $("#num_path").append(table_td("num_pathH", "# Path"));
  // $("#multimap").append("<td id = \"multimap_t\" colspan=" + keys.length + " style=\"text-align: left\"></td>");

  for (i = 0; i < keys.length; i++) {
    n = g.node_map[keys[i]];
    $("#node").append(table_td("node_" + n.id, n.id));
    $("#distance").append(table_td("distance_" + n.id, n.distance));
    $("#backedge").append(table_td("backedge_" + n.id, (n.backedge == null)? "NULL" : n.backedge.pretty_edge()));
    $("#num_incoming").append(table_td("incoming_" + n.id, n.num_in));
    $("#num_path").append(table_td("path_" + n.id, n.num_path));
  }
}

function update_rect_text(dict) {
  let q_rect = dict.q_rect,
      texts = dict.texts;

  q_rect.text = deep_copy(texts);
  q_rect.height = texts.length * 26;
  q_rect.y = 280 - q_rect.height;
  
}

function update_html_table(dict) {
  
  let nodes = dict.nodes;
  let n, text;


  $("[id^=node_").css("background", "");
  $("[id^=distance_").css("background", "");
  $("[id^=backedge_").css("background", "");
  $("[id^=incoming_").css("background", "");
  $("[id^=path_").css("background", "");

  for (let i = 0; i < nodes.length; i++) {
    n = nodes[i];

    text = n.distance;
    $("#distance_" + n.id).text("");
    if ("to_distance" in n) text += RED_SPAN + RIGHT_ARROW + n.to_distance + "</span>";
    $("#distance_" + n.id).append(text);


    $("#backedge_" + n.id).text("");
    if ("to_backedge" in n) {
      text = (n.backedge == null) ? "NULL" : "[ {} ]".format(n.backedge.pretty_edge());
      text += RED_SPAN + RIGHT_ARROW + " [ {} ]".format(n.to_backedge.pretty_edge()) + "</span>";
    } else {
      text = (n.backedge == null) ? "NULL" : n.backedge.pretty_edge();
    }
    $("#backedge_" + n.id).append(text);
    

    $("#incoming_" + n.id).text("");
    text = n.num_in;
    if ("to_num_in" in n) text += RED_SPAN + RIGHT_ARROW + n.to_num_in + "</span>";
    $("#incoming_" + n.id).append(text);

    $("#path_" + n.id).text("");
    text = n.num_path;
    if ("to_num_path" in n) text += RED_SPAN + RIGHT_ARROW + n.to_num_path + "</span>";
    $("#path_" + n.id).append(text);

    $("#node_" + n.id).css("background", "lightblue");
    $("#distance_" + n.id).css("background", "lightblue");
    $("#backedge_" + n.id).css("background", "lightblue");
    $("#incoming_" + n.id).css("background", "lightblue");
    $("#path_" + n.id).css("background", "lightblue");
  }
}


function node_copy(n) {

  let rv = n.shallow_copy();

  rv.num_path = n.num_path;
  rv.num_in = n.num_in;
  return rv;
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


class toplogicalSortAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = null;
    this.q_rect = null;
    this.init = false;
   
  }

  reset_text_color() {
    this.ani.add_sequence_ani({
      pause:1,
      action: {params: {q_rect:this.q_rect, reverse: false}, func: set_color},
      rev_action: {params: {q_rect:this.q_rect, reverse: true}, func: set_color},
    })
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
    console.log(d);
    if (d < 0) {
      for (let key in g.node_map) {
        c = g.node_map[key].ani_circle;
        c.move(-d, 0);
      }
    }
    this.ani.add_object(this.q_rect = new Rect(20, 280, 130, 0, "QUEUE_TOPSORT_REF", [], "List", "bottom", "v", {lineWidth: .5}))
  }


  make_new() {
    return new toplogicalSortAnimation();
  }


  reset_graph() {
    let g = this.g;
    for (let key in g.node_map) {
      g.node_map[key].ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }
    for (let key in g.edge_map) {
      g.edge_map[key].ani_line.alpha = 1;
      g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX)
    }
  }

  run(starting_node_id = "S") {
    let g = this.g,
        ani = this.ani;
    let e, n, n2, tmp_n, tmp_n1, starting_node;
    let i, d;
    let queue = new Dlist();
    let e_text, l_text, pre_l_text;
    let q_rect;

    starting_node_id = starting_node_id.trim();
    if (starting_node_id == "") {
      $("#elaboration_text").text("Node id is empty");
      return;
    } else if (!g.is_node(starting_node_id)) {
      $("#elaboration_text").text("Node {} does not exist".format(starting_node_id));
      return;
    }

    if (g.cycle_detection() == true) {
      $("#elaboration_text").text("It must be directed acyclic graph");
      return;
    }
    if (this.init == false) {
      this.make_queue_rect();
      this.init = true;
    } else this.reset_graph();
    
    ani.clear_animation();
    q_rect = this.q_rect;
    starting_node = g.get_node(starting_node_id);


    ani.add_sequence_ani({
      pause:1,
      text: "Set starting node {}{}'s{} distance to 0. Compute the number of incoming edges. For nodes that have 0 incoming edges, set their number of distinctive path to 1".format(BLUE_SPAN, starting_node_id, "</span>"),
      prop: {step: true},
    })
    for (let key in g.node_map) {
      n = g.node_map[key];
      n.distance = -1;
      n.num_in = 0;
      n.num_path = 0;
      n.backedge = null;
    }

    for (let key in g.edge_map) {
      n2 = g.edge_map[key].n2;
      n2.num_in++;
    }

    e_text = "Node" + BLUE_SPAN + " { "
    for (let key in g.node_map) {
      n = g.node_map[key];
      if (n.num_in == 0) {
        n.num_path = 1;
        queue.push_back(n);
        e_text += n.id +  ", ";
      }
    }


    e_text = e_text.slice(0, -2);
    e_text += " } </span> have 0 incoming edges. Append them to the list";
    ani.add_sequence_ani({
      pause:1,
      text: e_text,
      concurrence: true,
    })

    pre_l_text = [];
    l_text = dlist_to_rect_texts(queue);
    ani.add_sequence_ani({
      pause:1,
      action: {params: {q_rect: q_rect, texts: l_text}, func: update_rect_text},
      rev_action: {params: {q_rect: q_rect, texts: pre_l_text}, func: update_rect_text},
    })
    pre_l_text = deep_copy(l_text);

    for (i = 0; i < l_text.length; i++) {
      ani.add_sequence_ani({
        target: q_rect,
        prop: {"text_fade_in": {index: i, color: "red"}},
        concurrence: (i < l_text.length - 1)
      })
    }
    ani.add_sequence_ani({pause: 1, prop:{step: true}});


    starting_node.distance = 0;
    queue.print();
    html_table(g);
   

    while(!queue.empty()) {
      n = queue.first();
      queue.pop_front();

      ani.add_sequence_ani({
        pause: 1,
        target: n.ani_circle,
        action: {params: n.ani_circle, func: set_circle_color},
        concurrence: true
      })
      e_text = "<span style = 'color: blue'>{ ";
      for (i = 0; i < n.adj.length; i++) {
        e = n.adj[i];
        e_text += e.pretty_edge();
        if (i != n.adj.length - 1) e_text += ', ';
        ani.add_sequence_ani({
          target: e.ani_line,
          prop: {fade_in: true, strokeStyle: "red", lineWidth: 4, time: 1},
          concurrence: true,
        })
      }
      e_text += " }</span>";
      
      this.reset_text_color();
      ani.add_sequence_ani({
        target: q_rect,
        text: "Remove the first node {} {} {}from list and process its adjacent edges ".format(BLUE_SPAN, n.id, "</span>") + e_text,
        prop: {"text_fade_out": {index: queue.size, color: "red"}, step: true},
      })

      l_text = dlist_to_rect_texts(queue);
      pre_l_text[queue.size] = "";
      ani.add_sequence_ani({
        pause:1,
        action: {params: {q_rect: q_rect, texts: l_text}, func: update_rect_text},
        rev_action: {params: {q_rect: q_rect, texts: pre_l_text}, func: update_rect_text},
      })
      pre_l_text = deep_copy(l_text);

      for (i = 0; i < n.adj.length; i++) {
        e = n.adj[i];
        n2 = e.n2;

        tmp_n =  node_copy(n2);
        tmp_n1 = node_copy(n2);

        n2.num_path += n.num_path;
        n2.num_in--;

        tmp_n.to_num_path = n.num_path;
        tmp_n.to_num_in = n.num_in;

        if (n2.num_in == 0) {
          queue.push_back(n2);
        }
        if (n.distance != -1) {
          d = n.distance + e.weight;
          if (n2.distance == -1 || d < n2.distance) {
            n2.backedge = e;
            n2.distance = d;
            tmp_n.to_distance = n2.distance;
            tmp_n.to_backedge = e;
          }
        }

        ani.add_sequence_ani({
          pause:1,
          text: "Remove egde {} [ {} ] </span>. Update node {}{}</span>".format(BLUE_SPAN, e.pretty_edge(), BLUE_SPAN, e.n2.id),
          action: {params: {nodes: [node_copy(e.n1), tmp_n]}, func: update_html_table },
          rev_action: {params: {nodes: [node_copy(e.n1), tmp_n1]}, func: update_html_table },
          concurrence: true
        })

        ani.add_sequence_ani({
          target: e.ani_line,
          prop: {fade_out: true, strokeStyle: "red", lineWidth: 4, time: ANIMATION_TIME, step: true},
        })


        if (n2.num_in == 0) {
          l_text = dlist_to_rect_texts(queue);
          ani.add_sequence_ani({
            pause:1,
            text: "Node {}{}</span> has 0 incoming edges. Append it to the list".format(BLUE_SPAN, n2.id),
            action: {params: {q_rect: q_rect, texts: l_text}, func: update_rect_text},
            rev_action: {params: {q_rect: q_rect, texts: pre_l_text}, func: update_rect_text},
          })
          pre_l_text = deep_copy(l_text);

          ani.add_sequence_ani({
            target: q_rect,
            prop: {text_fade_in: {color: "red", index: 0}, step: true, time: ANIMATION_TIME},
          })
        }

        ani.add_sequence_ani({
          pause:1,
          action: {params: {nodes: [node_copy(e.n1), node_copy(e.n2)]}, func: update_html_table },
          rev_action: {params: {nodes: [node_copy(e.n1), tmp_n]}, func: update_html_table },
        })


      }
      
    }

    ani.add_sequence_ani({
      pause:1,
      text: "Done"
    });
    ani.run_animation();
  }
  
}








