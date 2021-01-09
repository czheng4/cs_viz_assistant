/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  12/20/2020
  Last Modified 12/26/2020
*/

/*
  BTW
  I am so sick of this quick sort animation. 
  You will be when you write 9 combination of them
*/

function add_objs_to_ani(dict) {
  let ani = dict.ani,
      objs = dict.objs,
      lines = dict.lines;

  for (let i = 0; i < objs.length; i++) {
    if (objs[i] != null) ani.add_object(objs[i]);
  }
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] != null) ani.connect_object(lines[i]);
  }
  

}

function rm_objs_from_ani(dict) {
  let ani = dict.ani,
      objs = dict.objs;

  for (let i = 0; i < objs.length; i++) {
    if (objs[i] != null) ani.remove_object(objs[i].ref);
  }

}

function make_same_color(size, color) {
  let i;
  let rv = [];
  for (i = 0; i < size; i++) rv.push(color);
  
  return rv;
}

function make_single_color(index, size, color1, color2) {
  let rv, i;
  rv = [];
  for (i = 0; i < size; i++) rv.push(color2);
  rv[index] = color1;
  return rv;
}


function make_color(size,  pivot, low, high) {
  let rv = [];
  for (let i = 0; i < size; i++) {
    rv.push("#DDDDDD");
  }
  if (typeof low == "object") {
    for (let i = 0; i < low.length; i++) {
      rv[low[i]] = left_color;
    }
  } else if (low >= 0) rv[low] = left_color;

  if (typeof high == "object") {
    for (let i = 0; i < high.length; i++) {
      rv[high[i]] = right_color;
    }
  } else if (high >= 0) rv[high] = right_color;

  if (typeof pivot == "object") {
    for (let i = 0; i < pivot.length; i++) {
      rv[pivot[i]] = pivot_color;
    }
  } else if (pivot >= 0) rv[pivot] = pivot_color;
  return rv;

}

function make_order_array(i, j) {
  let a = [];
  for(i; i < j; i++) {
    a.push(i);
  }
  return a;
}
 
function update_color(dict) {

  dict.obj.fillStyles = dict.fillStyle;
}

function swap(v, i, j) {
  let tmp;
  tmp = v[i];
  v[i] = v[j];
  v[j] = tmp;
} 

function pretty_index(i, j = null) {
  if (j!=null) return BLUE_SPAN + "[{}:{}]".format(i, j) + "</span>";
  return BLUE_SPAN + "[{}]".format(i) + "</span>";
}

function pretty_index_b(i, j = null) {
  if (j!=null) return "[{}:{}]".format(i, j);
  return "[{}]".format(i);
}


const pivot_color = "#B0B0B0";
const left_color = "#ADD8E6";
const right_color = "#FFD300";
const merge_color = "red";
const default_color = "#DDDDDD";

const PIVOT_FIRST = "first";
const PIVOT_LAST = "last";
const PIVOT_MEDIAN = "median";


const PARTITION_LOMUTO = "lomuto";
const PARTITION_HOARE = "hoare";
const PARTITION_LAB = "lab";




class quickSortAnimation {
	constructor(v, pivot_type, partition_type) {
    this.v = v;
    this.ani = new Animation();
    this.ss = 45; //square_size
    this.margin = 80;
    this.margin_y = 60;
    this.ref = 0;
    this.partition_type = partition_type;
    this.pivot_type = pivot_type;

    let x,y;
    let rect,p;

    x = this.margin * 3;
    y = 0;
    rect = new Rect(x, y, v.length * this.ss, this.ss, this.generate_ref(), deep_copy(v), "", "bottom", "h");
    for (let i = 0; i < v.length; i++) rect.subrect_labels.push(i);
    p = this.ani.get_point((rect.x + rect.width) / 2, rect.y + rect.height);
    rect.attach_point(p);

    this.ani.add_object(rect);
    this.ani.draw();
    this.root_rect = rect;

    let rv = this.recursive_sort(v, 0, rect, rect.x, rect.y, 0, v.length);
    // this.ani.run_animation();
    // console.log(rv);
  }

  generate_ref() {
    this.ref++;
    return "QRECT" + this.ref;
  }


