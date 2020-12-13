/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/28/2020
  last modified 12/10/2020
*/

// for node type
const T_ROOT_NODE = 0b1
const T_LEFT_NODE = 0b10;
const T_RIGHT_NODE = 0b100;
const T_UNKNOWN = 0b1000;

// for deletion
const T_NO_LEFT = 0b1;
const T_NO_RIGHT = 0b10;
const T_NO_BOTH = 0b100;
const T_BOTH = 0b1000;


const GAP_X = 30;
const GAP_Y = 50;

function update_circle_text(dict) {
  console.log(dict.circle);
  dict.circle.text = dict.text;
}

function traverse_to_root(n) {
  let path = [];
  while (n!=null) {
    path.push(n);
    n = n.parent;
  }
  return path;
}
function color_path(dict) {
  let n, e;
  let path = dict.path,
      last_node_color = dict.last_node_color,
      first_node_color = dict.first_node_color,
      g = dict.g;

  for (i = 0; i < path.length; i++) {
    n = path[i];

    if (i != path.length - 1) {
      n2 = path[i + 1];
      e = g.get_edge_by_name(n.ani_node.id, n2.ani_node.id);
      e.ani_line.ctx_prop.strokeStyle = 'red';
    }
    
    n.ani_node.ani_circle.ctx_prop.fillStyle = "yellow";
    if (i == 0 && first_node_color != null) {
      n.ani_node.ani_circle.ctx_prop.fillStyle = first_node_color;
    } else if (i == path.length - 1 && last_node_color != null) {
      n.ani_node.ani_circle.ctx_prop.fillStyle = last_node_color;
    } else {
      n.ani_node.ani_circle.ctx_prop.fillStyle = "yellow";
    }
  }

}

function change_alpha(dict) {
  dict.circle.alpha = dict.alpha;
};
/* reposition the node. The path is a reverse order from a node to root.
   type is the initial type. If a node's type is the reverse of type, we call move.
   and reverse the type.
*/
function reposition_node (dict) {
  let i;
  let gap_x = 30;
  let n, type = dict.type, parent;

  if ("reverse" in dict && dict.reverse) gap_x = -gap_x;

  console.log(dict.path);
  for (i = 0; i < dict.path.length; i++) {
    n = dict.path[i];
    if (i != dict.path.length - 1) parent = dict.path[i+1];
    if (n.type == T_LEFT_NODE && type == T_RIGHT_NODE) {
      type = T_LEFT_NODE;
      n.ani_node.ani_circle.propagation = true;
      n.ani_node.ani_circle.stop_propagation = {};
      n.ani_node.ani_circle.stop_propagation[parent.ani_node.id] = true;
      n.ani_node.ani_circle.move(-gap_x, 0);
    }
    if (n.type == T_RIGHT_NODE && type == T_LEFT_NODE) {
      type = T_RIGHT_NODE;
      n.ani_node.ani_circle.propagation = true;
      n.ani_node.ani_circle.stop_propagation = {};
      n.ani_node.ani_circle.stop_propagation[parent.ani_node.id] = true;
      n.ani_node.ani_circle.move(gap_x, 0);
    }
  }

}

class BSTnode {
  constructor(key, ani_node = null) {
    this.left = null;
    this.right = null;
    this.parent = null;
    this.key = key;
    this.ani_node = ani_node;
    this.type = T_UNKNOWN;
  }
}

class BSTree {
  constructor(g = null) {
    this.root = null;
    this.size = 0;
    this.g = g;
  }


  make_key() {
    let keys = [];
    this.recursive_make_key(this.root, keys);
    console.log(keys);
  }
  recursive_make_key(node, keys) {

    if (node == null) return;
    this.recursive_make_key(node.left, keys);
    keys.push(node.key);
    this.recursive_make_key(node.right, keys);
  }

  deep_copy() {
    let n;
    let bst_tree = new BSTree();

    bst_tree.root = this.recursive_copy(this.root);
    return bst_tree;
  }

