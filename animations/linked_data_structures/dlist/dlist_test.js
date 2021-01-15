/*
  ChaoHui Zheng
  11/22/2020
*/

function dlist_test1() {
  MAIN_A = new dlistAnimation();
  aniTester = new animationTester(20, 20, 5);

  aniTester.add_func("push_back", [1]);
  aniTester.add_func("push_front", [3]);
  aniTester.add_func("push_front", [4]);
  aniTester.add_func("push_back", [5]);
  aniTester.add_func("pop_front", []);
  aniTester.add_func("pop_back", []);
  aniTester.add_func("insert_after_node", [12, "0x14"]);
  aniTester.add_func("push_back", [54]);
  aniTester.add_func("erase", ["0x7e"]);
  // aniTester.add_func("erase", [])


  aniTester.run_test();
}


