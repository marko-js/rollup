'use strict';

var _marko_createElement = require('marko/dist/runtime/vdom/helpers/v-element');
var _marko_renderer = require('marko/dist/runtime/components/renderer');
var dom = require('marko/dist/runtime/dom');
var registryBrowser = require('marko/dist/runtime/components/registry-browser');
var _marko_defineComponent = require('marko/dist/runtime/components/defineComponent');
var components = require('marko/components');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _marko_createElement__default = /*#__PURE__*/_interopDefaultLegacy(_marko_createElement);
var _marko_renderer__default = /*#__PURE__*/_interopDefaultLegacy(_marko_renderer);
var _marko_defineComponent__default = /*#__PURE__*/_interopDefaultLegacy(_marko_defineComponent);

const _marko_template = dom.t();

const _marko_node = _marko_createElement__default['default']("div", {
  "id": "class"
}, "0", null, 0, 1);

const _marko_componentType = registryBrowser.r("VAGN//0e", () => _marko_template),
      _marko_component = {
  onMount() {
    console.log("mounted");
  }

};

_marko_template._ = _marko_renderer__default['default'](function (input, out, _component, component, state) {
  out.n(_marko_node, component);
}, {
  t: _marko_componentType
}, _marko_component);
_marko_template.Component = _marko_defineComponent__default['default'](_marko_component, _marko_template._);

components.init("SOME_COMPONENTS");