  recursive_copy(node) {
    let left, right, new_n;

    if (node == null) return null;

    new_n = new BSTnode(node.key, node.ani_node);
    new_n.type = node.type;
    left = this.recursive_copy(node.left);
    right = this.recursive_copy(node.right);

    if (left != null) {
      new_n.left = left;
      left.parent = new_n;
    }

    if (right != null) {
      new_n.right = right;
      right.parent = new_n;
    }

    return new_n;
  }

  
  insert(key) {
    key = parseFloat(key);
    let g = this.g;
    let ani_node, p_ani_node;
    let new_node;
    let e, n = this.root;
    let parent;
    let x,y;
    let path = [];
    
    parent = null;
    while (n != null) {
      path.push(n);
      parent = n;
      if (key == n.key) return {node: null, path: path};
      n = (key < n.key) ? n.left : n.right;
    }

    new_node = new BSTnode(key);
    new_node.parent = parent;
    if (parent != null) p_ani_node = parent.ani_node;
    if (this.root == null) {
      new_node.type = T_ROOT_NODE;
      this.root = new_node;
      ani_node = g.get_node(key, g.center_x, 0, null, true);

    } else if (key < parent.key) {
      new_node.type = T_LEFT_NODE;
      parent.left = new_node;

      x = p_ani_node.ani_circle.x - GAP_X;
      y = p_ani_node.ani_circle.y + GAP_Y;
      ani_node = g.get_node(key, x, y, null, true);
     
    } else {
      new_node.type = T_RIGHT_NODE;
      parent.right = new_node;

      x = p_ani_node.ani_circle.x + GAP_X;
      y = p_ani_node.ani_circle.y + GAP_Y;
      ani_node = g.get_node(key, x, y, null, true);
    }

    e = null;
    if (parent != null) {
      e = g.get_edge_by_name(parent.ani_node.id, ani_node.id);
      e.ani_line.visible = false;
    }

    ani_node.ani_circle.visible = false;
    new_node.ani_node = ani_node;

    this.size++;
    
    return {node: new_node, path: path, edge: e};
  } 

  find(key) {
    let path = [];
    let n = this.root;
    parent = null;
    while (n != null) {
      path.push(n);
      if (key == n.key) return {find: true, path: path};
      n = (key < n.key) ? n.left : n.right;
    } 

    return {find: false, path: path};
  }


  delete(key) {
    let g = this.g;
    let n = this.root, tmp_n;
    let parent, repo_node;
    let path = [];
    let lm_path = [];
    let type;
    let delete_case, rv;

    while (n != null) {
      path.push(n);
      if (n.key == key) break;
      n = (key < n.key) ? n.left : n.right;
    }
    if (n == null) return {delete: false, path:path};

    parent = n.parent;

    /* no children */
    if (n.left == null && n.right == null) { 
      if (parent != null) {
        if (parent.left == n) parent.left = null;
        else if (parent.right == n) parent.right = null;
      } 

      if (parent == null) this.root = null;

      repo_node = parent;
      delete_case = T_NO_BOTH;
      type = n.type;

    /* one child */
    } else if (n.left == null || n.right == null) {
      tmp_n = (n.left != null)? n.left : n.right;
      delete_case = (n.left == null)? T_NO_LEFT : T_NO_RIGHT;
      if (parent != null) {
        if (parent.left == n) parent.left = tmp_n;
        else if (parent.right == n) parent.right = tmp_n;
      }

      tmp_n.parent = parent;

      type = tmp_n.type;
      tmp_n.type = n.type;
      repo_node = tmp_n;

      if (parent == null) this.root = tmp_n;

      

    } else {
      // find the left right-most node
      for (tmp_n = n.left; tmp_n.right != null; tmp_n = tmp_n.right) {
        lm_path.push(tmp_n);
      }

      lm_path.push(tmp_n);
      rv = this.delete(tmp_n.key);
      n.key = tmp_n.key;
      console.log(tmp_n.key);
     
      repo_node = tmp_n;
      type = tmp_n.type;
      delete_case = T_BOTH;
      // tmp_n.parent.right = null;

    }

    return { 
      delete: true,
      path:path, 
      node: n, /* the node we delete */
      repo_node, repo_node, /* the node we traverse back and reposition the node position */
      type: type, /* the initial node type for reposition node */
      delete_case: delete_case,
      lm_path: lm_path,
      rv: rv,
    };


  }


  
}





class binarySearchTreeAnimation {


  inorder_print() {
    let keys = [];
    this.reset_graph();
    this.recursive_inorder_print(this.bst_tree.root, keys);
    console.log(keys);

    this.ani.run_animation();
  }