  run_animation() {
    this.ani.run_animation();
  }


 
  recursive_sort(v, level = 0, prev_rect = null, x, y, start, size) {
    let rv, v1, v2;
    let i, middle, lp, rp, pivot;
    let rects, rect1, rect2;
    let ani = this.ani;

    if (v.length == 1 || v.length == 0) return v;
    if (v.length == 2) {
      if(v[0] > v[1]) {
        ani.add_sequence_ani( {pause: 1, prop: {step:true}});
        ani.add_sequence_ani({ 
          target: prev_rect,
          text: "Swap {}{}(array[{}])</span> and {}{}(array[{}])</span>".format(
                 v[0], BLUE_SPAN, start, 
                 v[1], BLUE_SPAN, start + 1),
          prop: {swap:{index1:0, index2:1, h_scale: 3}, time: 3 * ANIMATION_TIME, step:true}
				});
        return [v[1], v[0]];
      }
      else return v;
    }

    pivot = v[0];
    lp = 1;
    rp = v.length - 1;
    middle = parseInt(v.length / 2);

    if (this.partition_type == PARTITION_HOARE) {
      rp = this.hoare_partition(v, prev_rect, x, y, start);
      v1 = v.splice(0, rp + 1);
      v2 = v.splice(0);
    } else {
      if (this.pivot_type == PIVOT_MEDIAN) this.median_of_three(v, prev_rect, x, y, start);
      if (this.partition_type == PARTITION_LOMUTO) rp = this.lomuto_partition(v, prev_rect, x, y, start);
      else rp = this.partition(v, prev_rect, x, y, start);
      v1 = v.splice(0, rp);
      v2 = v.splice(1);
    }
   

    // console.log(rp);
    // v1 = v.splice(0, rp);
    // v2 = v.splice(1);

    rects = this.make_left_right_rect(prev_rect, x, y, v1, v2, level, start);
    rect1 = rects[0];
    rect2 = rects[1];
    // console.log(v, v1, v2);

    if (v1.length != 0) {
      v1 = this.recursive_sort(v1, level + 1, rect1, rect1.x - this.margin * Math.pow(0.5, level), rect1.y + this.ss + this.margin_y, start, v1.length);
    }
    if (v2.length != 0) {
      v2 = this.recursive_sort(v2, level + 1, rect2, rect2.x + this.margin * Math.pow(0.5, level), rect2.y + this.ss + this.margin_y, start + rp + 1, v2.length);
    }
    return v1.concat(v).concat(v2);
  }


  median_of_three(v, rect, x, y, start) {
    let ani = this.ani;
    let middle = parseInt(v.length / 2);
    let first = 0, last = v.length - 1;
    let median, median_line, p1, p2;
    let median_index;
    let line_height = 25;


    median_line = new quadraticCurve(new Point(0,0), new Point(0,0));
    this.lines_fade_in_or_out([median_line], {fade_in: true, visible: true, time:2});
    this.rect_color_ani(rect, v.length, [first, middle, last], -1, -1);

    

    if ((v[last] - v[middle]) * (v[last] - v[first]) <= 0 && v[first] != v[last]) {
      median_index = last;
      median = v[median_index];
      if (this.partition_type != PARTITION_HOARE) {
        this.text_ani("Median-of-three. Array{} is the median. Swap array{} with array{}".format(pretty_index(last + start), pretty_index(last + start), pretty_index(first + start) ));
        this.swap_ani(rect, first, last);
        swap(v, first, last);
      }
    } else if ( (v[middle] - v[last]) * (v[middle] - v[first]) <= 0 && v[middle] != v[first]) {
      median_index = middle;
      median = v[median_index];
      if (this.partition_type != PARTITION_HOARE) {
        this.text_ani("Median-of-three. Array{} is the median. Swap array{} with array{}".format(pretty_index(middle + start), pretty_index(middle + start), pretty_index(first + start)));
        this.swap_ani(rect, first, middle);
        swap(v, first, middle);
      }
    } else {
      median_index = first;
      median = v[median_index];
      if (this.partition_type != PARTITION_HOARE) {
        this.text_ani("Median-of-three. Array{} is already median. Do nothing".format(pretty_index(first + start)));
        this.ani.add_sequence_ani({pause:ANIMATION_TIME});
      }
    }


    if (this.partition_type == PARTITION_HOARE) {
      this.text_ani("Median-of-three. Median is array{} = {}".format_b(pretty_index_b(median_index), median));
      this.ani.add_sequence_ani({pause:ANIMATION_TIME});
    }

    p1 = new Point(x + (median_index + 0.5) * this.ss, y - line_height);
    p2 = new Point(p1.x, p1.y + line_height);

    median_line.p1 = p1;
    median_line.p2 = p2;
    median_line.angle_length = 8;
    median_line.ctx_prop.strokeStyle = "black";
    median_line.text = "median(array[{}])".format(median_index + start);
    median_line.text_t = -0.3;
    median_line.text_direction = "top";
    median_line.visible = false;
    ani.add_object(median_line);

    this.lines_fade_in_or_out([median_line], {fade_out: true, time:ANIMATION_TIME});

    return median;
  }



