'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('marko/dist/runtime/components');
var __rollup_marko_runtime__ = _interopDefault(require('marko/components'));

var __rollup_marko_component__ = {
  onMount() {
    console.log("mounted");
  }
};

__rollup_marko_runtime__.register("/@marko/rollup$latest/src/__tests__/fixtures/hydrate-split-component/src/components/split-component.component-browser",__rollup_marko_component__);

__rollup_marko_runtime__.init();