  recursive_inorder_print(node, keys) {

    let ani = this.ani;
    let g = this.g;
    let e, c;
    if (node == null) return;

    c = node.ani_node.ani_circle;
    this.ani.add_sequence_ani({
      target: c,
      prop: {fade_in: true, fillStyle: "yellow", time : 1, lineWidth:4, shadowBlur: 10},
    })
    this.ani.add_sequence_ani({ pause: ANIMATION_TIME });

    if (node.left != null) {
      e = g.get_edge_by_name(node.key, node.left.key);
      this.ani.add_sequence_ani({
        target: e.ani_line,
        prop: {fade_in: true, strokeStyle: "red", time : 1, },
      })
      this.ani.add_sequence_ani({ 
        target: c,
        prop: {"walk": {circle: node.left.ani_node.ani_circle, h_scale : 0}},
      });
      this.ani.add_sequence_ani({ pause: ANIMATION_TIME });
    }

    this.recursive_inorder_print(node.left, keys);
    keys.push(node.key);

    if (node.right != null) {
      e = g.get_edge_by_name(node.key, node.right.key);
      this.ani.add_sequence_ani({
        target: e.ani_line,
        prop: {fade_in: true, strokeStyle: "red", time : 1, },
      })
      this.ani.add_sequence_ani({ pause: ANIMATION_TIME });
    }
    this.recursive_inorder_print(node.right, keys);

    this.ani.add_sequence_ani({
      target: c,
      prop: {fade_in: true, fillStyle: "#DDDDDD", time : 1, lineWidth:1},
    })
    this.ani.add_sequence_ani({ pause: ANIMATION_TIME });
  }