  make_left_right_rect(prev_rect, x, y, v1, v2, level, start) {
    
    let rect1, rect2, l1, l2;
    let p1,p2;
    let e_text;
    let tmp_x;
    let i;
    let ani = this.ani;

    rect1 = null; rect2 = null;
    l1 = null; l2 = null;

    if (v1.length != 0) {
      rect1 = new Rect(x, y, v1.length * this.ss, this.ss, this.generate_ref(), deep_copy(v1), "", "bottom", "h");
      for (i = 0; i < v1.length; i++) rect1.subrect_labels.push(i + start);
      p1 = ani.get_point(prev_rect.x + rect1.width / 2, prev_rect.y + prev_rect.height);
      p2 = ani.get_point(rect1.x + rect1.width / 2, rect1.y);
      
      prev_rect.attach_point(p1);
      rect1.attach_point(p2);
      l1 = new quadraticCurve(p1, p2, 0);
      l1.draw_arrow = false;
      l1.alpha = 0.25;
    }

    // make a right rect
    if (rect1 != null) {
      x = rect1.x + rect1.width;
      y = rect1.y;
    }

    if (v2.length != 0) {

     
      if (this.partition_type == PARTITION_HOARE) {
        rect2 = new Rect(x, y, v2.length * this.ss, this.ss, this.generate_ref(), deep_copy(v2), "", "bottom", "h");
        for (i = 0; i < v2.length; i++) rect2.subrect_labels.push(i + start + v1.length);
        p1 = ani.get_point(prev_rect.x + v1.length * this.ss + rect2.width / 2, prev_rect.y + prev_rect.height);
      } else {
        rect2 = new Rect(x + this.ss, y, v2.length * this.ss, this.ss, this.generate_ref(), deep_copy(v2), "", "bottom", "h");
        for (i = 0; i < v2.length; i++) rect2.subrect_labels.push(i + start + v1.length + 1);
        p1 = ani.get_point(prev_rect.x + (v1.length + 1) * this.ss + rect2.width / 2, prev_rect.y + prev_rect.height);
      }
      p2 = ani.get_point(rect2.x + rect2.width / 2, rect2.y);
      prev_rect.attach_point(p1);
      rect2.attach_point(p2);
      l2 = new quadraticCurve(p1, p2, 0);
      l2.draw_arrow = false;
      l2.alpha = 0.25;
    }

    // make animation 
    ani.add_sequence_ani({pause: ANIMATION_TIME / 4});
    e_text = "Split array{} at index {} such that we recursively sort ".format_b(
              "[{}:{}]".format(start, start + v1.length + v2.length),
              "{}".format(start + v1.length));

    if (v1.length != 0) e_text += "array" + pretty_index(start, start + v1.length - 1);
    if (v2.length != 0) {
      if (v1.length != 0) e_text += " and ";
      if (this.partition_type == PARTITION_HOARE) e_text += "array" + pretty_index(start + v1.length, start + v1.length + v2.length);
      else e_text += "array" + pretty_index(start + v1.length + 1, start + v1.length + v2.length);
      if (v1.length != 0) e_text += " respectively";
    }
   
    ani.add_sequence_ani({ pause: 1,  
                           text: e_text,  
                           action: { params: {ani:ani, objs: [rect1, rect2], lines: [l1, l2]}, func: add_objs_to_ani },
                           rev_action: {params: {ani:ani, objs: [rect1, rect2]}, func: rm_objs_from_ani }});

    if (this.partition_type == PARTITION_HOARE) {
      this.rect_color_ani(prev_rect, v1.length + v2.length, -1, make_order_array(0, v1.length), make_order_array(v1.length, v1.length + v2.length), 0, false);
    } else {
      this.rect_color_ani(prev_rect, v1.length + v2.length + 1, v1.length, make_order_array(0, v1.length), make_order_array(v1.length + 1, v1.length + v2.length + 1), 0, false);
    }
    if (v1.length != 0) {
      ani.add_sequence_ani({ 
        target: rect1,
        prop: {p: new Point(rect1.x - this.margin * Math.pow(0.5, level), rect1.y + this.ss + this.margin_y), fillStyle: left_color},
        concurrence: v2.length != 0
      });
    }

    if (v2.length != 0) {
      ani.add_sequence_ani({ 
        target: rect2,
        prop: {p: new Point(rect2.x + this.margin * Math.pow(0.5, level), rect2.y + this.ss + this.margin_y), fillStyle: right_color},
        concurrence: false
      });
    }

    this.ani.add_sequence_ani({prop: {step:true, time:1}});
    return [rect1, rect2];
  
  }



