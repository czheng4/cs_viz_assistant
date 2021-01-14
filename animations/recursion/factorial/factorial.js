/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  01/09/2021
  last modified 01/09/2021

*/


const ARROW_UNICODE = String.fromCharCode(8594);
class factorialAnimation {
  constructor() {
    
    let rect;
    let height = 30;
    let text;
    this.ani = new Animation();
    this.ani.step_by_step = $("#step_by_step").is(":checked");
    this.code_rect = new Rect(15, 30, 170, 90, "CODE_REF", 
                               ["def factorial(n):", 
                                "    if n <= 1: return 1",
                                "    return n * factorial(n - 1)"]);

    this.code_rect.text_align = "left";
    this.code_rect.ctx_prop.lineWidth = 0.4;
    this.ani.add_object(this.code_rect);

    this.move_dy = this.code_rect.height / this.code_rect.text.length;
    this.line_ptr = new quadraticCurve(new Point(185 + 40, 30 + this.move_dy / 2), new Point(185, 30 + this.move_dy / 2), 0);
    this.line_ptr.angle_length = 9;
    this.line_ptr.ctx_prop.lineWidth = 2;
    this.line_ptr.ctx_prop.strokeStyle = "blue";
    this.ani.add_object(this.line_ptr);


    this.stacks = [];
    for (let i = 0; i < 12; i++) {
      rect = new Rect(300, height * 12 - i * height, 210, height, "STACK_" + i, [i]);
      rect.label = i;
      rect.label_position = "left";
      rect.text_align = "left";
      rect.fillStyles = ["lightblue"];
      rect.visible = false;
      this.stacks.push(rect);
      this.ani.add_object(rect);
    }
    text = new Text("Stack", 300, 13.5 * height , 210, "20px Arial");
    this.ani.add_object(text);


    this.ani.draw();  
  }



  move_ptr(text, dy, time = ANIMATION_TIME, step = true) {
    if (text == "") {
      this.ani.add_sequence_ani({
        target: this.line_ptr,
        prop: {p: new Point(0, dy), type: "parallel", time: time, step: step},
      });
    } else {
      this.ani.add_sequence_ani({
        target: this.line_ptr,
        text: text,
        prop: {p: new Point(0, dy), type: "parallel", time: time, step: step},
      });
    }
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


  call_factorial(n) {
    let rv;

    if (n > 12) {
      $("#elaboration_text").text("Please enter a number that is <= 12");
      return;
    }
    this.ani.clear_animation();
    rv = this.factorial(n, 0);
    this.ani.add_sequence_ani({
      text: "Done. f({}) = {}".format_b(n, rv),
    });

    this.ani.run_animation();
  }

  factorial(n, level = 0) {
    let i;
    let ani = this.ani;
    let e_text;
    let rect = this.stacks[level];
    let rv;

    this.rect_color_change(0);
    this.ani.add_sequence_ani({
      text:"Call factorial({})".format_b(n),
      pause:1,
    });
   
    // rect.visible = true;
    ani.add_sequence_ani({
      target:rect,
      prop: {fade_in: true, text: ["f({})".format(n)],  visible:true }
    });
    ani.add_sequence_ani({prop: {step: true}});
    

    if (n <= 1) {
      e_text = "{} <= 1. Return 1".format_b(n);
      
      this.rect_color_change(1);
      this.move_ptr(e_text, this.move_dy);
      ani.add_sequence_ani({
        target: rect,
        prop: {fade_out: true, time: ANIMATION_TIME * 3}
      });
      return 1;
    } else {
      e_text = "{} > 1. Return {} * factorial({}), which is going to call factorial({})".format_b(n, n, n - 1, n - 1);
      
      ani.add_sequence_ani({
        target:rect,
        prop: {fade_in: true, text: ["f({}) {} {} * f({})".format(n, ARROW_UNICODE, n, n - 1)], time:1}
      });
      this.move_ptr(e_text, this.move_dy * 2, ANIMATION_TIME * 2, false);
      this.rect_color_change(2,  true);
      this.move_ptr("", -this.move_dy * 2, ANIMATION_TIME * 2, false);

      rv = this.factorial(n - 1, level + 1);
      
      ani.add_sequence_ani({
        text: "f({}) returns {}".format_b(n, rv * n),
        target:rect,
        prop: {fade_in: true, text: ["f({}) {} {} * f({}) {} {} * {}".format(n, ARROW_UNICODE, n, n - 1, ARROW_UNICODE, n, rv)], time:1}
      });

      ani.add_sequence_ani({
        prop: {step:true, time:1},
      });
      ani.add_sequence_ani({

        target: rect,
        prop: {fade_out: true, time: ANIMATION_TIME * 3}
      });



      return n * rv;
    }
    
  }

}