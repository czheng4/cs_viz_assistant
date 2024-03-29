/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/28/2020
  last modified 01/03/2021
*/

// for node type
const T_ROOT_NODE = 0b1;
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

  //console.log(dict.path);
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

  /* return new binarySearchTreeAnimation */
  rebalance_tree() {

    let bst_ani = new binarySearchTreeAnimation();
    let bst = bst_ani.bst_tree;
    let keys = this.make_key();
    this.recursive_rebalance_tree(keys, 0, keys.length, bst);
    //console.log(bst.make_key());

    return bst_ani;
  }

  recursive_rebalance_tree(sorted_keys, starting_index, num_indices, bst) {
    let n, left, right, m_index;
    let dict;
    if (num_indices == 0) return null;
  
    m_index = parseInt(starting_index + num_indices / 2);

    /* we actually call the insert such that i can reposition the node */
    dict = bst.insert(sorted_keys[m_index]);
  
    reposition_node({type:dict.node.type, path:traverse_to_root(dict.node)});
    left = this.recursive_rebalance_tree(sorted_keys, starting_index, m_index - starting_index, bst);
    right = this.recursive_rebalance_tree(sorted_keys, m_index + 1, starting_index + num_indices - m_index - 1, bst);

  }

  make_key() {
    let keys = [];
    this.recursive_make_key(this.root, keys);
    return keys;
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
    bst_tree.size = this.size;
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
      this.size--;
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
      this.size--;
      

    } else {
      // find the left right-most node
      for (tmp_n = n.left; tmp_n.right != null; tmp_n = tmp_n.right) {
        lm_path.push(tmp_n);
      }

      lm_path.push(tmp_n);
      rv = this.delete(tmp_n.key);
      n.key = tmp_n.key;
      //console.log(tmp_n.key);
     
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
      lm_path: lm_path, /* for case where it has both children. The path to rightmost node in the left subtree */
      rv: rv,
    };


  }


  
}




class binarySearchTreeAnimation {
  constructor() {
    this.ani = new Animation();
    this.g = new Graph(this.ani, "directed");
    this.bst_tree = new BSTree(this.g);
    this.func_text = new Text("", 100, -20, 100, "15px Arial");
    this.key_rect = new Rect(0, 0, 0, 0, "INRODER_KEY", [], "Sorted Keys", "top", "h");
    this.key_rect.visible = false;
    this.ani.add_object(this.key_rect);
    this.ani.add_object(this.func_text);

    this.is_rebalance = false;
  }


  rebalance_tree() {
    let bst_ani = this.bst_tree.rebalance_tree();
    bst_ani.ani.step_by_step = this.ani.step_by_step;

    this.ani = bst_ani.ani;
    this.g = bst_ani.g;
    this.bst_tree = bst_ani.bst_tree;
    this.key_rect = bst_ani.key_rect;
    this.func_text = bst_ani.func_text;
    this.is_rebalance = true;

    let keys = this.bst_tree.make_key();
    this.func_text.text = "Call balance tree".format(key);
    this.recursive_rebalance_tree(keys, 0, keys.length);
    this.show_sorted_keys_rect();
    this.key_rect.text = keys;
    this.ani.add_sequence_ani({
      pause:1,
      text: "Done",
    });
    this.ani.run_animation();
  }

  recursive_rebalance_tree(sorted_keys, starting_index, num_indices) {
    let n, left, right, m_index, c, e;
    let key1, key2;
    let dict;
    let g = this.g,
        ani = this.ani;

    if (num_indices == 0) return null;
    

    m_index = parseInt(starting_index + num_indices / 2);

    n = g.get_node(sorted_keys[m_index]);
    c = n.ani_circle;
    ani.add_sequence_ani({
      target:c,
      text: "Recursivly balance tree with sorted keys {}. Make a new node with the middle key Sorted_keys{} = {}".format_b("[{}:{}]".format(starting_index, starting_index + num_indices), "[" + m_index + "]", c.text),
      prop: {fade_in: true, fillStyle: "yellow", visible:true, step: true},
      concurrence:true
    });

    ani.add_sequence_ani({
      target: this.key_rect,
      prop: {text_fade_in: {index: m_index, fillStyle:"lightblue" }, time:1 }
    });
    

    left = this.recursive_rebalance_tree(sorted_keys, starting_index, m_index - starting_index);
    if (left != null) {
      e = g.get_edge(n, left);
      key1 = n.ani_circle.text;
      key2 = left.ani_circle.text;
      ani.add_sequence_ani({
        text: "Set node {}'s left to node {}. Set node {}'s parent to node {}".format_b(key1, key2, key2, key1),
        target: e.ani_line,
        prop: {fade_in: true, strokeStyle: "red", visible: true, step: true},
      });
    }


    right = this.recursive_rebalance_tree(sorted_keys, m_index + 1, starting_index + num_indices - m_index - 1);
    if (right != null) {
      e = g.get_edge(n, right);
      key1 = n.ani_circle.text;
      key2 = right.ani_circle.text;
      ani.add_sequence_ani({
        text: "Set node {}'s right to node {}. Set node {}'s parent to node {}".format_b(key1, key2, key2, key1),
        target: e.ani_line,
        prop: {fade_in: true, strokeStyle: "red", visible: true, step: true},
      });
    }


    if (c.from.length != 0) {
      ani.add_sequence_ani({
        target: c,
        prop: {"walk" : {circle: c.from[0], h_scale: 0}}
      });
    }

    ani.add_sequence_ani({
      target: c,
      prop: {fade_in: true, fillStyle: "#DDDDDD", time : 1, lineWidth:1},
    });
   
    return n;
  }


