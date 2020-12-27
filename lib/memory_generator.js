/*
  Copyright (C) 2020, ChaoHui Zheng
  All rights reserved.
  
  11/22/2020
  last modified 12/19/2020
*/

function *address_generator(n) {
  let random;
  let rng = new randomNumber(0);
  while(true) {
    random = rng.get_number().toString(16).slice(0, n);
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
   
   if it's continious, we increment the memory adress by diff everytime we call it.
*/
class memorySimulator {
  constructor(n = 2, continuous = false, diff = 32) {
    this.generator = address_generator(n);
    this.object_to_address = new Map();
    this.address_to_object = new Map();
    this.num_calls = 0;
    this.pre_address = -1;
    this.diff = 32;
    this.continuous = continuous;

    if (continuous == true) {
      this.pre_address = this.generator.next().value.slice(2, n + 1);
      this.pre_address = this.pre_address + '0';
      this.pre_address = parseInt(this.pre_address, 16);
    }
  }

  /* used to match to the same state */
  call_generator (times) {
    for (let i = 0; i < times; i++) {
      this.generator.next();
      this.num_calls++;
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
        if (this.continuous) {
          address = this.pre_address + this.diff;
          this.pre_address = address;
          address = "0x" + address.toString(16);
        } else address = this.generator.next().value;

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
