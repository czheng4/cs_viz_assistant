/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  01/20/2021
  last modified 01/20/2021

*/


const ARROW_UNICODE = String.fromCharCode(8594);

class lcsAnimation {
  constructor(str1, str2) {
    
    let rect;
    let height = 30;
    let text;
    this.ani = new Animation();
    this.ani.step_by_step = $("#step_by_step").is(":checked");
    this.code_rect = new Rect(15, 30, 300, 180, "CODE_REF", 
                               ["def lcs(i, j):", 
                                "    if i < 0 || j < 0: return 0",
                                "    if cache[i][j] != 0: return cache[i][j]",
                                "    if str1[i] == str2[j]: cache[i][j] = 1 + lcs(i - 1, j - 1)",
                                "    else: cache[i][j] = Max(lcs(i - 1, j), lcs(i, j - 1))",
                                "    return cache[i][j]"]);

    this.code_rect.text_align = "left";
    this.code_rect.ctx_prop.lineWidth = 0.4;
    this.ani.add_object(this.code_rect);
    
    this.stacks = [];
    for (let i = 0; i < 12; i++) {
      rect = new Rect(400, height * 12 - i * height, 250, height, "STACK_" + i, [i]);
      rect.label = i;
      rect.label_position = "left";
      rect.text_align = "left";
      rect.fillStyles = ["lightblue"];
      rect.visible = false;
      this.stacks.push(rect);
      this.ani.add_object(rect);
    }
    text = new Text("Stack", 400, 13.5 * height , 250, "20px Arial");
    this.ani.add_object(text);

    this.str1 = str1;
    this.str2 = str2;
    
    this.call_lcs(str1, str2);
    this.ani.draw();  
    
  }

  
  rect_color_change(index, step = false) {
    let fill_styles = [];
    for (let i = 0; i < this.code_rect.text.length; i++) {
      fill_styles.push("#DDDDDD");
    }
    fill_styles[index] = "pink";
    this.ani.add_sequence_ani({
      target: this.code_rect,
      prop: {fade_in: true, time:1, fillStyle: fill_styles, step:step},
    });
  }

  get_table_id(row, col) {
    return "table_{}_{}".format(row, col);
  }

  make_table(str1, str2) {
    let table = $("#cache_table");
    let str = "";
    let id;
    let i, j;
    let a = [];

    this.table = [];

    table.text("");
    str = '<tr><th colspan={} >Cache</th></tr>'.format(str1.length + 2);

    str += '<tr><th rowspan = 2 colspan=2></th>'
    for (i = 0; i < str1.length; i++) str += '<th>{}</th>'.format(i);
    str += '</tr>';

    str += '<tr>';
    for (i = 0; i < str1.length; i++) str += '<th>{}</th>'.format(str1[i]);


    for (i = 0; i < str2.length; i++) {

      str += '<tr><th>{}</th><th>{}</th>'.format(i, str2[i]);
      a = [];
      for (j = 0; j < str1.length; j++) {
        a.push(0);
        str += '<td id={}>0</td>'.format(this.get_table_id(i, j));
      }
      this.table.push(a);
      str += '</tr>'
    }

    table.append(str);

  }
  

  table_ani(i, j, n, color = "pink", rev_color = "white") {

    let id;
    let rec_color;

    let f = (dict) => {
      let n = dict.n;
      let reverse = dict.reverse;
      let id = dict.id;
    

      if (reverse != undefined && reverse == true) {
        if (n != -1) $(id).text(0);
        $(id).css({ 
            "background-color": dict.rev_color,
        });
        return;
      }

      $(id).css({ 
        "background-color": dict.color,
      });

      if (n != -1) $(id).text(n);
    };

    id = "#" + this.get_table_id(i, j);
    this.ani.add_sequence_ani({
      pause:1,
      action: {params: {n:n, id: id, color:color}, func: f},
      rev_action: {params: {n:n, id: id, reverse:true, rev_color:rev_color}, func: f},
    });
    
  }

  call_lcs(str1, str2) {
    let rv;

    this.make_table(str2, str1);
    this.ani.clear_animation();
    console.log(this.table);
    rv = this.recursive_lcs(this.str1.length - 1, this.str2.length - 1);

    this.ani.add_sequence_ani({prop:{step:true, time:1}});
    this.ani.add_sequence_ani({
      text: "Done. lcs(\"{}\", \"{}\") = {}".format_b(str1, str2, rv),
    });
    this.ani.run_animation();
  }