  delete(key) {
    key = parseFloat(key);

    this.ani.set_function_call("delete", [key]);
    this.set_state();

    let dx, dy;
    let tmp_rv, rv = this.bst_tree.delete(key);
    let n, e, e1, parent, left, right, c, child;
    let path, type;
    let ani = this.ani,
        g = this.g;


    path = rv.path;
    tmp_rv = rv;

    this.reset_graph();
    this.find_path_animation(path, key, "pink");
    this.func_text.text = "Call delete {}".format(key);
    while(1) {
      if (rv.delete == false) break;
      n = rv.node;
      /* Delete the node with no children */
      if (rv.delete_case == T_NO_BOTH) {

        if (n.parent != null) {
          e = g.get_edge_by_name(n.parent.ani_node.id, n.ani_node.id);
          ani.add_sequence_ani({
            target: e.ani_line,
            text: "Leaf node {} has no children. Simply delete it and remove parent node {}'s {} pointer".format_b(n.key, n.parent.key, n.type == T_LEFT_NODE?"left":"right"),
            prop: {fade_out: true, time: ANIMATION_TIME * 2},
            concurrence: true
          });
        } else {
          ani.add_sequence_ani({
            pause:1,
            text: "Delete root node {}".format_b(n.key),
          })
        }

        ani.add_sequence_ani({
          target: n.ani_node.ani_circle,
          prop: {fade_out: true, time: ANIMATION_TIME * 2},
        });
        break;
      /* Delete the node with only one children */
      } else if (rv.delete_case == T_NO_RIGHT || rv.delete_case == T_NO_LEFT) {

        parent = n.parent;
        child = rv.delete_case == T_NO_RIGHT? n.left : n.right;
        
        /* not a root node */
        if (parent != null) {      
          e = g.get_edge_by_name(parent.ani_node.id, n.ani_node.id);

          /* set deleted node's parent edge to its left node */
          ani.add_sequence_ani({
            text: "Set node {}'s left to node {}. Set node {}'s parent to node {}".format_b(parent.key, child.key, child.key, parent.key),
            target: e.ani_line,
            prop: {p: child.ani_node.ani_circle.points[0], ani: this.ani, type: "pivot", time: ANIMATION_TIME, step:true}
          });

        /* root node */
        } else {
          ani.add_sequence_ani({
            text: "Set node {} as the root node".format_b(child.key),
            prop:{step:true},
          });
        }

        /* remove deleted node */
        ani.add_sequence_ani({
          text: "Delete {} node {}".format_b(tmp_rv == rv? "":"blurry", n.key),
          target: n.ani_node.ani_circle,
          prop: {"fade_out": true, step:true},
          concurrence:true
        });

        e1 = g.get_edge_by_name(n.ani_node.id, child.ani_node.id);
        ani.add_sequence_ani({
          target: e1.ani_line,
          prop: {"fade_out": true},
        });

        c = child.ani_node.ani_circle;

        child.ani_node.ani_circle.stop_propagation = {};
        if (parent != null) child.ani_node.ani_circle.stop_propagation[parent.ani_node.id] = true;
        child.ani_node.ani_circle.propagation = true;

        // root node. we move to the root position
        if (parent == null) {
          dx = n.ani_node.ani_circle.x;
          dy = n.ani_node.ani_circle.y;
        // move move up, and left or right depending on its node type. 
        } else {
          dy = c.y - GAP_Y;
          if (child == n.left) {
            dx = c.x + GAP_X;
          } else {
            dx = c.x - GAP_X; 
          }
        }
        // make a move
        ani.add_sequence_ani({
          target: child.ani_node.ani_circle,
          prop: {p: new Point(dx, dy)},
        });

        break;

      /* two children case */
      } else {
        console.log(rv.node);

        n = rv.node;
        e = g.get_edge_by_name(rv.node.ani_node.id, rv.lm_path[0].ani_node.id);
        ani.add_sequence_ani({
          text: "Node {} has two children. Find the {} node in its {} subtree".format_b(n.ani_node.ani_circle.text, "rightmost", "left"),
          target: e.ani_line,
          prop: {"fade_in":true, strokeStyle: "red", time:1, step:true}
        })
        
        this.find_path_animation(rv.lm_path, null, "pink");


        n = rv.rv.node;
        ani.add_sequence_ani({
          pause:1,
          action: {params: {circle: n.ani_node.ani_circle, alpha:0.25}, func: change_alpha},
          rev_action: {params: {circle: n.ani_node.ani_circle, alpha: 1}, func: change_alpha},
          concurrence: true
        })

        n = rv.node;
        ani.add_sequence_ani({
          pause:1,
          text: "Copy node {} key/value into node {}.".format_b(rv.rv.node.key, n.ani_node.ani_circle.text),
          action: {params: {circle:n.ani_node.ani_circle, text: n.key}, func: update_circle_text},
          rev_action: {params: {circle:n.ani_node.ani_circle, text: n.ani_node.ani_circle.text}, func: update_circle_text},
          prop: {"step": true}
        })
        rv = rv.rv;

      }
    }

    // reposition the node
    path = traverse_to_root(rv.node);
    ani.add_sequence_ani({
      pause:1,
      action: {params: {reverse:true, type: rv.type, path: path}, func: reposition_node},
      rev_action: {params: {reverse:false,type: rv.type, path: path}, func: reposition_node}
    })

    /* color the path to find the deleted node */
    ani.add_sequence_ani({
      pause:1,
      rev_action: {params: {g:this.g, path:tmp_rv.path, last_node_color:"pink"}, func: color_path},
      concurrence: true,
    })

    /* color the deleted node(first node) and actual deleted node(last node) */
    if (tmp_rv.delete == true) {
      path = tmp_rv.lm_path;
      path.unshift(tmp_rv.path[tmp_rv.path.length - 1]);
      ani.add_sequence_ani({
        pause:1,
        rev_action: {params: {g:this.g, path:path, first_node_color:"pink", last_node_color:"pink"}, func: color_path},
      })
    } else {
      ani.add_sequence_ani({
        text: "Couldn't find key {} in the tree to delete".format_b(key),
        // prop: {step: true, time: 1}
      })
    }

    ani.add_sequence_ani({
      target: this.func_text,
      prop: {text: this.func_text.text},
    })

    ani.run_animation();
  }


  constructor() {
    this.ani = new Animation();
    this.g = new Graph(this.ani, "directed");
    this.bst_tree = new BSTree(this.g);
    this.func_text = new Text("", 100, -20, 100, "13px Arial");
    this.ani.add_object(this.func_text);
  }

  deep_copy() {
    let bst = new binarySearchTreeAnimation();
    bst.bst_tree = this.bst_tree.deep_copy();
    bst.g = this.g;
    bst.ani = this.ani;
    bst.func_text = this.func_text;
    return bst;
  }
  set_state() {
    let ani = this.ani;
    
    /* the entire state is composed of the state of graph, Animation and algorithm */
    let state = this.deep_copy(); // this copy the state of algorithm
    state.ani = state.ani.deep_copy(); // this copy the state of animation
    state.g = state.g.deep_copy(state.ani); // this copy the state of Graph
    state.bst_tree.g = state.g;
    state.bst_tree.make_key();
    ani.set_state(state);
  }

