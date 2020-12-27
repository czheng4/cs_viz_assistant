/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/24/2020
  last modified 12/26/2020
*/

const BLUE_SHADOW_PROP = {fade_in:true, strokeStyle: "blue", time:1, lineWidth:1, shadowColor:"#0000FF", shadowBlur:15};
const RED_SHADOW_PROP = {fade_in:true, strokeStyle: "red", time:1, lineWidth:1, shadowColor:"#FF0000", shadowBlur:15};
const BLUE_LINE = {fade_in:true, strokeStyle:"blue", time:1};
const RED_LINE = {fade_in:true, strokeStyle:"red", time:1};

const COLLISION_LINEAR = 0b1;
const COLLISION_QUADRATIC = 0b10; 
const COLLISION_DOUBLE = 0b100; 
class tableEntry {
  constructor(key, rect, index) {
    this.key = key;
    this.rect = rect;
    this.index = index;
    this.tombstone = false;
  }
}


class oaHashAnimation {
  constructor(size) {
    this.ani = new Animation();
    this.size = size;
    this.height = 30;
    this.width = 55;
    this.line_length = 30;
    
    this.collision = COLLISION_QUADRATIC;
    // this.line_width = 30;
    this.rects = [];
    this.tables = [];

    if (size != 0) {
      this.func_text = new Text("", 0, -30, 100, "13px Arial");
      this.ani.add_object(this.func_text);
      
      this.create_rects();
      for (let i = 0; i < size; i++) {
        this.tables.push(new tableEntry(null, this.rects[i], i));
      }
    }
  }



  set_state() {
    /* the entire state is composed of the state of graph, Animation and algorithm */
    let state = this.deep_copy(); // this copy the state of algorithm
    state.ani = this.ani.deep_copy(); // this copy the state of animation
   
    this.ani.set_state(state);
  }

  deep_copy() {
    let hash = new oaHashAnimation(0);
    let from, entry;
    hash.size = this.size;
    hash.rects = this.rects;
    hash.func_text = this.func_text;


    for (let i = 0; i < this.tables.length; i++) {
      from = this.tables[i];
      entry = new tableEntry(from.key, from.rect, from.index);
      entry.tombstone = from.tombstone;
      hash.tables.push(entry);
    }
    return hash;
  }
  create_rects() {
    let i;
    let x,y;
    let rect, line;
    let ani = this.ani;
    let line_width = 1;

    y = 10;
    for (i = 0; i < this.size; i++) {
      x = i * (this.width + line_width);
      rect = new Rect(x, y, this.width, this.height, i, [""]);
      rect.fillStyles = ["#F3F5F9"];
      rect.label = i;
      rect.label_position = "top";
     
      this.rects.push(rect);
      ani.add_object(rect);
    }

    ani.draw();
  }

  ascii_hash(str) {
    let rv = 0;
    for (let i = 0; i < str.length; i++) {
      rv += str.charCodeAt(i);
    }
    return rv;
  }

