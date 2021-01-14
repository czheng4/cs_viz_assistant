/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/24/2020
  last modified 12/30/2020
*/

const BLUE_SHADOW_PROP = {fade_in:true, strokeStyle: "blue", time:1, lineWidth:1, shadowColor:"#0000FF", shadowBlur:15};
const RED_SHADOW_PROP = {fade_in:true, strokeStyle: "red", time:1, lineWidth:1, shadowColor:"#FF0000", shadowBlur:15};
const BLUE_LINE = {fade_in:true, strokeStyle:"blue", time:1};
const RED_LINE = {fade_in:true, strokeStyle:"red", time:1};

const COLLISION_LINEAR = "linear";
const COLLISION_QUADRATIC = "quadratic";
const COLLISION_DOUBLE = "double";

const ASCII_HASH = "ASCII";
const DJB_HASH = "DJB";
const MANUAL_HASH = "MANUAL";

class tableEntry {
  constructor(key, rect, index, tombstone) {
    this.key = key;
    this.rect = rect;
    this.index = index;
    this.tombstone = tombstone;
  }
}


class oaHashAnimation {
  constructor(size, hash_func = null, collision = null) {
    this.ani = new Animation();
    this.size = size;
    this.height = 30;
    this.width = 55;
    this.line_length = 30;
    
    this.collision = collision;
    this.hash_func = hash_func;
    // this.line_width = 30;
    this.rects = [];
    this.tables = [];

    this.manual_hash_tables = {};
    this.manual_s_hash_tables = {};
    this.tombstone = new Object();
    this.key_size = 0;
    if (size != 0) {
      this.func_text = new Text("", 0, -15, 100, "13px Arial");
      this.func_text.text_align = "left";
      this.func_text.ctx_prop.fillStyle = "red";
      this.ani.add_object(this.func_text);

      
      this.create_rects();
      for (let i = 0; i < size; i++) {
        this.tables.push(new tableEntry(null, this.rects[i], i, null));
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
    let hash = new oaHashAnimation(0, this.hash_func, this.collision);
    let from, entry;
    hash.size = this.size;
    hash.rects = this.rects;
    hash.func_text = this.func_text;

    for (let i = 0; i < this.tables.length; i++) {
      from = this.tables[i];
      entry = new tableEntry(from.key, from.rect, from.index, from.tombstone);
      hash.tables.push(entry);
    }
    hash.manual_hash_tables = deep_copy(this.manual_hash_tables);
    hash.manual_s_hash_tables = deep_copy(this.manual_s_hash_tables);
    hash.tombstone = this.tombstone;
    hash.key_size = this.key_size;
    return hash;
  }
  create_rects() {
    let i;
    let x,y;
    let rect, line;
    let ani = this.ani;
    let line_width = 1;

    y = 30;
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
  // please refer to http://www.cse.yorku.ca/~oz/hash.html 
  djb_hash(str) {
    let i;
    let h = 5381;
    for (i = 0; i < str.length; i++) {
      h = (h << 5) + h + str.charCodeAt(i);
    }
    return h >>> 0;
  }

  ascii_hash(str) {
    let rv = 0;
    for (let i = 0; i < str.length; i++) {
      rv += str.charCodeAt(i);
    }
    return rv;
  }

  get_hash(str, hash_val = null) {
    //console.log(this.manual_hash_tables, hash_val);
    if (this.hash_func == ASCII_HASH) return this.ascii_hash(str);
    else if(this.hash_func == DJB_HASH) return this.djb_hash(str);
    else if (this.hash_func == MANUAL_HASH) {
    
      if (hash_val != null && str in this.manual_hash_tables && hash_val != this.manual_hash_tables[str]) {
       
        $("#elaboration_text").text("");
        $("#elaboration_text").append(
          "Hash value {} does not match the value {} you previously enter for the same key".format_b(hash_val, this.manual_hash_tables[str])
        );
        return -1;
      } else {
        if (hash_val != null) this.manual_hash_tables[str] = parseInt(hash_val);
        if (str in this.manual_hash_tables) return this.manual_hash_tables[str];
        else return -1;
      }
    }
  }

  get_second_hash(str, hash_val = null) {
    if (this.collision != COLLISION_DOUBLE) return 0;
    if (this.hash_func == ASCII_HASH) return this.djb_hash(str);
    else if (this.hash_func == DJB_HASH) return this.ascii_hash(str);
    else if (this.hash_func == MANUAL_HASH) {
      if (hash_val != null && str in this.manual_s_hash_tables && hash_val != this.manual_s_hash_tables[str]) {
       
        $("#elaboration_text").text("");
        $("#elaboration_text").append(
          "Second hash value {} does not match the value {} you previously enter for the same key".format_b(hash_val, this.manual_s_hash_tables[str])
        );
        return -1;
      } else {
        if (hash_val != null) this.manual_s_hash_tables[str] = parseInt(hash_val);
        if (str in this.manual_s_hash_tables) return this.manual_s_hash_tables[str];
        else return -1;
      }
    }
  }

  /* when run is true we are acutally calling find otherwise we may call find from insert and delete function
     This is usually not how we implement hash function, but it's easy for us to do animation.
  */
  find(key, run = true, find_text = "Find key {}", call_from_insert = false) {
    let index, hash, s_hash;
    let entries, entry, rect, insert_entry;
    let i;
    let size = this.size;
    let ani = this.ani;
    let sentinel;
    let e_text;


    /* check hash values */
    hash = this.get_hash(key);
    s_hash = this.get_second_hash(key);
    if (hash == -1 || s_hash == -1) {
      $("#elaboration_text").text("For munally entering hash value, the key must be what you have entered before");
      return;
    }

    /* for actually calling find function */
    if (run) {
      this.func_text.text = "Call find({}).".format(key);
      this.set_state();
      ani.set_function_call("find", [key]);
    }
    this.clear_pre_prop();
   
    
    index = hash % this.size;
    rect = this.rects[index];

    this.func_text.text += "    H({}) = {} % {} = {}.".format(key, hash, this.size, index);
    if (this.collision == COLLISION_DOUBLE) {
      e_text = "First hash function: H({}) = {} % {} = {}.".format_b(key, hash, this.size, index);
      e_text += "&emsp;Second hash function: H({}) = {} % {} = {}".format_b(key, s_hash, this.size, s_hash % this.size);
      this.func_text.text += "    H{}({}) = {} % {} = {}.".format(String.fromCharCode(8322), key, s_hash, this.size, s_hash % this.size);
      s_hash %= this.size;
    } else {
      e_text = "Hash function: H({}) = {} % {} = {}".format_b(key, hash, this.size, index);
    }

    ani.add_sequence_ani({
      text: e_text,
      target: rect,
      prop: update_dict(BLUE_SHADOW_PROP, {step:true}),
    });

    sentinel = index;
    insert_entry = null;
    for (i = 0; i < 0xffffffff; i++) {
      if (this.collision == COLLISION_LINEAR) {
        entry = this.tables[(index + i) % size];
        e_text = "Check entry ({} + {}) % {} = {}. ".format_b(index, i, size, entry.index);

      } else {
        if(this.collision == COLLISION_QUADRATIC) {

          entry = this.tables[(index + i * i) % size];
          e_text = "Check entry ({} + {}) % {} = {}. ".format_b(index, i + "<sup>2</sup>", size, entry.index);

        } else if (this.collision == COLLISION_DOUBLE) {
          //console.log((index + s_hash * i) % size);
          entry = this.tables[(index + s_hash * i) % size];
          e_text = "Check entry ({} + {} * {}) % {} = {}. ".format_b(index, s_hash, i, size, entry.index);
        }
      }
      /* check if we go back to the original location */
      if (i != 0 && sentinel == entry.index) {

        ani.add_sequence_ani({
          text: e_text + "Back to the original entry {}. Done with searching".format_b(sentinel),
          pause:1,
        });
        this.color_entry(entry);
        if (run || insert_entry != null) break;
        else return null;
      }
     
      /* we can insert to a deleted slot before. But we need to keep searching in case the key is already
         int the table */
      if (insert_entry == null && call_from_insert && entry.tombstone == this.tombstone) {
        insert_entry = entry;
      }
      
      /* If the tomstone is set or key is set, we still need to keep looking */
      if (entry.tombstone == null && entry.key == null) {
        ani.add_sequence_ani({
          target:entry.rect,
          text: e_text + " It's an empty slot. Done with searching",
          prop: deep_copy(BLUE_SHADOW_PROP),
        });
        this.color_entry(entry);
        break;
      }

      if (entry.key == key) {
        ani.add_sequence_ani({
          text: e_text + find_text.format_b(key),
          target: entry.rect,
          prop: deep_copy(RED_SHADOW_PROP),
          concurrence: true,
        });
        this.func_text_rev();
        if (run) ani.run_animation();
        return entry;
      } else {
        ani.add_sequence_ani({
          text: e_text + " Entry {} is taken or deleted before. Keep searching".format_b(entry.index),
          target: entry.rect,
          prop: deep_copy(BLUE_SHADOW_PROP),
        });
        this.color_entry(entry);
      }
    }

    if (run) {
      ani.add_sequence_ani({
        text: "Couldn't find key {}".format_b(key),
        pause:1,
      });
      this.func_text_rev();
      ani.run_animation();
    } else if (call_from_insert) {

      if (insert_entry != null) {
        entry = insert_entry;
        ani.add_sequence_ani({
          target:entry.rect,
          text: "Index {} is the first deleted slot along the way we find empty slot. We insert key here".format_b(entry.index),
          prop: deep_copy(BLUE_SHADOW_PROP),
        });
        this.color_entry(entry);

      }
    }

    return entry;
  }


  func_text_rev() {
    this.ani.add_sequence_ani({
      target: this.func_text,
      prop: {text: this.func_text.text, time:1},
    });
  }

  insert(key, hash_val1, hash_val2) {
    let index, hash, s_hash;
    let entry, new_rect;
    let ani = this.ani;


    /* check if the table is full */
    if (this.key_size == this.size) {
      $("#elaboration_text").text("The table is full");
      return;
    }
    /* install hash values */
    hash = this.get_hash(key, hash_val1);
    s_hash = this.get_second_hash(key, hash_val2);

    if (hash == -1 || s_hash == -1) {
      return;
    }

    ani.set_function_call("insert", [key, hash_val1, hash_val2]);
    this.set_state();
    this.func_text.text = "Call insert({})".format(key);


    entry = this.find(key, false, "key {} is already in table. Do nothing", true);
    if (entry == null) {
      ani.add_sequence_ani({
        text: "Couldn't insert key {}".format_b(key),
      });
      ani.run_animation();
      return;

    } else if (entry.key == key) {
      this.func_text_rev();
      ani.run_animation();
      return;
    }
    
    entry.key = key;
    entry.tombstone = null;
    this.key_size++;
    ani.add_sequence_ani({
      text: "Add key {} into index {} of hash table".format_b(key, entry.index),
      target: entry.rect,
      prop: deep_copy(RED_SHADOW_PROP)
    });
    ani.add_sequence_ani({
      target: entry.rect,
      prop: {"text_fade_in": {text: key, index: 0}},
    });

    this.func_text_rev();
    ani.run_animation();

  }
  input_check(key, hash_val1, hash_val2, insert = false) {
    if (key == "") return "key is empty";
    if (key == "deleted") return "key \"{}\" is reserved for animation purpose".format_b("deleted");
    if (this.hash_func == MANUAL_HASH && insert) {
      if (hash_val1 == "") return "First hash value is empty";
      if (this.collision == COLLISION_DOUBLE && hash_val2 == "") return "Second hash value is empty";
      if (this.collision == COLLISION_DOUBLE && parseInt(hash_val2) <= 0) return "Second Hash value must > 0";
    }
    return "";
  }

  delete(key) {
    let hash, s_hash;
    let entry;
    let ani = this.ani;

    hash = this.get_hash(key);
    s_hash = this.get_second_hash(key);
    if (hash == -1 || s_hash == -1) {
      $("#elaboration_text").text("For munally entering hash value, the key must be what you have entered before");
      return;
    }


    ani.set_function_call("delete", [key]);
    this.set_state();
    this.func_text.text = "Call delete({})".format(key);

    entry = this.find(key, false);
    if (entry == null || entry.key == null) {
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
    this.key_size--;
    entry.tombstone = this.tombstone;
    entry.key = null;
    
    this.func_text_rev();
    ani.run_animation();
  }



  clear_pre_prop() {
    for (let i = 0; i < this.tables.length; i++) {
      this.tables[i].rect.ctx_prop = deep_copy(DEFAULT_RECT_CTX);
    }
  }


  color_entry(entry, time = ANIMATION_TIME, color = "lightblue") {
    this.ani.add_sequence_ani({
      target: entry.rect,
      prop: {"fillStyle": [color], time:time},
      concurrence:true,
    });
    this.ani.add_sequence_ani({prop:{step:true, time: time - 2}});
  }


  fade_in(line, obj) {
    for (let i = 0; i < objs.length; i++) {
      this.ani.add_sequence_ani({
        target: objs[i],
        prop: {fade_in:true, visible:true},
        concurrence: i != objs.length - 1
      });
    }
  }

}