  /* set the func text and if we show key_rect when the animation goes back */
  clear_after_func_ani(visible = false) {
    let dict;
    let show_rect = function(dict) {
      //console.log(dict);
      dict.rect.visible = dict.visible;
      if ("text" in dict) dict.rect.text = dict.text;
    };

    dict = {};
    dict.rect = this.key_rect;
    dict.visible = visible;
    if (visible == true) {
      dict.text = deep_copy(this.bst_tree.make_key());
      //console.log(dict.text);
    }

    this.ani.add_sequence_ani({
      target: this.func_text,
      prop: {text: this.func_text.text, time:1},
      rev_action: {params: dict, func: show_rect},
    });

  }

  inorder_print() {
    let keys = [];

    this.ani.set_function_call("inorder_print");
    this.set_state();

    this.func_text.text = "Call inorder print";
    this.reset_graph();
    this.show_sorted_keys_rect();
    this.recursive_inorder_print(this.bst_tree.root, keys);
    this.clear_after_func_ani(true);

    this.ani.run_animation();
    return keys;
  }

  recursive_inorder_print(node, keys) {

    let ani = this.ani;
    let g = this.g;
    let e,e_left,e_right, c, c_left, c_right;
    if (node == null) return;

    c = node.ani_node.ani_circle;
    ani.add_sequence_ani({
      target: c,
      prop: {fade_in: true, fillStyle: "yellow", time : 1, lineWidth:4, step:true},
    });
    ani.add_sequence_ani({ pause: ANIMATION_TIME });

    // go left
    if (node.left != null) {
      e_left = g.get_edge_by_name(node.ani_node.id, node.left.ani_node.id);
      c_left = node.left.ani_node.ani_circle;

      ani.add_sequence_ani({
        target: e_left.ani_line,
        prop: {fade_in: true, strokeStyle: "red", time : 1, },
      });

      ani.add_sequence_ani({ 
        target: c,
        prop: {"walk": {circle: c_left, h_scale : 0}},
      });
    
    }

    // push key
    this.recursive_inorder_print(node.left, keys);
    ani.add_sequence_ani({
      target: this.key_rect,
      text: "Push back key {}".format_b(node.key),
      prop: {text_fade_in: {index: keys.length, color: "black", fillStyle:"lightblue", text: node.key }, step: true}
    });
    keys.push(node.key);

    // go right
    if (node.right != null) {
      e_right = g.get_edge_by_name(node.ani_node.id, node.right.ani_node.id);
      c_right = node.right.ani_node.ani_circle;

      ani.add_sequence_ani({
        target: e_right.ani_line,
        prop: {fade_in: true, strokeStyle: "red", time : 1, },
      });
      ani.add_sequence_ani({ 
        target: c,
        prop: {"walk": {circle: c_right, h_scale : 0}},
      });
    }
    this.recursive_inorder_print(node.right, keys);

    // go back
    if (node.parent != null) {
      ani.add_sequence_ani({
        target: c,
        prop: {"walk" : {circle: node.parent.ani_node.ani_circle, h_scale: 0}}
      });

      e = g.get_edge_by_name(node.parent.ani_node.id, node.ani_node.id);
      ani.add_sequence_ani({
        target: e.ani_line,
        prop: {fade_in: true, strokeStyle: "black", time : 1},
      });
    }

    ani.add_sequence_ani({
      target: c,
      prop: {fade_in: true, fillStyle: "#DDDDDD", time : 1, lineWidth:1},
    });
    // ani.add_sequence_ani({ pause: ANIMATION_TIME });
  }