  find(key, run = true, find_text = "Find key {}", call_from_insert = false) {
    let index, hash;
    let entries, entry, rect;
    let i;
    let size = this.size;
    let ani = this.ani;

    if (run) {
      this.func_text.text = "Call find({})".format(key);
      this.set_state();
      ani.set_function_call("find", [key]);
    }

    this.clear_pre_prop();
    hash = this.ascii_hash(key);
    index = hash % this.size;
    this.pre_key_index = index;
    rect = this.rects[index];


    ani.add_sequence_ani({
      text: "Compute the {}'s hash table index. H({}) = {} % {} = {}".format_b(key, key, hash, this.size, index),
      target: rect,
      prop: deep_copy(BLUE_SHADOW_PROP)
    });

    ani.add_sequence_ani({prop:{step: true}});

    for (i = 0; i < this.tables.length; i++) {
      if (this.collision == COLLISION_LINEAR) {
        entry = this.tables[(index + i) % size];
      } else if(this.collision == COLLISION_QUADRATIC) {

        entry = this.tables[(index + i * i) % size];
        // if (entry.index == index && i != 0) {
        //   ani.add_sequence_ani({
        //     text: "Couldn't insert key {}".
        //   })
        // } 
      }
      /* insertion */
      if (call_from_insert && entry.tombstone == true) break;

      /* deletion and find. If the tomstone is true, we still need to keep looking */
      if (entry.tombstone == false && entry.key == null) break;

      if (entry.key == key) {
        ani.add_sequence_ani({
          text: find_text.format_b(key),
          target: entry.rect,
          prop: deep_copy(RED_SHADOW_PROP),
          concurrence: true,
        });
        this.func_text_rev();
        if (run) ani.run_animation();
        return entry;
      } else {
        ani.add_sequence_ani({
          text: "Move to tabele entry {}".format_b(entry.index),
          target: entry.rect,
          prop: deep_copy(BLUE_SHADOW_PROP),
        });
        ani.add_sequence_ani({prop:{step:true}});
      }
    }


   

    if (run) {
      ani.add_sequence_ani({
        text: "Couldn't find key {}".format_b(key),
        pause:1,
      })
      this.func_text_rev();
      ani.run_animation();
    }

    
    return entry;
  }


  func_text_rev() {
    this.ani.add_sequence_ani({
      target: this.func_text,
      prop: {text: this.func_text.text, time:1},
    });
  }

  insert(key) {
    let index, hash;
    let rect,line, entries, entry, new_rect;
    let actual_line_length, i;
    let x,y;
    let ani = this.ani;

    ani.set_function_call("insert", [key]);
    this.set_state();
    this.func_text.text = "Call insert({})".format(key);


    hash = this.ascii_hash(key);
    index = hash % this.size;
    // this.pre_key_index = index;
    rect = this.rects[index];

    entry = this.find(key, false, "key {} is already in table. Do nothing", true);
    if (entry.key == key) {
      this.func_text_rev();
      ani.run_animation();
      return;
    }
    
    console.log(entry);
    entry.key = key;
    entry.tombstone = false;
    ani.add_sequence_ani({
      text: "Add key {} into index {} of hash table".format_b(key, entry.index),
      target: entry.rect,
      prop: deep_copy(RED_SHADOW_PROP)
    })
    ani.add_sequence_ani({
      target: entry.rect,
      prop: {"text_fade_in": {text: key, index: 0}},
    })

    this.func_text_rev();
    ani.run_animation();

  }


  delete(key) {
    let index, hash;
    let rect,line, entries, entry, new_rect;
    let actual_line_length, i;
    let x,y;
    let ani = this.ani;

    ani.set_function_call("delete", [key]);
    this.set_state();
    this.func_text.text = "Call delete({})".format(key);

    hash = this.ascii_hash(key);
    index = hash % this.size;
    rect = this.rects[index];
    entries = this.tables[index];

    entry = this.find(key, false);
    if (entry.key == null) {
      ani.add_sequence_ani({
        text:"Couldn't find key {} to delete".format_b(key),
        pause:1,
      });
      ani.run_animation();
      return;
    }

    /* delete the entry */
    ani.add_sequence_ani({prop:{step:true, time:1}});
    ani.add_sequence_ani({
      text: "Delete key {}".format_b(key),
      target:entry.rect,
      prop: {"text_fade_in": {index:0, text: "deleted"}, time:1},
    });
    entry.tombstone = true;
    entry.key = null;
    
    this.func_text_rev();
    ani.run_animation();
  }

  clear_pre_prop() {
    for (let i = 0; i < this.tables.length; i++) {
      this.tables[i].rect.ctx_prop = deep_copy(DEFAULT_RECT_CTX);
    }
  }

  fade_in(line, obj) {
    for (let i = 0; i < objs.length; i++) {
      this.ani.add_sequence_ani({
        target: objs[i],
        prop: {fade_in:true, visible:true},
        concurrence: i != objs.length - 1
      })
    }
  }

}