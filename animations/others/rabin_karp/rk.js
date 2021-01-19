/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  01/17/2021
  last modified 01/18/2021 

*/


const base = 256;
const m = 101;
const sum_hash = "sum";
const polynomial_hash = "polynomial";

function make_str_array(str) {
  let a = [];
  for(i = 0; i < str.length; i++) {
    a.push(str[i]);
  }
  return a;
}



class rabinKarpAnimation {
  constructor(text, pattern, hash_type) {


    if (text.length > 32) {
      $("#elaboration_text").text("Text size is {}. It must be <= 32".format(text.length));
      return;
    } else if (pattern.length > 7) {
      $("#elaboration_text").text("Pattern size is {}. It must be <= 7".format(pattern.length));
      return;
    } else if (pattern.length > text.length) {
      $("#elaboration_text").text("Pattern size is > text size");
      return;
    }

    this.window_v = [];
    this.ani = new Animation();
    this.ani.step_by_step = $("#step_by_step").is(":checked");
    this.ss = 33;

    let x = 50;
    let y = 0;


    this.text_rect = new Rect(x, y, text.length * this.ss, this.ss, 0, make_str_array(text), "", "top", "h");
    this.pattern_rect = new Rect(x, y + this.ss * 2.5, pattern.length * this.ss, this.ss, 1, make_str_array(pattern), "", "top", "h");

    for (let i = 0; i < pattern.length; i++) this.window_v.push("");
    this.window_rect = new Rect(x, y, pattern.length * this.ss, this.ss, 2, this.window_v, "", "bottom", "h", {fillStyle:"#00FFFF", globalCompositeOperation: "multiply"});
    this.window_rect.alpha = 0.5;


    this.text_rect.font = "15px Arial";
    this.pattern_rect.font =  "15px Arial";

    for (let i = 0; i < text.length; i++) this.text_rect.subrect_labels.push(i);
    for (let i = 0; i < pattern.length; i++) this.pattern_rect.subrect_labels.push(i);
    for (let i = 0; i < text.length; i++) this.text_rect.second_subrect_labels.push(text.charCodeAt(i));
    for (let i = 0; i < pattern.length; i++) this.pattern_rect.second_subrect_labels.push(pattern.charCodeAt(i));


    this.explanation = new Text("", 50, this.ss * 5, 100);
    this.explanation.text_align = "left";

    this.ani.add_object(this.pattern_rect);
    this.ani.add_object(this.text_rect);
    this.ani.add_object(this.window_rect);
    this.ani.add_object(this.explanation);
    this.hash_type = hash_type;
    

    this.ani.draw();
    this.run(text, pattern);
  }


  move_window_ani() {
    let ani = this.ani;


    ani.add_sequence_ani({
      target: this.window_rect,
      prop: {p: new Point(this.ss, 0), type: "relative", time: ANIMATION_TIME * 2},
      concurrence: true
    });

    ani.add_sequence_ani({
      target: this.pattern_rect,
      prop: {p: new Point(this.ss, 0), type: "relative", time: ANIMATION_TIME * 2},
    })

  }


  explanation_text_ani(text) {
    this.ani.add_sequence_ani({
      target: this.explanation,
      prop: {text:text, time:1},
    });
  }

