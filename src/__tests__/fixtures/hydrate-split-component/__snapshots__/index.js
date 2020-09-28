'use strict';

require('marko/dist/runtime/components');
var components$1 = require('marko/components');

var component = {
  onMount() {
    console.log("mounted");
  },
};

components$1.register("/@marko/rollup$latest/src/__tests__/fixtures/hydrate-split-component/src/components/split-component.component-browser", component);

components$1.init();