  delete(key) {
    
    key = parseFloat(key);
    this.is_rebalanced_tree();
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
          });
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
        //console.log(rv.node);

        n = rv.node;
        e = g.get_edge_by_name(rv.node.ani_node.id, rv.lm_path[0].ani_node.id);
        ani.add_sequence_ani({
          text: "Node {} has two children. Find the {} node in its {} subtree".format_b(n.ani_node.ani_circle.text, "rightmost", "left"),
          target: e.ani_line,
          prop: {"fade_in":true, strokeStyle: "red", time:1, step:true}
        });
        
        this.find_path_animation(rv.lm_path, null, "pink");


        n = rv.rv.node;
        ani.add_sequence_ani({
          pause:1,
          action: {params: {circle: n.ani_node.ani_circle, alpha:0.25}, func: change_alpha},
          rev_action: {params: {circle: n.ani_node.ani_circle, alpha: 1}, func: change_alpha},
          concurrence: true
        });

        n = rv.node;
        ani.add_sequence_ani({
          target: rv.rv.node.ani_node.ani_circle,
          text: "Copy node {} key/value into node {}.".format_b(rv.rv.node.key, n.ani_node.ani_circle.text),
          prop: {copy: {circle: n.ani_node.ani_circle, h_scale:0}, "step": true}
        });
        rv = rv.rv;

      }
    }

    // reposition the node
    path = traverse_to_root(rv.node);
    ani.add_sequence_ani({
      pause:1,
      action: {params: {reverse:true, type: rv.type, path: path}, func: reposition_node},
      rev_action: {params: {reverse:false,type: rv.type, path: path}, func: reposition_node}
    });

    /* color the path to find the deleted node */
    ani.add_sequence_ani({
      pause:1,
      rev_action: {params: {g:this.g, path:tmp_rv.path, last_node_color:"pink"}, func: color_path},
      concurrence: true,
    });

    /* color the deleted node(first node) and actual deleted node(last node) */
    if (tmp_rv.delete == true) {
      path = tmp_rv.lm_path;
      path.unshift(tmp_rv.path[tmp_rv.path.length - 1]);
      ani.add_sequence_ani({
        pause:1,
        rev_action: {params: {g:this.g, path:path, first_node_color:"pink", last_node_color:"pink"}, func: color_path},
      });
    } else {
      ani.add_sequence_ani({
        text: "Couldn't find key {} in the tree to delete".format_b(key),
        // prop: {step: true, time: 1}
      })
    }

    this.clear_after_func_ani(false);

    ani.run_animation();
  }


  show_sorted_keys_rect() {
    let size = this.bst_tree.size;
    let texts = [];
    let f_styles = [];

    //console.log(size);
    this.key_rect.width = 40 * size;
    this.key_rect.height = 30;
    this.key_rect.visible = true;
    this.key_rect.x = MAIN_G_SPEC.center_x - this.key_rect.width / 2;
    this.key_rect.y = -55;
    for (let i = 0; i < size; i++) {
      texts.push("");
      f_styles.push("#DDDDDD");
    }
    this.key_rect.fillStyles = f_styles;
    this.key_rect.text = texts;

  }

  deep_copy() {
    let bst = new binarySearchTreeAnimation();
    bst.bst_tree = this.bst_tree.deep_copy();
    bst.g = this.g;
    bst.ani = this.ani;
    bst.func_text = this.func_text;
    bst.key_rect = this.key_rect;
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
    this.key_rect.visible = false;
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
      else if (key < cmp_key) text = "Key {}  <  {}. Go left".format_b(key, cmp_key);
      else if (key > cmp_key) text = "Key {}  >  {}. Go right".format_b(key, cmp_key);
      else text = "Key {}  =  {}.".format_b(key, cmp_key);

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
      });

      if (i == path.length - 1 && last_node_color != null) {
        ani.last_seqence_ani().prop.fillStyle = last_node_color;
      }

      ani.add_sequence_ani({pause: ANIMATION_TIME, prop: {step: true}});
    }


  }

  

  find (key) {
    
    key = parseFloat(key);
    this.is_rebalanced_tree();
    this.ani.set_function_call("find", [key]);
    this.set_state();
    
    let ani = this.ani;
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
    });
    
    this.clear_after_func_ani(false);
    ani.run_animation();

  }


  is_rebalanced_tree() {
    if (this.is_rebalance) {
      this.is_rebalance = false;
      this.ani.clear_animation();
    }
  }

  insert(key) {

    key = parseFloat(key);
    this.is_rebalanced_tree();
    this.ani.set_function_call("insert", [key]);
    this.set_state();
    

    let i;
    let type;
    let e, parent;
    let text;
    let ani = this.ani,
        g = this.g;
    let rv = this.bst_tree.insert(key);
    let path = rv.path,
        node = rv.node;

    
    

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
      });

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
      });

      if (e != null) {
        ani.add_sequence_ani({
          target: e.ani_line,
          prop: {fade_in: true, strokeStyle: "red", visible: true, time: ANIMATION_TIME * 2}
        });
      }

    /* otherwise, we already have it in the tree */
    } else {
      ani.add_sequence_ani({
        text: "Key {} is already in the tree. Insert({}) = False".format_b(key, key)
      });
    }


    ani.add_sequence_ani({
      pause:1,
      rev_action: {params: {g:g, path:rv.path}, func: color_path},
      concurrence:true
    });
    this.clear_after_func_ani(false);
    
    ani.run_animation();
  }

}