  hoare_partition(v, rect, x, y, start) {
    let ani = this.ani;
    let lp, rp, pivot;
    let lp_line, rp_line, pivot_text, p1, p2;
    let line_height = 25;
    let pivot_index;
    let i,j;


    /* in this case lp_line is i
       rp_line is j;
    */

    lp = -1;
    rp = v.length;

    if (this.pivot_type == PIVOT_LAST) {
      pivot_index = v.length - 1;
      pivot = v[v.length - 1];
      this.rect_color_ani(rect, v.length, v.length - 1, -1, -1, 0, false);
    } else if (this.pivot_type == PIVOT_FIRST){
      pivot_index = 0;
      pivot = v[0];
      this.rect_color_ani(rect, v.length, 0, -1, -1, 0, false);
    } else if (this.pivot_type == PIVOT_MEDIAN) {
      pivot = this.median_of_three(v, rect, x, y, start);
    }

    
    pivot_index = -1;
    /* set i and j arrow */
    p1 = new Point(x + (lp + 0.5) * this.ss, y - line_height);
    p2 = new Point(p1.x, p1.y + line_height);

    lp_line = new quadraticCurve(p1, p2, 0);
    lp_line.angle_length = 8;
    lp_line.ctx_prop.strokeStyle = "blue";
    lp_line.text = "low = " + (lp + start);
    lp_line.text_t = -0.3;
    lp_line.text_direction = "top";
    lp_line.visible = false;

    p1 = new Point(x + (rp + 0.5) * this.ss, y + this.ss + line_height);
    p2 = new Point(p1.x, p1.y - line_height);
    rp_line = new quadraticCurve(p1, p2, 0);
    rp_line.angle_length = 8;
    rp_line.ctx_prop.strokeStyle = "orange";
    rp_line.text = "high = " + (rp + start);
    rp_line.text_t = -0.3;
    rp_line.text_direction = "top";
    rp_line.visible = false;


    pivot_text = new Text("pivot = " + pivot, x, y + this.ss + this.margin_y - 5, rect.width);
    pivot_text.visible = false;
    pivot_text.ctx_prop.fillStyle = "red";

    ani.add_sequence_ani({
      target: pivot_text,
      prop: {visible: true, time:1},
    });
    ani.add_sequence_ani({
      text: "Choose {} as pivot".format_b(pivot),
      prop: {step:true}
    });


    ani.add_object(rp_line);
    ani.add_object(lp_line);
    ani.add_object(pivot_text);
    // ani.add_object(pivot_line);
    
    this.lines_fade_in_or_out([lp_line, rp_line], {fade_in:true, visible: true, time:2});
    this.rect_color_ani(rect, v.length, pivot_index, lp, rp, 0);

    while(1) {
      do {
        lp++;
        this.text_ani("Increment the {} pointer and then low = {}".format_b("low", lp + start));
        this.move_ptr_ani(lp_line, this.ss, "low = " + (lp + start));
        this.rect_color_ani(rect, v.length, pivot_index, lp, rp, ANIMATION_TIME / 2); 
      } while (v[lp] < pivot);

      do {
        rp--;
        this.text_ani("Decrement the {} pointer and then high = {}".format_b("high", rp + start));
        this.move_ptr_ani(rp_line, -this.ss, "high = " + (rp + start));
        this.rect_color_ani(rect, v.length, pivot_index, lp, rp, ANIMATION_TIME / 2);
      } while (v[rp] > pivot);

      if (lp >= rp) {
        this.text_ani("{} >= {}. Done with partition".format_b("low", "high"));
        this.lines_fade_in_or_out([lp_line, rp_line, pivot_text], {fade_out:true, time: ANIMATION_TIME * 2});
        return rp;
      } 
      this.text_ani("Swap {}(array[low = {}]) and {}(array[high = {}]).".format_b(
                     v[lp], lp + start, 
                     v[rp], rp + start, "low", "high"));
      this.swap_ani(rect, lp, rp, true);

      swap(v, lp, rp);
    }
  }

