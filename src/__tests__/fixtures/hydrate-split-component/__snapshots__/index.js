'use strict';

var components = require('marko/components');

var component = {
  onMount() {
    console.log("mounted");
  },
};

components.register("AW2ukATU", component);

components.init();
