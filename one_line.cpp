#include <iostream>
#include <fstream>
using namespace std;

int main(int argc, char **argv) {

  string file, s, line, all;
  int num_lines;
 
  bool header_comment;
  int i, count;
  if (argc <= 1 || argc >= 4) {
    fprintf(stderr, "./one_line js_file [num_lines]\n");
    exit(1);
  }
  file = argv[1];

  fstream in;
  in.open(file,ios::in);
  if (!in.is_open()) {
    fprintf(stderr, "./one_line js_file\n");
    exit(1);
  }

  if (argc == 3) num_lines = atoi(argv[2]);
  else num_lines = 0xfffffff;

  all = "";


  header_comment = true;
  count = 0;
  while (getline(in, line)) {
    s = "";

    if (count >= num_lines) {
      all += line + '\n';
      continue;

    }
    /* get rid of space */
    for (i = 0; i < line.size(); i++) {
      if (i != line.size() - 1 && line[i] == '/' && line[i + 1] == '/') {
        line = line.substr(0, i);
        break;
      }
      if (line[i] != ' ') s += line[i];

    }


    /* slash slash commetn. get rid of it */
    if (s.size() >= 2 && s[0] == '/' && s[1] == '/') {} 
    else if (header_comment) {
      all += line + '\n';
    } else {
      all += line;
    }

    if (s.size() >= 2 && s[s.size() - 2] == '*' && s[s.size() - 1] == '/') {
      header_comment = false;
    }
    count++;
  }
  cout << all << endl;


}