  lomuto_partition(v, rect, x, y, start) {
    let ani = this.ani;
    let lp, rp, pivot;
    let lp_line, rp_line, pivot_line, p1, p2;
    let line_height = 25;
    let pivot_index;
    let i,j;

    /* in this case lp_line is i
       rp_line is j;
    */

    lp = 0;

    if (this.pivot_type == PIVOT_LAST) {
      pivot_index = v.length - 1;
      pivot = v[v.length - 1];
      rp = 0;
    } else {
      pivot_index = 0;
      pivot = v[0];
      rp = 1;
    }

    /* set i and j arrow */
    p1 = new Point(x + (lp + 0.5) * this.ss, y - line_height);
    p2 = new Point(p1.x, p1.y + line_height);

    lp_line = new quadraticCurve(p1, p2, 0);
    lp_line.angle_length = 8;
    lp_line.ctx_prop.strokeStyle = "blue";
    lp_line.text = "i = " + (lp + start);
    lp_line.text_t = -0.3;
    lp_line.text_direction = "top";
    lp_line.visible = false;

    p1 = new Point(x + (rp + 0.5) * this.ss, y + this.ss + line_height);
    p2 = new Point(p1.x, p1.y - line_height);
    rp_line = new quadraticCurve(p1, p2, 0);
    rp_line.angle_length = 8;
    rp_line.ctx_prop.strokeStyle = "orange";
    rp_line.text = "j = " + (rp + start);
    rp_line.text_t = -0.3;
    rp_line.text_direction = "top";
    rp_line.visible = false;

    if (this.pivot_type == PIVOT_LAST) {
      p1 = new Point(rect.width + x + line_height, y - line_height);
      p2 = new Point(rect.width + x, y);
    } else {
      p1 = new Point(x - 1.5 * line_height, y - line_height);
      p2 = new Point(x, y);
    }
    pivot_line = new quadraticCurve(p1,p2,0);
    pivot_line.text = "pivot(index = {})".format(start + pivot_index);
    pivot_line.text_direction = "top";
    pivot_line.angle_length = 8;
    pivot_line.text_t = -0.3;
    pivot_line.visible = false;

    ani.add_object(rp_line);
    ani.add_object(lp_line);
    ani.add_object(pivot_line);
    
    this.lines_fade_in_or_out([lp_line, rp_line, pivot_line], {fade_in:true, visible: true, time:2});
    this.rect_color_ani(rect, v.length, pivot_index, lp, rp, 0);

    // rp is j. lp is i.
    if (this.pivot_type == PIVOT_LAST) {
      for (rp; rp < v.length - 1; rp++) {
        if (v[rp] < pivot) {

          swap(v, lp, rp);

          this.text_ani("{} < pivot {}. Swap {}(array[i = {}]) and {}(array[j = {}]) and then increment {}".format_b(
                         v[rp], pivot, 
                         v[lp], lp + start, 
                         v[rp], rp + start, "i"));
          this.swap_ani(rect, lp, rp, false);
          lp++;
          this.move_ptr_ani(lp_line, this.ss, "i = " + (lp + start));
          this.rect_color_ani(rect, v.length, pivot_index, lp, rp, 0);
          
        }
        this.text_ani("Increment {} and then {} = {}".format_b("j", "j", start + rp + 1));
        this.move_ptr_ani(rp_line, this.ss, "j = " + (rp + start + 1));
        this.rect_color_ani(rect, v.length, pivot_index, lp, rp + 1, 0);
      }
      

    } else {
      for (rp; rp < v.length; rp++) {
        if (v[rp] < pivot) {
          lp++;
          this.text_ani("{} < pivot {}. Increment {} and then swap {}(array[i = {}]) and {}(array[j = {}])".format_b(
                         v[rp], pivot, "i",
                         v[lp], lp + start, 
                         v[rp], rp + start,"i"));
          this.move_ptr_ani(lp_line, this.ss, "i = " + (lp + start));
          this.rect_color_ani(rect, v.length, pivot_index, lp, rp, 0, false);
          swap(v, lp, rp);
          this.swap_ani(rect, lp, rp, true);
         
        }
        this.text_ani("Increment {} and then {} = {}".format_b("j", "j", start + rp + 1));
        this.move_ptr_ani(rp_line, this.ss, "j = " + (rp + start + 1));
        this.rect_color_ani(rect, v.length, pivot_index, lp, rp + 1, 0);
      }
      
    }

    this.text_ani("Done scanning the array{}. Swap the pivot {}(array{}) with array[i = {}] = {}".format_b(
                    pretty_index_b(start, start + v.length - 1), 
                    pivot, pretty_index_b(pivot_index + start), 
                    lp + start, v[lp]));
    swap(v, pivot_index, lp);
    this.swap_ani(rect, lp, pivot_index,false);
    this.rect_color_ani(rect, v.length, lp, -1, -1, 0);
    this.lines_fade_in_or_out([lp_line, rp_line, pivot_line], {fade_out:true, time: ANIMATION_TIME * 2});

    return lp;




  }