  reset_graph() {
    let g = this.g;
    for (let key in g.node_map) {
      g.node_map[key].ani_circle.ctx_prop = deep_copy(DEFAULT_CIRCLE_CTX);
    }
    for (let key in g.edge_map) {
      g.edge_map[key].ani_line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
    }
  }


  find_path_animation(path, key, last_node_color = null) {
    
    let i, n, n2, e, cmp_key;
    let text;
    let ani = this.ani,
        g = this.g;

    for (i = 0; i < path.length; i++) {
      n = path[i];

      cmp_key = n.ani_node.ani_circle.text;
      if (key == null) text = "Find the rightmost node";
      else if (key < cmp_key) text = "Key {}  <  {}. Go left".format(key, cmp_key);
      else if (key > cmp_key) text = "Key {}  >  {}. Go right".format(key, cmp_key);
      else text = "Key {}  =  {}.".format(key, cmp_key);

      if (i != path.length - 1) {
        n2 = path[i + 1];
        e = g.get_edge_by_name(n.ani_node.id, n2.ani_node.id);
        ani.add_sequence_ani({
          target: e.ani_line,
          prop : {fade_in: true, strokeStyle: "red", time: 1},
          concurrence: true
        });
      }
      
      ani.add_sequence_ani({
        target: n.ani_node.ani_circle,
        text: text,
        prop : {fade_in: true, fillStyle: "yellow", time: 1}
      })

      if (i == path.length - 1 && last_node_color != null) {
        ani.last_seqence_ani().prop.fillStyle = last_node_color;
      }

      ani.add_sequence_ani({pause: ANIMATION_TIME, prop: {step: true}})
    }


  }

  

  find (key) {
    let ani = this.ani;

    ani.set_function_call("find", [key]);
    this.set_state();
    key = parseFloat(key);

    let rv = this.bst_tree.find(key);
    let path = rv.path,
        find = rv.find;

    this.func_text.text = "Call find {}".format(key);
    this.reset_graph();    
    this.find_path_animation(path, key, !find? null : "pink");

    ani.add_sequence_ani({
      puase:1,
      text: "{} key {} in the tree".format_b(find? "Find":"Couldn't find", key),
      rev_action: {params: {g:this.g, path:rv.path, last_node_color:"pink"}, func: color_path},
    })
    
    ani.add_sequence_ani({
      target: this.func_text,
      prop: {text: this.func_text.text},
    })
    ani.run_animation();

  }



  insert(key) {
    let i;
    let type;
    let e, parent;
    let text;
    let ani = this.ani,
        g = this.g;


    ani.set_function_call("insert", [key]);
    this.set_state();
    
    let rv = this.bst_tree.insert(key);
    let path = rv.path,
        node = rv.node;

    key = parseFloat(key);
    

    this.reset_graph();
    this.find_path_animation(path, key);
    this.func_text.text = "Call insert {}".format(key);
    /* add a new node */

    if (node != null) {

      path = traverse_to_root(node);
      ani.add_sequence_ani({
        pause:1,
        action: {params: {type:node.type, path: path}, func: reposition_node},
        rev_action: {params: {reverse:true, type:node.type, path: path}, func: reposition_node}
      })

      e = rv.edge;
      parent = node.parent;

      text = "Add new node {}".format_b(node.key);
      if (node.type == T_ROOT_NODE) text += ". Set it as the root node";
      else { 
        text += ". Set node {}'s {} to node {}. Set node {}'s parent to node {}".format_b(
                  parent.key, node.type == T_LEFT_NODE? "left":"right", node.key,
                  node.key, parent.key);
      }
      ani.add_sequence_ani({
        target: node.ani_node.ani_circle,
        text: text,
        prop : {fade_in: true, fillStyle: "pink", visible:true, time: ANIMATION_TIME * 2},
        concurrence: (e != null)
      })

      if (e != null) {
        ani.add_sequence_ani({
          target: e.ani_line,
          prop: {fade_in: true, strokeStyle: "red", visible: true, time: ANIMATION_TIME * 2}
        })
      }

    /* otherwise, we already have it in the tree */
    } else {
      ani.add_sequence_ani({
        text: "Key {} is already in the tree. Insert({}) = False".format(key, key)
      });
    }

    ani.add_sequence_ani({
      pause:1,
      target: this.func_text,
      prop: {text: this.func_text.text},
      rev_action: {params: {g:g, path:rv.path}, func: color_path},
    })
    
    ani.run_animation();
  }

}