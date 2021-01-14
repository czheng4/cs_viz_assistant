/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  01/08/2021
  last modified 01/08/2021
  
  Here's what I refer to http://web.eecs.utk.edu/~jplank/plank/classes/cs140/Notes/Sudoku/index.html 
  to write the sodukuSolver.
*/


const FIX_COLOR = "pink";
const FILL_COLOR = "lightblue";
const DEFAULT_COLOR = "#DFDFDF";


function create_sudoku_table(table) {
  let str = table.replace(/ /g, "");
  let i,j;
  let table_str = "";
  let id;

  $("#sudoku_table").text("");
  for (i = 0; i < 9; i++) {
    table_str += "<tr>";
    for (j = 0; j < 9; j++) {
      id = "T{}".format(i * 9 + j);
      if (str[i * 9 + j] != '-') table_str += '<td id={} style="background-color:{}">{}</td>'.format(id, FIX_COLOR, str[i * 9 + j]);
      else table_str += '<td id={}>{}</td>'.format(id, str[i * 9 + j]);
    }
    table_str += "</tr>";
  }
  
  $("#sudoku_table").append(table_str);

}

function table_td(dict) {
  let id = dict.id;
  let number = dict.number;
  let color = dict.color;

  id = "#T" + id;
  $(id).css("background-color", color);
  $(id).text(number);
  // console.log($(id));
}


class sudokuAnimation {
  constructor() {
    this.ani = new Animation();
    this.board = [];
    this.pre_id = -1; 
  }



  is_row_ok(r) {
    let check = [];
    let i, c;
    for (i = 0; i < 9; i++) check.push(false);

    for (let i = 0; i < 9; i++) {
      c = this.board[r][i];
      if (c != 0) {
        if (check[c - 1]) return false;
        check[c - 1] = true;
      }
    }
    return true;
  }


  is_col_ok(col) {
    let check = [];
    let i, c;
    for (i = 0; i < 9; i++) check.push(false);

    for (i = 0; i < 9; i++) {
      c = this.board[i][col];
      if (c != 0) {
        if (check[c - 1]) return false;
        check[c - 1] = true;
      }
    }
    return true;
  }

  is_panel_ok(row, col) {
    let check = [];
    let i, c, j;
    for (i = 0; i < 9; i++) check.push(false);
    
    for (i = row * 3; i < row * 3 + 3; i++) {
      for (j = col * 3; j < col * 3 + 3; j++) {
        c = this.board[i][j];
        if (c != 0) {
          if (check[c - 1]) return false;
          check[c - 1] = true;
        }

      }
    }
    return true;
  }

  recursive_solve(r, c) {
    let i;
    let e_text;
    while (r < 9 && this.board[r][c] != 0) {
      c++;
      if (c == 9) {
        r++;
        c = 0;
      }
    }

    // console.log(deep_copy(this.board), r, c);
    if (r == 9) return true;
    for (i = 1; i <= 9; i++) {
      this.board[r][c] = i;
      
      e_text = "";
      if (this.is_row_ok(r) == false) e_text = "Number {} violates row number {} property".format_b(i, r);
      else if (this.is_col_ok(c) == false) e_text = "Number {} violates column number {} property".format_b(i, c);
      else if (this.is_panel_ok(parseInt(r / 3), parseInt(c/3)) == false) e_text = "Number {} violates panel property".format_b(i);
      
      if (e_text == "") {
        e_text = "Number {} is good. Go to the next empty slot".format_b(i);
        this.change_board_value_ani(r,c,i,e_text);
        if (this.recursive_solve(r, c)) {
          return true;
        }
      } else {
        this.change_board_value_ani(r,c,i,e_text);
      }
      
      
    }
      
    this.change_board_value_ani(r, c, 0, "Return to the previous slot");
    this.board[r][c] = 0;
    return false; 
    
    

  }

  show_board(b){
    let i,j;
    let row;

    create_sudoku_table(b);
    this.board = [];
    b = b.replace(/ /g, "");
    for (i = 0; i < 9; i++) {
      row = [];
      for (j = 0; j < 9; j++) {
        if (b.charAt(i * 9 + j) != '-') row.push(b.charAt(i * 9 + j) - '0');
        else row.push(0);
      }
      this.board.push(row);
    }
    this.original_str_board = b;
  }

  solve() {
    this.show_board(this.original_str_board);
    this.ani.clear_animation();
    this.recursive_solve(0, 0);
    this.ani.add_sequence_ani({
      pause:1,
      text: "Done"
    });
    this.ani.run_animation();
  }


  change_board_value_ani(row, col, number, text) {
    let id;
    let color = FILL_COLOR;
    let rev_id, rev_color, rev_number;

    if (number == 0) {
      number = "-";
      color = DEFAULT_COLOR;
    }
    id = row * 9 + col;

    if (number == 1) {
      rev_id = id;
      rev_color = DEFAULT_COLOR;
      rev_number = "-";
    } else if (number == "-") {
      rev_id = id;
      rev_color = FILL_COLOR;
      rev_number = 9;
    } else {
      rev_id = id;
      rev_color = color;
      rev_number = number - 1;
    }

    this.ani.add_sequence_ani({
      pause: 1,
      text:text,
      prop: {step:true},
      action: {params: {id: id, number: number, color: color}, func: table_td},
      rev_action: {params: {id: rev_id, number: rev_number, color: rev_color}, func: table_td}
    });

  }
}