  partition(v, rect, x, y, start) {
    let ani = this.ani;
    let lp, rp, pivot;
    let lp_line, rp_line, pivot_line, p1, p2;
    let line_height = 25;
    let pivot_index;


    if (this.pivot_type == PIVOT_LAST) {
      pivot_index = v.length - 1;
      pivot = v[v.length - 1];
      lp = 0;
      rp = v.length - 2;

    } else {
      pivot_index = 0;
      pivot = v[0];
      lp = 1;
      rp = v.length - 1;
    }


    /* set low and high arrow */
    p1 = new Point(x + (lp + 0.5) * this.ss, y - line_height);
    p2 = new Point(p1.x, p1.y + line_height);

    lp_line = new quadraticCurve(p1, p2, 0);
    lp_line.angle_length = 8;
    lp_line.ctx_prop.strokeStyle = "blue";
    lp_line.text = "low = " + (lp + start);
    lp_line.text_t = -0.3;
    lp_line.text_direction = "top";
    lp_line.visible = false;

    p1 = new Point(x + (rp + 0.5) * this.ss, y + this.ss + line_height);
    p2 = new Point(p1.x, p1.y - line_height);
    rp_line = new quadraticCurve(p1, p2, 0);
    rp_line.angle_length = 8;
    rp_line.ctx_prop.strokeStyle = "orange";
    rp_line.text = "high = " + (rp + start);
    rp_line.text_t = -0.3;
    rp_line.text_direction = "top";
    rp_line.visible = false;

    if (this.pivot_type == PIVOT_LAST) {
      p1 = new Point(rect.width + x + 1.5 * line_height, y - line_height);
      p2 = new Point(rect.width + x, y);
    } else {
      p1 = new Point(x - line_height, y - line_height);
      p2 = new Point(x, y);
    }

    pivot_line = new quadraticCurve(p1,p2,0);
    pivot_line.text = "pivot(index = {})".format(start + pivot_index);
    pivot_line.text_direction = "top";
    pivot_line.angle_length = 8;
    pivot_line.text_t = -0.3;
    pivot_line.visible = false;

    ani.add_object(rp_line);
    ani.add_object(lp_line);
    ani.add_object(pivot_line);

    
    this.lines_fade_in_or_out([lp_line, rp_line, pivot_line], {fade_in:true, visible: true, time:2});
    this.rect_color_ani(rect, v.length, pivot_index, lp, rp, 0);


    while (1) {
      /*
        Increment the left pointer until it points to an element ≥ the pivot 
        Decrement the right pointer until it points to an element ≤ the pivot.
        When the pivot is the first element, we swap it with the rp when it's done.
        When the pivot is the last element, we swap it with the lp when it's done.
      */
      while (lp < v.length && v[lp] < pivot) {
        lp++;
        this.text_ani("{} < {}. Increment the {} pointer. low = {}".format_b(v[lp - 1], pivot, "low", lp + start));
        this.move_ptr_ani(lp_line, this.ss, "low = " + (lp + start));
        this.rect_color_ani(rect, v.length, pivot_index, lp, rp, ANIMATION_TIME / 2); 
      }
      while (rp > 0 && v[rp] > pivot) {
        rp--;
        this.text_ani("{} > {}. Decrement the {} pointer. high = {}".format_b(v[rp + 1], pivot, "high", rp + start));
        this.move_ptr_ani(rp_line, -this.ss, "high = " + (rp + start));
        this.rect_color_ani(rect, v.length, pivot_index, lp, rp, ANIMATION_TIME / 2);
      }

      if (lp >= rp) {
        if (this.pivot_type == PIVOT_LAST) {
          
          this.text_ani("low >= high. Swap the pivot {}(array{}) with array[low = {}] = {}".format_b(
                        pivot , pretty_index_b(start + pivot_index), 
                        start + lp, v[lp]));
          swap(v, pivot_index, lp);
          this.swap_ani(rect, lp, pivot_index,false);
          this.rect_color_ani(rect, v.length, lp, -1, -1, 0);
        } else {
          this.text_ani("low >= high. Swap the pivot {}(array{}) with array[high = {}] = {}".format_b(
                        pivot, pretty_index_b(start + pivot_index), 
                        start + rp, v[rp]));
          swap(v, pivot_index, rp);
          this.swap_ani(rect, rp, pivot_index,false);
          this.rect_color_ani(rect, v.length, rp, -1, -1, 0);
        }

        this.lines_fade_in_or_out([lp_line, rp_line, pivot_line], {fade_out:true, time: ANIMATION_TIME * 2});

        break;
      } else {
        
        this.text_ani("Swap {}(array[low = {}]) and {}(array[high = {}]). Increment the {} pointer and Decrement the {} pointer".format_b(
                       v[lp], lp + start, 
                       v[rp], rp + start, "low", "high"));
        swap(v, lp, rp);
        this.swap_ani(rect, lp, rp, false);
        
        lp++;
        rp--;
        this.move_ptr_ani(lp_line, this.ss, "low = " + (lp + start));
        this.move_ptr_ani(rp_line, -this.ss, "high = " + (rp + start));
        
        this.rect_color_ani(rect, v.length, pivot_index, lp, rp, ANIMATION_TIME / 2);
      }
    }
    if (this.pivot_type == PIVOT_LAST) return lp;
    else return rp;

  }


