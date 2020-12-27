/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/26/2020
  last modified 12/26/2020

*/
function table_td(content) {
  return "<td>" + content + "</td>";
}
class fmeAnimation {
  constructor(b, e, n, table) {
    
    this.ani = new Animation();
    this.code_rect = new Rect(15, 30, 200, 200, "CODE_REF", 
                              ["product = 1", 
                               "b %= n",
                               "for 0 -> bits_size(e) :",
                                "    if (e & (1 << i)) :",
                                "        product = (product * b) % n",
                                "    b = (b * b) % n",
                                "return product"]);
    this.code_rect.text_align = "left";
    this.code_rect.ctx_prop.lineWidth = 0.4;
    this.ani.add_object(this.code_rect);

    this.move_dy = this.code_rect.height / this.code_rect.text.length;
    this.line_ptr = new quadraticCurve(new Point(215 + 40, 30 + this.move_dy / 2), new Point(215, 30 + this.move_dy / 2), 0);
    this.line_ptr.angle_length = 9;
    this.ani.add_object(this.line_ptr);
    this.fme_table = table;

    // for (let i = 0; i < 5; i++) 
    // this.ani.add_sequence_ani({
    //   target: this.line_ptr,
    //   prop: {p: new Point(0, this.move_dy), type: "parallel", time: 3000},
    // });
    // this.ani.run_animation();
    this.ani.draw();
    b = parseInt(b);
    e = parseInt(e);
    n = parseInt(n);

    
    console.log(b,e,n);
    console.log(this.fast_modular_exponentiation(b,e,n))
    console.log(Math.pow(b, e) % n);
  }






  fast_modular_exponentiation(b,e,n) {
    let i;
    let product = 1;
    let size = e.toString(2).length;
    let fme_table = this.fme_table;
    let row_text;
    fme_table.text("");
    fme_table.append(
      "<tr> \
        <th>i</th>\
        <th>ei</th>\
        <th>b</th>\
        <th>product</th>\
      </tr>");


    b = b % n;
    for (i = 0; i < size; i++) {
      row_text = "<tr id = {}>".format("row_" + i);
      row_text += table_td(i);
      row_text += table_td((e & (1 << i)) ? "1" : "0");

      if (e & (1 << i)) {
        product = (product * b) % n;
      }
      b = (b * b) % n;
      row_text += table_td(b);
      row_text += table_td(product);
      row_text += "</tr>";
      fme_table.append(row_text);
    }


    return product;
    // for (i = 0; i < this.size; i++)
    // for i in range(number.size(e)):
    //   if (e & (1 << i)):
    //     product = (product * b) % n
    //   b = (b * b) % n
      
    // return product
  }


 

}