  text_ani(text, step = false) {
    this.ani.add_sequence_ani({
      text: text,
      prop: {step: step, time : 1}
    });
  }
  pause_ani() {
    this.ani.add_sequence_ani({prop:{step:true, time:1}});
  }

  recursive_lcs (ptr1, ptr2, level = 0) {
    let str1 = this.str1,
        str2 = this.str2;
    let rv1, rv2;
    let rect = this.stacks[level];
    let ani = this.ani;
    let base_text, text;

    this.rect_color_change(0);
    text = "lcs({}, {})".format(ptr1, ptr2);
    ani.add_sequence_ani({
      target:rect,
      prop: {fade_in: true, text: [text],  visible:true }
    });
    this.text_ani("Call {}".format_b(text));
    ani.add_sequence_ani({prop: {step: true}});

    if (ptr1 < 0 || ptr2 < 0) {
      this.rect_color_change(1);
      this.text_ani("Return {}".format_b(0));
      this.fade_out(rect);
      return 0;
    }
    if (this.table[ptr1][ptr2] != 0) {
      this.rect_color_change(2);
      this.text_ani("Find {} in the table".format_b(text), true);
      this.fade_out(rect);
      this.text_ani("Return {}".format_b(this.table[ptr1][ptr2]));
      this.table_ani(ptr1, ptr2, -1, "yellow", "pink");
      return this.table[ptr1][ptr2];
    }
    if (str1[ptr1] == str2[ptr2]) {

      text += ARROW_UNICODE + "{} + lcs({}, {})".format(1, ptr1 - 1, ptr2 - 1);
      this.rect_color_change(3);
      this.rect_text_ani(rect, [text]);
      this.text_ani("str[{}] == str[{}]. We remove the last char of both str1 and str2 to solve it recursively".format_b(ptr1, ptr2), true)

      this.table[ptr1][ptr2] = 1 + this.recursive_lcs(ptr1 - 1, ptr2 - 1, level + 1);

      text += ARROW_UNICODE + "{} + {}".format(1, this.table[ptr1][ptr2] - 1);
      // this.rect_text_ani(rect, [text]);
      // this.pause_ani();


    } else {

      base_text = text;
      text = base_text + ARROW_UNICODE + "Max(lcs({}, {}), lcs({}, {}))".format(ptr1 - 1, ptr2, ptr1, ptr2 - 1);

      this.rect_color_change(4);
      this.rect_text_ani(rect, [text]);
      this.text_ani("str[{}] != str[{}]. We remove the last char of str1 or str2 to solve it recursively".format_b(ptr1, ptr2), true)
      

      rv1 = this.recursive_lcs(ptr1 - 1, ptr2, level + 1);
      text = base_text + ARROW_UNICODE + "Max({}, lcs({}, {}))".format(rv1, ptr1, ptr2 - 1);
      this.rect_text_ani(rect, [text]);
      this.rect_color_change(4);
      this.pause_ani();

      rv2 = this.recursive_lcs(ptr1, ptr2 - 1, level + 1);
      text = base_text + ARROW_UNICODE + "Max({}, {})".format(rv1,rv2);
      this.rect_text_ani(rect, [text]);
      this.rect_color_change(4);
      // this.pause_ani();

      this.table[ptr1][ptr2] = Math.max(rv1, rv2);
    }

    this.table_ani(ptr1, ptr2,  this.table[ptr1][ptr2]);
    text += ARROW_UNICODE + this.table[ptr1][ptr2];
    this.rect_text_ani(rect, [text]);

    this.pause_ani();
    this.fade_out(rect);
    this.text_ani("Return {}".format_b(this.table[ptr1][ptr2]));
    // this.rect_color_change(5);
    return this.table[ptr1][ptr2];
  }


  fade_out(rect, step = false) {
    this.ani.add_sequence_ani({
      target: rect,
      prop: {fade_out: true, time: ANIMATION_TIME, step:step}
    });
  }

  rect_text_ani(rect, text) {
    this.ani.add_sequence_ani({
      target: rect,
      prop: {text: text, time:1}
    });
  }
}
