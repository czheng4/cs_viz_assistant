/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  01/09/2021
  last modified 01/09/2021

*/


const ARROW_UNICODE = String.fromCharCode(8594);

// without memoization
class fibonacciAnimation {
  constructor() {
    
    let rect;
    let height = 30;
    let text;
    this.ani = new Animation();
    this.ani.step_by_step = $("#step_by_step").is(":checked");
    this.code_rect = new Rect(15, 30, 185, 90, "CODE_REF", 
                               ["def fib(n):", 
                                "    if n <= 1: return 1",
                                "    return fib(n - 1) + fib(n - 2)"]);

    this.code_rect.text_align = "left";
    this.code_rect.ctx_prop.lineWidth = 0.4;
    this.ani.add_object(this.code_rect);

    this.stacks = [];
    for (let i = 0; i < 12; i++) {
      rect = new Rect(300, height * 12 - i * height, 250, height, "STACK_" + i, [i]);
      rect.label = i;
      rect.label_position = "left";
      rect.text_align = "left";
      rect.fillStyles = ["lightblue"];
      rect.visible = false;
      this.stacks.push(rect);
      this.ani.add_object(rect);
    }
    text = new Text("Stack", 300, 13.5 * height , 250, "20px Arial");
    this.ani.add_object(text);


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


  call_fibonacci(n) {
    let rv;

    if (n > 12) {
      $("#elaboration_text").text("Please enter a number that is <= 12");
      return;
    }
    this.ani.clear_animation();
    rv = this.fibonacci(n, 0);
    this.ani.add_sequence_ani({prop:{step:true, time:1}});
    this.ani.add_sequence_ani({
      text: "Done. f({}) = {}".format_b(n, rv),
    });

    this.ani.run_animation();
  }

  fibonacci(n, level = 0) {
    let i;
    let ani = this.ani;
    let e_text, stack_text;
    let rect = this.stacks[level];
    let rv1, rv2;

    this.rect_color_change(0);
    this.ani.add_sequence_ani({
      text:"Call fibonacci({})".format_b(n),
      pause:1,
    });
   
    ani.add_sequence_ani({
      target:rect,
      prop: {fade_in: true, text: ["f({})".format(n)],  visible:true }
    });
    ani.add_sequence_ani({prop: {step: true}});
    

    if (n <= 1) {
      e_text = "{} <= 1. Return 1".format_b(n);
      
      this.rect_color_change(1);
      ani.add_sequence_ani({
        text: e_text,
        target: rect,
        prop: {fade_out: true, time: ANIMATION_TIME * 2}
      });
      return 1;
    } else {
      e_text = "{} > 1. Return fibonacci({}) + fibonacci({})".format_b(n,  n - 1, n - 2);
      
      stack_text = "f({}) {} f({}) + f({})".format(n, ARROW_UNICODE, n - 1, n - 2);
      ani.add_sequence_ani({
        text: e_text,
        target:rect,
        prop: {fade_in: true, text: [stack_text], time:1}
      })
 
      this.rect_color_change(2,  false);
      ani.add_sequence_ani({prop:{step:true}});

      // first function call
      rv1 = this.fibonacci(n - 1, level + 1);
      
      stack_text += "{} {} + f({})".format(ARROW_UNICODE, rv1, n - 2);
     
      ani.add_sequence_ani({
        target:rect,
        prop: {fade_in: true, text: [stack_text], time:1}
      })
      ani.add_sequence_ani({
        prop: {step:true, time:1},
      });

      // second function call
     
      rv2 = this.fibonacci(n - 2, level + 1);
      stack_text += "{} {} + {}".format(ARROW_UNICODE, rv1, rv2);
      ani.add_sequence_ani({
        target:rect,
        prop: {fade_in: true, text: [stack_text], time:1}
      })
      ani.add_sequence_ani({prop: {step:true}});
      // returns
      ani.add_sequence_ani({
        text: "f({}) returns {}".format_b(n, rv1 + rv2),
        target:rect,
        prop: {fade_in: true, text: [stack_text], time:1}
      })
      this.rect_color_change(2,  false);
      // ani.add_sequence_ani({prop:{step:true}});

      ani.add_sequence_ani({
        target: rect,
        prop: {fade_out: true, time: ANIMATION_TIME * 2}
      })

      return rv1 + rv2;
    } 
  }
}



// This is pretty much like non-cache fibonacciAnimation.
// But it's easy for me to copy it and modify it even thought they have a lot duplicated code.
class fibonacciDPAnimation {
  constructor() {
    
    let rect;
    let height = 30;
    let text;
    this.ani = new Animation();
    this.ani.step_by_step = $("#step_by_step").is(":checked");
    this.code_rect = new Rect(15, 30, 210, 180, "CODE_REF", 
                               ["def fib(n):", 
                                "    if n <= 1: return 1",
                                "    if n in cache: return cache[n]",
                                "    cache[n] = fib(n - 1) + fib(n - 2)",
                                "    return cache[n]"]);

    this.code_rect.text_align = "left";
    this.code_rect.ctx_prop.lineWidth = 0.4;
    this.ani.add_object(this.code_rect);
    
    this.stacks = [];
    for (let i = 0; i < 12; i++) {
      rect = new Rect(300, height * 12 - i * height, 250, height, "STACK_" + i, [i]);
      rect.label = i;
      rect.label_position = "left";
      rect.text_align = "left";
      rect.fillStyles = ["lightblue"];
      rect.visible = false;
      this.stacks.push(rect);
      this.ani.add_object(rect);
    }
    text = new Text("Stack", 300, 13.5 * height , 250, "20px Arial");
    this.ani.add_object(text);
    this.ani.draw();  
    this.tables = {};
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


  make_table(n) {
    let table = $("#cache_table");
    let str = "";
    let key_id, val_id, row_id;
    table.text("");
    str = '<tr><td colspan="2" style="border: hidden; color: red; font-size: 17px; font-weight: bold">Cache</td></tr>\
           <tr><th>Key</th><th>Value</th></tr>'

    for (let i = 2; i <= n; i++) {
      key_id = "key_" + i;
      val_id = "val_" + i;
      row_id = "row_" + i;
      str += '<tr id={} style="display:none"> <td id={}></td> <td id={}></td> </tr>'.format(row_id, key_id, val_id); 
    }

    table.append(str);

  }
  call_fibonacci(n) {
    let rv;

    if (n > 12) {
      $("#elaboration_text").text("Please enter a number that is <= 12");
      return;
    }

    this.make_table(n);
    this.ani.clear_animation();
    rv = this.fibonacci(n, 0);
    this.ani.add_sequence_ani({prop:{step:true, time:1}});
    this.ani.add_sequence_ani({
      text: "Done. f({}) = {}".format_b(n, rv),
    });
    this.ani.run_animation();
  }
  table_ani(n, val) {

    let f = (dict) => {
      let n = dict.n;
      let val = dict.val;
      let reverse = dict.reverse;
      let key_id, val_id, row_id;


      key_id = "#key_" + n;
      val_id = "#val_" + n;
      row_id = "#row_" + n;
      if (reverse != undefined && reverse == true) {
        $(row_id).css("display", "none");
        return;
      }

      $(row_id).css({ 
        "display" : "table-row",
        "background-color": "pink",
      })
      $(key_id).text(n);
      $(val_id).text(val);
    }

    this.ani.add_sequence_ani({
      pause:1,
      action: {params: {n:n, val:val}, func: f},
      rev_action: {params: {n:n, val:val, reverse:true}, func: f},
    });
    
  }

  fibonacci(n, level = 0) {
    let i;
    let ani = this.ani;
    let e_text, stack_text;
    let rect = this.stacks[level];
    let rv1, rv2;

    this.rect_color_change(0);
    this.ani.add_sequence_ani({
      text:"Call fibonacci({})".format_b(n),
      pause:1,
    });
   
    ani.add_sequence_ani({
      target:rect,
      prop: {fade_in: true, text: ["f({})".format(n)],  visible:true }
    });
    ani.add_sequence_ani({prop: {step: true}});
    

    if (n <= 1) {
      e_text = "{} <= 1. Return 1".format_b(n);
      
      this.rect_color_change(1);
      ani.add_sequence_ani({
        text: e_text,
        target: rect,
        prop: {fade_out: true, time: ANIMATION_TIME * 2}
      });
      return 1;
    } else if (n in this.tables) {
      this.rect_color_change(2);
      ani.add_sequence_ani({
        text: "{} is in the table. Return {}".format_b(n, this.tables[n]),
        target: rect,
        prop: {fade_out: true, time: ANIMATION_TIME * 2}
      });
      return this.tables[n];

    } else {
      e_text = "{} > 1. Compute fibonacci({}) + fibonacci({})".format_b(n,  n - 1, n - 2);
      
      stack_text = "f({}) {} f({}) + f({})".format(n, ARROW_UNICODE, n - 1, n - 2);
      ani.add_sequence_ani({
        text: e_text,
        target:rect,
        prop: {fade_in: true, text: [stack_text], time:1}
      })
      
      this.rect_color_change(3,  false);
      ani.add_sequence_ani({prop: {step:true}});

      // first function call
      rv1 = this.fibonacci(n - 1, level + 1);
      stack_text += "{} {} + f({})".format(ARROW_UNICODE, rv1, n - 2);
     
      ani.add_sequence_ani({
        target:rect,
        prop: {fade_in: true, text: [stack_text], time:1}
      })
      ani.add_sequence_ani({prop: {step:true}});

      // second function call
      rv2 = this.fibonacci(n - 2, level + 1);
      stack_text += "{} {} + {}".format(ARROW_UNICODE, rv1, rv2);
      ani.add_sequence_ani({
        target:rect,
        prop: {fade_in: true, text: [stack_text], time:1}
      });
      ani.add_sequence_ani({prop: {step:true}});

      // returns
      ani.add_sequence_ani({
        text: "Store ({}, {}) into table and return it".format_b(n, rv1 + rv2),
        target:rect,
        prop: {fade_in: true, text: [stack_text], time:1}
      })

      this.table_ani(n, rv1 + rv2);
      this.rect_color_change(3);

      ani.add_sequence_ani({
        target: rect,
        prop: {fade_out: true, time: ANIMATION_TIME * 2}
      })

      this.tables[n] = rv1 + rv2;
      return rv1 + rv2;
    }
    
  }

}
