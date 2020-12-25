/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/24/2020
  last modified 12/24/2020
*/

function p(t) {
  console.log(t);
} 

class tableEntry {
  constructor(key, rect, line) {
    this.key = key;
    this.rect = rect;
    this.line = line;
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
    this.create_rects();
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
      // if (i != this.size - 1) {
      //   line = new quadraticCurve(new Point(x + this.width, y + this.height / 2), new Point(x + this.width + this.line_width, y + this.height / 2), 0);
      //   line.angle_length = 8;
      //   ani.add_object(line);
      // }
      console.log(rect);
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
  insert(key) {
    let index, hash;
    let rect,line, entries, entry, new_rect;
    let actual_line_length, i;
    let x,y;
    let ani = this.ani;

    this.clear_pre_prop();
    ani.clear_animation();
    hash = this.ascii_hash(key);
    index = hash % this.size;
    this.pre_key_index = index;
    rect = this.rects[index];
    entries = this.tables[index];

    ani.add_sequence_ani({
      target: rect,
      prop: {fade_in:true, strokeStyle: "blue", time:1, lineWidth:1, shadowColor:"#0000FF", shadowBlur:15},
    })

    for (i = 0; i < entries.length; i++) {
      entry = entries[i];

      ani.add_sequence_ani({
        target:entry.line,
        prop: {fade_in:true, time:1, strokeStyle: "blue"},
        concurrence:true
      })
      ani.add_sequence_ani({
        target: entry.rect,
        prop: {fade_in:true, strokeStyle: "blue", time:1},
      })

      if (entry.key == key) {
        ani.add_sequence_ani({
          text: "key {} is already in table".format_b(key),
          pause:1,
        })
        ani.run_animation();
        return;
      }
    }

    if (entries.length == 0) {
      x = rect.x + rect.width / 2;
      y = rect.y + rect.height / 2;
      actual_line_length = this.line_length + rect.height / 2;
    }
    if (entries.length > 0) {
      rect = entry.rect;
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
      target:line,
      prop: {fade_in:true, visible:true, strokeStyle: "red"},
      concurrence:true
    })
    ani.add_sequence_ani({
      target:new_rect,
      prop: {fade_in:true, visible:true, strokeStyle: "red", shadowColor:"#FF0000", shadowBlur:15},
    })

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