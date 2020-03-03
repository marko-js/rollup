'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('marko/dist/runtime/components');
var components$1 = _interopDefault(require('marko/components'));

var component = {
  onMount() {
    console.log("mounted");
  }
};

components$1.register("/@marko/rollup$latest/src/__tests__/fixtures/hydrate-split-component/src/components/split-component.component-browser", component);

components$1.init();
