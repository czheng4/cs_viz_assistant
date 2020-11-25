/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/22/2020
*/
function *address_generator() {
  let random;
  let rng = new randomNumber(0);
  while(true) {
    random = rng.get_number().toString(16).slice(0, 2);
    yield `0x${random}`;
  }
}


class randomNumber {

  /*DJB" hash function from the York University page: http://www.cse.yorku.ca/~oz/hash.html*/
  hash(s) {
    let h = 5381;

    s = s.toString();
    for(var i = 0; i < s.length;i++) {
      h = (h << 5) + h + s.charCodeAt(i);
      h %= 0xffffffffffffffff;
    }
    if(h < 0) h = -h;
    return h;
  }
  constructor(seed) {
    this.num_calls = 0;
    this.seed = seed;
  }

  get_number() {
    this.seed = this.hash(this.seed);
    this.num_calls++;
    return this.seed;
  }




}

/* get the reference of an object. If the fake memory has not been generated for the object, 
   we call generator to get one
*/
class memorySimulator {
  constructor() {
    this.generator = address_generator();
    this.object_to_address = new Map();
    this.address_to_object = new Map();
    this.num_calls = 0;
  }

  /* used to match to the same state */
  call_generator (times) {
    for (let i = 0; i < times; i++) {
      this.generator.next();
    }
  }


  get_reference(obj) {
    let address;
    let object_to_address = this.object_to_address;
    let address_to_object = this.address_to_object;

    if (object_to_address.has(obj)) {
      address = object_to_address.get(obj);
    } else {
      do {
        address = this.generator.next().value;
        this.num_calls++;
      } while (address_to_object.has(address));
      object_to_address.set(obj, address);
      address_to_object.set(address, obj);
    }
    return address;
  }

  get_object(address) {
    let address_to_object = this.address_to_object;

    if (address_to_object.has(address)) {
      return address_to_object.get(address);
    } else {
    	return null
      console.log("wrong address");
    }
  }

}
