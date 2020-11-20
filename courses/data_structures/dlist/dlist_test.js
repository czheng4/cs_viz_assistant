

function dlist_test1() {
  MAIN_A = new dlistAnimation();
  aniTester = new animationTester(MAIN_A);

  aniTester.add_func("push_back", [1]);
  aniTester.add_func("push_front", [3]);
  aniTester.add_func("push_front", [2]);
  aniTester.add_func("push_front", [12]);
  aniTester.add_func("pop_back", []);
  
  aniTester.run_test();
}
