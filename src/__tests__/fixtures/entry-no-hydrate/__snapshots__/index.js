'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _marko_createElement = require('marko/dist/runtime/vdom/helpers/v-element');
var _marko_renderer = require('marko/dist/runtime/components/renderer');
var dom = require('marko/dist/runtime/dom');
var registryBrowser = require('marko/dist/runtime/components/registry-browser');
var _marko_defineComponent = require('marko/dist/runtime/components/defineComponent');
var _marko_tag = require('marko/dist/runtime/helpers/render-tag');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _marko_createElement__default = /*#__PURE__*/_interopDefaultLegacy(_marko_createElement);
var _marko_renderer__default = /*#__PURE__*/_interopDefaultLegacy(_marko_renderer);
var _marko_defineComponent__default = /*#__PURE__*/_interopDefaultLegacy(_marko_defineComponent);
var _marko_tag__default = /*#__PURE__*/_interopDefaultLegacy(_marko_tag);

const _marko_template = dom.t();

const _marko_node = _marko_createElement__default['default']("div", {
  "id": "class"
}, "0", null, 0, 1);

const _marko_componentType = registryBrowser.r("KA0TDeGH", () => _marko_template),
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

const _marko_template$1 = dom.t();

const _marko_componentType$1 = registryBrowser.r("7i0iDZmN", () => _marko_template$1),
      _marko_component$1 = {};

_marko_template$1._ = _marko_renderer__default['default'](function (input, out, _component, component, state) {
  out.be("div", {
    "id": "implicit"
  }, "0", component, null, 1);

  _marko_tag__default['default'](_marko_template, {}, out, _component, "1");

  out.ee();
}, {
  t: _marko_componentType$1,
  i: true
}, _marko_component$1);
_marko_template$1.Component = _marko_defineComponent__default['default'](_marko_component$1, _marko_template$1._);

const _marko_template$2 = dom.t();

const _marko_componentType$2 = registryBrowser.r("9v2fgbxx", () => _marko_template$2),
      _marko_component$2 = {};

_marko_template$2._ = _marko_renderer__default['default'](function (input, out, _component, component, state) {
  out.be("div", {
    "id": "page"
  }, "0", component, null, 1);

  _marko_tag__default['default'](_marko_template$1, {}, out, _component, "1");

  out.ee();
}, {
  t: _marko_componentType$2,
  i: true
}, _marko_component$2);
_marko_template$2.Component = _marko_defineComponent__default['default'](_marko_component$2, _marko_template$2._);

exports.default = _marko_template$2;