  run(text, pattern) {
    let ani = this.ani;
    let hash, hs;
    let hash_text, hs_text;
    let i,j,k, e_text, base_text, pre_hash_text, tmp_text;
    let fill_styles = [];
    let power = 1;

    for (i = 0; i < pattern.length; i++) fill_styles.push("#DDDDDD");
    
    if (this.hash_type == "sum") {
      base_text = "m = 101\n";
      [hash, hash_text] = this.sum_hash_value(pattern, pattern.length);
      [hs,hs_text] = this.sum_hash_value(text, pattern.length);
    } else {
      power = 1;
      for (i = 0; i < pattern.length - 1; i++) power = (base * power) % m;
      base_text = "m = 101; b = 256;  b^(pattern.size() - 2) % m = {}\n".format(power);

      [hash, hash_text] = this.rabin_fingerprint(pattern, pattern.length);
      [hs,hs_text] = this.rabin_fingerprint(text, pattern.length);

    }
    base_text += "H(\"{}\") = {} = {}".format(pattern, hash_text, hash);
    pre_hash_text = "H(\"{}\") = {} = {}".format(text.substring(0, pattern.length), hs_text, hs);

    e_text = base_text + "\n" + pre_hash_text;
    this.explanation_text_ani(e_text);
    ani.add_sequence_ani({
      text: "Computer the hash value of pattern {} and the substring of text {}".format_b(pattern, text.substring(0, pattern.length)),
      prop: {step: true, time: 1}
    });


    for (i = 0; i <= text.length - pattern.length; i++) {

      if (i != 0) {
        if (this.hash_type == sum_hash) {
          [hs, hs_text] = this.next_sum_hash_value(hs, text.charCodeAt(i - 1), text.charCodeAt(i + pattern.length - 1));
        } else {
          [hs, hs_text] = this.next_rabin_fingerprint(hs, text.charCodeAt(i - 1), text.charCodeAt(i + pattern.length - 1), power);
        }
        hs_text = "H(\"{}\") = {}".format(text.substring(i, i + pattern.length), hs_text)

        this.explanation_text_ani(base_text + "\n" + pre_hash_text + "\n" + hs_text);
        pre_hash_text += "\n" + hs_text;
        this.move_window_ani();
      }

      j = -1;
      if (hs == hash) {
        ani.add_sequence_ani({
          text: "Hash values match. Check if substring matches pattern char by char",
          prop: {step: true, time : 1},
        });

        for (j = 0; j < pattern.length; j++) {

          if (pattern[j] != text[i + j]) tmp_text = "{} does not match to {}. Stop checking".format_b(text[i + j], pattern[j]);
          else tmp_text = "{} matches to {}. Keeps checking".format_b(pattern[j], pattern[j]);
          ani.add_sequence_ani({
            text: tmp_text,
            target: this.pattern_rect,
            prop: {text_fade_in: {index:j, fillStyle: "pink"}, time: 1},
          });
          ani.add_sequence_ani({
            prop: {step:true}
          });
          if (pattern[j] != text[i + j])  break;
        }
        if (j == pattern.length) {
          ani.add_sequence_ani({
            pause:1,
            text: "Find pattern starting at index {}".format_b(i),
          });
        }
      } else {
        ani.add_sequence_ani({
          pause:1,
          text: "Hash values don't match."
        })
      }

      
      ani.add_sequence_ani({
        prop: {step: true, time : 1},
      });

      if (j != -1) {
        ani.add_sequence_ani({
          target: this.pattern_rect,
          prop: {fillStyle: fill_styles, fade_in:true, time:1},
        });
      }
    }
    

    ani.add_sequence_ani({
      text: "Done",
      pause:1
    });
    ani.run_animation();

  }


  next_sum_hash_value(old_h, old_v, new_v) {
    let text = "";
    let h;
   
    h = (old_h - old_v + new_v) % m;
    console.log(old_h - old_v + new_v, (old_h - old_v + new_v) % m);
    text = "( {} - {} + {} ) % {} = {}".format(old_h, old_v, new_v, m, h); 
    if (h < 0) {
      h += m;
      text += " % {} = {}".format(m, h);
    }

    return [h, text];
  }

  sum_hash_value(str, size) {
    let sum = 0;
    let text = "0"
    for (let i = 0; i < size; i++) {
      text = "( {} + {} ) % {}".format(text, str.charCodeAt(i), m);
      sum = (sum + str.charCodeAt(i)) % m;
    }

    console.log(text);

    return [sum, text];
  }


  next_rabin_fingerprint(old_h, old_v, new_v, power) {
    let text = "";
    let h;
   

    h = ( base * (old_h - old_v * power) + new_v ) % m;

    // h = (old_h - old_v + new_v) % m;

    text = "( {} * ( {} - {} * {} )  + {} ) % {} = {}".format(base, old_h, old_v, power, new_v, m, h); 
    if (h < 0) {
      h += m;
      text += " % {} = {}".format(m, h);
    }

    return [h, text]; 
  }

  rabin_fingerprint(str, size) {
    let h = 0;
    let text = "0";

    for (let i = 0; i < size; i++) {
      text = "( {} * {} + {} ) % {}".format(base, text, str.charCodeAt(i), m);
      h = (h * base + str.charCodeAt(i)) % m;
    }
    return [h, text];
  }

}