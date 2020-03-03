'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var vdom = _interopDefault(require('marko/dist/vdom'));
var registryBrowser = _interopDefault(require('marko/dist/runtime/components/registry-browser'));
var renderer = _interopDefault(require('marko/dist/runtime/components/renderer'));
var defineComponent = _interopDefault(require('marko/dist/runtime/components/defineComponent'));
var vElement = _interopDefault(require('marko/dist/runtime/vdom/helpers/v-element'));
var _const = _interopDefault(require('marko/dist/runtime/vdom/helpers/const'));
var components = require('marko/components');

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var classComponent = createCommonjsModule(function (module) {

var marko_template = module.exports = vdom.t(),
    marko_component = {
        onMount: function() {
          console.log("mounted");
        }
      },
    marko_registerComponent = registryBrowser.r,
    marko_componentType = marko_registerComponent("/@marko/rollup$latest/src/__tests__/fixtures/hydrate-entry-custom-init/src/components/class-component.marko", function() {
      return module.exports;
    }),
    marko_const_nextId = _const("4d364d"),
    marko_node0 = vElement("div", {
        id: "class"
      }, "0", null, 0, 0, {
        i: marko_const_nextId()
      });

function render(input, out, __component, component, state) {

  out.n(marko_node0, component);
}

marko_template._ = renderer(render, {
    e_: marko_componentType
  }, marko_component);

marko_template.Component = defineComponent(marko_component, marko_template._);
});

components.init("SOME_COMPONENTS");