  move_ptr_ani(line, dx, line_text, time = ANIMATION_TIME) {
    
    this.ani.add_sequence_ani({
      target: line,
      prop: {p: new Point(dx, 0), type: "parallel", time: time},
      concurrence: true
    });

    this.ani.add_sequence_ani({
      time_offset: ANIMATION_TIME / 2,
      target: line,
      prop: {text: line_text, time: 1},
      concurrence: true,
    });
  }

  swap_ani(rect, index1, index2, step = true) {
    let h_scale;
    if (index1 > index2) [index2, index1] = [index1, index2];
    if (index1 == index2) h_scale = 13;    
    else h_scale = 3 * 1 / Math.abs(index2 - index1);

    this.ani.add_sequence_ani({ 
      target: rect,
      prop: {swap:{index1:index1, index2:index2, h_scale: h_scale}, time: 3 * ANIMATION_TIME, step:step}
    });
    
  }

  rect_color_ani(rect, size, pivot, low, high, time_offset = 0, step = true) {
    
    this.ani.add_sequence_ani({
      time_offset: time_offset,
      target: rect,
      prop: {fade_in: true, fillStyle: make_color(size, pivot, low, high), time:1}
    });


    if (step) this.ani.add_sequence_ani({prop:{step:true, time:1}});

  }

  text_ani(text) {
    this.ani.add_sequence_ani({
      pause:1,
      text: text,
      concurrence:true,
    });
  }

  lines_fade_in_or_out(lines, prop) {

    for (let i = 0; i < lines.length; i++) {
      this.ani.add_sequence_ani({
        target: lines[i],
        prop: deep_copy(prop),
        concurrence: i != lines.length - 1
      });
    }
  }
 
}
