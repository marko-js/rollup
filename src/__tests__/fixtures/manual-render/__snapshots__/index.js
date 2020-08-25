'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var require$$0 = _interopDefault(require('marko/dist/vdom'));
var components_registry_browser = _interopDefault(require('marko/dist/runtime/components/registry-browser'));
var marko_renderer = _interopDefault(require('marko/dist/runtime/components/renderer'));
var marko_defineComponent = _interopDefault(require('marko/dist/runtime/components/defineComponent'));
var marko_createElement = _interopDefault(require('marko/dist/runtime/vdom/helpers/v-element'));
var marko_const = _interopDefault(require('marko/dist/runtime/vdom/helpers/const'));
var marko_loadTag = _interopDefault(require('marko/dist/runtime/helpers/load-tag'));

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var classComponent = createCommonjsModule(function (module) {

var marko_template = module.exports = require$$0.t(),
    marko_component = {
        onMount: function() {
          console.log("mounted");
        }
      },
    marko_registerComponent = components_registry_browser.r,
    marko_componentType = marko_registerComponent("/@marko/rollup$latest/src/__tests__/fixtures/manual-render/src/components/class-component.marko", function() {
      return module.exports;
    }),
    marko_const_nextId = marko_const("4d364d"),
    marko_node0 = marko_createElement("div", {
        id: "class"
      }, "0", null, 0, 0, {
        i: marko_const_nextId()
      });

function render(input, out, __component, component, state) {

  out.n(marko_node0, component);
}

marko_template._ = marko_renderer(render, {
    e_: marko_componentType
  }, marko_component);

marko_template.Component = marko_defineComponent(marko_component, marko_template._);
});

var implicitComponent = createCommonjsModule(function (module) {

var marko_template = module.exports = require$$0.t(),
    marko_registerComponent = components_registry_browser.r,
    marko_componentType = marko_registerComponent("/@marko/rollup$latest/src/__tests__/fixtures/manual-render/src/components/implicit-component.marko", function() {
      return module.exports;
    }),
    class_component_tag = marko_loadTag(classComponent),
    marko_attrs0 = {
        id: "implicit"
      };

function render(input, out, __component, component, state) {

  out.be("div", marko_attrs0, "0", component);

  class_component_tag({}, out, __component, "1");

  out.ee();
}

marko_template._ = marko_renderer(render, {
    d_: true,
    e_: marko_componentType
  });

marko_template.Component = marko_defineComponent({}, marko_template._);
});

var template = createCommonjsModule(function (module) {

var marko_template = module.exports = require$$0.t(),
    marko_registerComponent = components_registry_browser.r,
    marko_componentType = marko_registerComponent("/@marko/rollup$latest/src/__tests__/fixtures/manual-render/src/template.marko", function() {
      return module.exports;
    }),
    implicit_component_tag = marko_loadTag(implicitComponent),
    marko_attrs0 = {
        id: "page"
      };

function render(input, out, __component, component, state) {

  out.be("div", marko_attrs0, "0", component);

  implicit_component_tag({}, out, __component, "1");

  out.ee();
}

marko_template._ = marko_renderer(render, {
    d_: true,
    e_: marko_componentType
  });

marko_template.Component = marko_defineComponent({}, marko_template._);
});

template.render({}).appendTo(document.body);
