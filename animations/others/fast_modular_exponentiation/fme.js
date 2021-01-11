/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/26/2020
  last modified 12/26/2020

*/
function table_td(content) {
  return "<td>" + content + "</td>";
}

function color_row(id) {
  $("[id^=row_").css("background", "");
  $("#row_" + id).css("background", "pink");
  $("#row_" + (id - 1)).css("background", "lightblue");
}
class fmeAnimation {
  constructor(b, e, n, table, show_table_only = false) {
    
    this.ani = new Animation();
    this.ani.step_by_step = $("#step_by_step").is(":checked");
    this.code_rect = new Rect(15, 30, 200, 220, "CODE_REF", 
                               ["product = 1", 
                                "b %= n",
                                "do {",
                                "    if (e & 1) :",
                                "        product = (product * b) % n",
                                "    b = (b * b) % n",
                                "    e >>= 1",
                                "} while (e);",
                                "return product"]);
    this.code_rect.text_align = "left";
    this.code_rect.ctx_prop.lineWidth = 0.4;
    this.ani.add_object(this.code_rect);
    if (show_table_only) {
      this.ani.draw();
      return;
    }
    this.move_dy = this.code_rect.height / this.code_rect.text.length;
    

    this.line_ptr = new quadraticCurve(new Point(215 + 40, 30 + this.move_dy / 2), new Point(215, 30 + this.move_dy / 2), 0);
    this.line_ptr.angle_length = 9;
    this.line_ptr.ctx_prop.lineWidth = 2;
    this.line_ptr.ctx_prop.strokeStyle = "blue";
    this.ani.add_object(this.line_ptr);
    this.fme_table = table;

    this.ani.draw();


    b = BigInt(b);
    e = BigInt(e);
    n = BigInt(n);

   
    this.fast_modular_exponentiation(b,e,n);
  
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

  e_text_ani(text, time = 1) {
    this.ani.add_sequence_ani({
      text: text,
      pause: 1,
    });
    if (time != 0) {
      this.ani.add_sequence_ani({
        pause: time,
        prop: {step:true}
      });
    }
  }

  row_color_change(id, reverse = false) {
    if (reverse) {
      this.ani.add_sequence_ani({
        pause:1,
        rev_action: {params: id, func: color_row}
      });
    } else {
      this.ani.add_sequence_ani({
        pause:1,
        action: {params: id, func: color_row},
      });
    }
  }

  rect_color_change(index) {
    let fill_styles = [];
    for (let i = 0; i < this.code_rect.text.length; i++) {
      fill_styles.push("#DDDDDD");
    }
    fill_styles[index] = "pink";
    this.ani.add_sequence_ani({
      target: this.code_rect,
      prop: {fade_in: true, time:1, fillStyle: fill_styles},
    });
  }

  fast_modular_exponentiation(b,e,n) {
    let i;
    let product = BigInt(1);
    let fme_table = this.fme_table;
    let row_text;
    let ani = this.ani;
    fme_table.text("");
    fme_table.append(
      "<tr> \
        <th>i</th>\
        <th>e<sub>i</sub></th>\
        <th>b</th>\
        <th>product</th>\
      </tr>");


   


    this.row_color_change(-1);
    this.rect_color_change(0);
    this.e_text_ani("initialize the product to {}".format_b(1), ANIMATION_TIME);
    this.rect_color_change(1);
    this.move_ptr("b % n = {} % {} = {}".format_b(b, n, b % n), this.move_dy);


    b = b % n;
    row_text = "<tr id = {}>".format("row_" + -1);
    row_text += table_td("");
    row_text += table_td("");
    row_text += table_td(b);
    row_text += table_td(product);

    fme_table.append(row_text);

    this.row_color_change(-1, true);
    i = 0;
    do {
      
      row_text = "<tr id = {}>".format("row_" + i);
      row_text += table_td(i);

      row_text += table_td((e & BigInt(1)) ? "1" : "0");
      this.row_color_change(i, false);
      this.rect_color_change(3);
      if (i == 0)  {
        this.move_ptr("", this.move_dy * 2, ANIMATION_TIME * 2, false);
      }

      

      if (e & BigInt(1)) {
        this.e_text_ani("{} & {} == True".format_b(e.toString(2), 1), ANIMATION_TIME / 3);
        this.rect_color_change(4);
        this.move_ptr("(product * b) % n = ({} * {}) % {} = {}".format_b(product, b, n, (product * b) % n), this.move_dy);
       
        product = (product * b) % n;

      } else {
        this.e_text_ani("{} & {} == False".format_b(e.toString(2), 1), ANIMATION_TIME / 3);
      }

      this.rect_color_change(5);
      if (e & BigInt(1)) {
        this.move_ptr("(b * b) % n = ({} * {}) % {} = {}".format_b(b, b, n, (b * b) % n), this.move_dy);
      } else {
        this.move_ptr("(b * b) % n = ({} * {}) % {} = {}".format_b(b, b, n, (b * b) % n), this.move_dy * 2, ANIMATION_TIME * 2);
      }
      b = (b * b) % n;


      this.rect_color_change(6);
      this.move_ptr("{} >>= {} = {}".format_b(e.toString(2), 1, (e >> BigInt(1)).toString(2)), this.move_dy);
      e >>= BigInt(1);
     
      row_text += table_td(b);
      row_text += table_td(product);
      row_text += "</tr>";
      fme_table.append(row_text);
      i++;
      
  
      this.rect_color_change(7);
      if (e) {

        this.move_ptr("{} != 0. Start next iteration.".format_b(e.toString(2)), this.move_dy);
        this.move_ptr("", -this.move_dy * 4, 4 * ANIMATION_TIME, false);
      } else {
        this.move_ptr("{} == 0. Exit the while loop".format_b(e.toString(2)), this.move_dy);
        this.rect_color_change(8);
        this.move_ptr("Return product = {}. Done".format_b(product), this.move_dy);
      }
      this.row_color_change(i - 1, true);
    } while (e);

    
    ani.run_animation();
    return product;
  }


 

}