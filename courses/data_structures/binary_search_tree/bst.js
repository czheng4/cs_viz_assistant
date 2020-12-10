/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/28/2020
  last modified 12/05/2020
*/

// for node type
T_ROOT_NODE = 0b1
T_LEFT_NODE = 0b10;
T_RIGHT_NODE = 0b100;
T_UNKNOWN = 0b1000;

// for deletion
T_NO_LEFT = 0b1;
T_NO_RIGHT = 0b10;
T_NO_BOTH = 0b100;
T_BOTH = 0b1000;



function reposition_node (dict) {
  let n, i, type;
  let gap_x = 30;
  let path = dict.path,
      node = dict.node;

  if ("reverse" in dict) gap_x = -gap_x;
  if (node == null) return;
  type = node.type;
  for (i = path.length - 1; i >= 0; i--) {
    n = path[i];

    if (n.type == T_LEFT_NODE && type == T_RIGHT_NODE) {
      type = T_LEFT_NODE;
      n.ani_node.ani_circle.propagation = true;
      n.ani_node.ani_circle.stop_propagation = {};
      n.ani_node.ani_circle.stop_propagation[n.parent.key] = true;
      n.ani_node.ani_circle.move(-gap_x, 0);
    }
    if (n.type == T_RIGHT_NODE && type == T_LEFT_NODE) {
      type = T_RIGHT_NODE;
      n.ani_node.ani_circle.propagation = true;
      n.ani_node.ani_circle.stop_propagation = {};
      n.ani_node.ani_circle.stop_propagation[n.parent.key] = true;
      n.ani_node.ani_circle.move(gap_x, 0);
    }
  }

  MAIN_A.ani.draw(true);

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
    this.gap_y = 50;
    this.gap_x = 30;
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
    // let i, type;

    // this.make_key();
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
      ani_node = g.get_node(key);

    } else if (key < parent.key) {
      new_node.type = T_LEFT_NODE;
      parent.left = new_node;

      x = p_ani_node.ani_circle.x - this.gap_x;
      y = p_ani_node.ani_circle.y + this.gap_y;
      ani_node = g.get_node(key, x, y);
     
    } else {
      new_node.type = T_RIGHT_NODE;
      parent.right = new_node;

      x = p_ani_node.ani_circle.x + this.gap_x;
      y = p_ani_node.ani_circle.y + this.gap_y;
      console.log(p_ani_node.ani_circle, x, y);
      ani_node = g.get_node(key, x, y);
    }

    e = null;
    if (parent != null) {
      e = g.get_edge_by_name(parent.key, new_node.key);
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
    let parent, deleted_node;
    let path = [];
    let lm_path = [];
    let delete_case;

    while (n != null) {
      path.push(n);
      if (n.key == key) break;
      n = (key < n.key) ? n.left : n.right;
    }
    if (n == null) return {delete: false, path:path};

    parent = n.parent;
    deleted_node = n;

    if (n.left == null && n.right == null) { 
      if (parent != null) {
        if (parent.left == n) parent.left = null;
        else if (parent.right == n) parent.right = null;
      } 

      if (parent == null) this.root = null;
      delete_case = T_NO_BOTH;
    
    } else if (n.left == null || n.right == null) {
      tmp_n = (n.left != null)? n.left : n.right;
      delete_case = (n.left == null)? T_NO_LEFT : T_NO_RIGHT;
      if (parent != null) {
        if (parent.left == n) parent.left = tmp_n;
        else if (parent.right == n) parent.right = tmp_n;
      }

      tmp_n.parent = parent;
      if (parent == null) this.root = tmp_n;

    } else {
      // find the left right-most node
      for (tmp_n = n.left; tmp_n.right != null; tmp_n = tmp_n.right) {
        path.push(tmp_n);
      }

      n.key = tmp_n.key;
      this.delete(tmp_n.key);
      deleted_node = tmp_n;
      delete_case = T_BOTH;
      // tmp_n.parent.right = null;

    }

    return {delete: true, path:path, node: n, deleted_node: deleted_node, delete_case: delete_case};


  }


  
}





class binarySearchTreeAnimation {

