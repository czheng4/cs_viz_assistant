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
class tableEntry {
  constructor(key, rect, line) {
    this.key = key;
    this.rect = rect;
    this.line = line;
    this.index = -1;
  }
}

class scHashAnimation {
  constructor(size) {
    this.ani = new Animation();
    this.size = size;
    this.height = 30;
    this.width = 55;
    this.line_length = 30;
    // this.line_width = 30;
    this.pre_key_index = -1;
    this.rects = [];
    this.tables = [];

    for (let i = 0; i < size; i++) this.tables.push([]);
    this.ref_count = size;
    if (size != 0) {
      this.func_text = new Text("", 0, -30, 100, "13px Arial");
      this.ani.add_object(this.func_text);
      this.create_rects();
    }
  }



  set_state() {
    /* the entire state is composed of the state of graph, Animation and algorithm */
    let state = this.deep_copy(); // this copy the state of algorithm
    state.ani = this.ani.deep_copy(); // this copy the state of animation
   
    this.ani.set_state(state);
  }

  deep_copy() {
    let schash = new scHashAnimation(0);
    let entries;
    schash.size = this.size;
    schash.rects = this.rects;
    schash.pre_key_index = this.pre_key_index;
    schash.func_text = this.func_text;
    for (let i = 0; i < this.tables.length; i++) {
      entries = [];
      for (let j = 0; j < this.tables[i].length; j++) entries.push(this.tables[i][j]);
      schash.tables.push(entries);
    }
    schash.ref_count = this.ref_count + 10;
    return schash;
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


  find(key, run = true, find_text = "Find key {}") {
    let index, hash;
    let entries, entry, rect;
    let i;
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
    entries = this.tables[index];

    ani.add_sequence_ani({
      text: "Compute the {}'s hash table index. H({}) = {} % {} = {}".format_b(key, key, hash, this.size, index),
      target: rect,
      prop: deep_copy(BLUE_SHADOW_PROP)
    });

    ani.add_sequence_ani({prop:{step: true}});

    for (i = 0; i < entries.length; i++) {
      entry = entries[i];
      if (entry.key == key) {
        entry.index = i;
        ani.add_sequence_ani({
          text: find_text.format_b(key),
          target: entry.line,
          prop:deep_copy(RED_LINE),
          concurrence:true,
        });
        ani.add_sequence_ani({
          target: entry.rect,
          prop: deep_copy(RED_SHADOW_PROP),
          concurrence: true,
        });
        this.func_text_rev();
        if (run) ani.run_animation();
        return entry;
      } else {
        ani.add_sequence_ani({
          text: "Traverse the list. Key = {}".format_b(entry.key),
          target:entry.line,
          prop: deep_copy(BLUE_LINE),
          concurrence:true
        });
        ani.add_sequence_ani({
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

    
     
    
    return null;

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
    // this.clear_pre_prop();
    // ani.clear_animation();
    hash = this.ascii_hash(key);
    index = hash % this.size;
    // this.pre_key_index = index;
    rect = this.rects[index];
    entries = this.tables[index];

    if (this.find(key, false, "key {} is already in table. Do nothing") != null) {
      this.func_text_rev();
      ani.run_animation();
      return;
    }
   
    if (entries.length == 0) {
      x = rect.x + rect.width / 2;
      y = rect.y + rect.height / 2;
      actual_line_length = this.line_length + rect.height / 2;
    }
    if (entries.length > 0) {
      rect = entries[entries.length - 1].rect;
      x = rect.x + rect.width / 2;
      y = rect.y + rect.height;
      actual_line_length = this.line_length;
    }
    line = new quadraticCurve(new Point(x, y), new Point(x, y + actual_line_length), 0);
    line.angle_length = 8;
    line.visible = false;
    ani.add_object(line);

    new_rect = new Rect(rect.x, y + actual_line_length, this.width, this.height, this.ref_count++, [key]);
    ani.add_object(new_rect);
    new_rect.visible = false;

    entries.push(new tableEntry(key, new_rect, line));
    ani.add_sequence_ani({
      text: "Add key {} into index {} of hash table".format_b(key, index),
      target:line,
      prop: {fade_in:true, visible:true, strokeStyle: "red"},
      concurrence:true
    });
    ani.add_sequence_ani({
      target:new_rect,
      prop: {fade_in:true, visible:true, strokeStyle: "red", shadowColor:"#FF0000", shadowBlur:15},
    });

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
    if (entry == null) {
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
      prop: {fade_out:true},
      concurrence:true
    });
    ani.add_sequence_ani({
      target:entry.line,
      prop:{fade_out: true}
    });

    let dy = -this.line_length - this.height;
    
    for (i = entry.index + 1; i < entries.length; i++) {

      rect = entries[i].rect;
      ani.add_sequence_ani({
        target: rect,
        prop: {p: new Point(rect.x, rect.y + dy), type : "parallel"},
        concurrence: true
      })
      ani.add_sequence_ani({
        target: entries[i].line,
        prop: {p: new Point(0, dy), type : "parallel"},
        concurrence: true
      })
      if (entry.index == 0 && i == 1){
        ani.add_sequence_ani({
          target: entries[i].line,
          action: {params: entries[i].line, func: function(line) {line.p1.y -= 15; }},
          rev_action:  {params: entries[i].line, func: function(line) {line.p1.y += 15; }},
        });
      }
    }
    entries.splice(entry.index, 1);
    this.func_text_rev();
    ani.run_animation();
  }

  clear_pre_prop() {
    let entries;
    let i;

    if (this.pre_key_index == -1) return;
    this.rects[this.pre_key_index].ctx_prop = deep_copy(DEFAULT_RECT_CTX);
    entries = this.tables[this.pre_key_index];
    for (i = 0; i < entries.length; i++) {
      entries[i].rect.ctx_prop = deep_copy(DEFAULT_RECT_CTX);
      entries[i].line.ctx_prop = deep_copy(DEFAULT_LINE_CTX);
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