  delete(key) {
    key = parseFloat(key);

    this.ani.set_function_call("delete", [key]);
    this.set_state();


    let rv = this.bst_tree.delete(key);
    let n, e, e1, parent, left, right, c, child;
    let path;
    let ani = this.ani,
        g = this.g;


    path = rv.path;

    this.reset_graph();
    this.find_path_animation(path, key, "pink");

    n = rv.deleted_node;
    if (rv.delete_case == T_NO_BOTH) {
      


      if (n.parent != null) {
        e = g.get_edge_by_name(n.parent.key, n.key);
        ani.add_sequence_ani({
          target: e.ani_line,
          text: "Delete the node whose key is " + key,
          prop: {fade_out: true, time: ANIMATION_TIME * 2},
          concurrence: true
        })
      }

      ani.add_sequence_ani({
        target: n.ani_node.ani_circle,
        prop: {fade_out: true, time: ANIMATION_TIME * 2},
      })
      
    } else if (rv.delete_case == T_NO_RIGHT || rv.delete_case == T_NO_LEFT) {
      parent = n.parent;


      left = n.left;
      right = n.right;

      child = rv.delete_case == T_NO_RIGHT? n.left : n.right;
      e = g.get_edge_by_name(parent.key, n.key);

      e1 = g.get_edge_by_name(n.key, child.key);
  


    
      



      /* set deleted node's parent edge to its left node */
      ani.add_sequence_ani({
        text: "Set node {}'s left to node {}. Set node {}'s parent to node {}".format(parent.key, left.key, left.key, parent.key),
        target: e.ani_line,
        prop: {p: child.ani_node.ani_circle.points[0], ani: this.ani, type: "pivot", time: ANIMATION_TIME, step:true}
      })

      /* remove deleted node */
      ani.add_sequence_ani({
        text: "Free node {}".format(n.key),
        target: n.ani_node.ani_circle,
        prop: {"fade_out": true},
        concurrence:true
      })

      ani.add_sequence_ani({
        target: e1.ani_line,
        prop: {"fade_out": true},
        // action: we want to remove the actual line and node object.
      })

      c = n.ani_node.ani_circle;
      ani.add_sequence_ani({
        target: child.ani_node.ani_circle,
        prop: {p: new Point(c.x, c.y)},
      })

     // remove the actuial object.

    }

    ani.run_animation();
  }


  constructor() {
    this.ani = new Animation();
    this.g = new Graph(this.ani, "directed");
    this.bst_tree = new BSTree(this.g);
    this.gap_y = 50;
    this.gap_x = 30;
  }

  deep_copy() {
    let bst = new binarySearchTreeAnimation();
    bst.bst_tree = this.bst_tree.deep_copy();
    bst.g = this.g;
    bst.ani = this.ani;
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
    
    let i, n, n2, e;
    let text;
    let ani = this.ani,
        g = this.g;

    for (i = 0; i < path.length; i++) {
      n = path[i];
      if (key < n.key) text = "Key {}  <  {}. Go left".format(key, n.key);
      else if (key > n.key) text = "Key {}  >  {}. Go right".format(key, n.key);
      else text = "Key {}  =  {}.".format(key, n.key);

      if (i != path.length - 1) {
        n2 = path[i + 1];
        e = g.get_edge_by_name(n.key, n2.key);
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

    this.reset_graph();
    ani.clear_animation();
   
    
    this.find_path_animation(path, key);

    if (find) {
      ani.add_sequence_ani({
        target: path[path.length-1].ani_node.ani_circle,
        prop : {fade_in: true, fillStyle: "pink", visible:true, time: 1},
      })
    }

    ani.add_sequence_ani({
      puase:1,
      text: "{} key {} in the tree".format(find? "Find":"Couldn't find", key)
    })
    
    ani.run_animation();
    

  }



  insert(key) {
    let i;
    let type;
    let n, e, n2;
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
    
    if (node != null) {
      ani.add_sequence_ani({
        pause:1,
        action: {params: rv, func: reposition_node},
        rev_action: {params: update_dict({reverse:true}, rv), func: reposition_node}
      })

      e = rv.edge;
      ani.add_sequence_ani({
        target: node.ani_node.ani_circle,
        text: "Add new node keyed on {}".format(key),
        prop : {fade_in: true, fillStyle: "pink", visible:true, time: ANIMATION_TIME * 2},
        concurrence: (e != null)
      })
      if (e != null) {
        ani.add_sequence_ani({
          target: e.ani_line,
          prop: {fade_in: true, strokeStyle: "red", visible: true, time: ANIMATION_TIME * 2}
        })
      }
    } else {
      ani.add_sequence_ani({
        text: "Key {} is already in the tree".format(key)
      });
    }
    
    ani.run_animation();
  }

}