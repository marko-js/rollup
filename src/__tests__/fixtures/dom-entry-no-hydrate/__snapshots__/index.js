import _marko_createElement from 'marko/dist/runtime/vdom/helpers/v-element';
import _marko_renderer from 'marko/dist/runtime/components/renderer';
import { t } from 'marko/dist/runtime/dom';
import { r } from 'marko/dist/runtime/components/registry-browser';
import _marko_defineComponent from 'marko/dist/runtime/components/defineComponent';
import _marko_tag from 'marko/dist/runtime/helpers/render-tag';

const _marko_template = t();

const _marko_node = _marko_createElement("div", {
  "id": "class"
}, "0", null, 0, 1);

const _marko_componentType = r("9Hm+P4AG", () => _marko_template),
      _marko_component = {
  onMount() {
    console.log("mounted");
  }

};

_marko_template._ = _marko_renderer(function (input, out, _component, component, state) {
  out.n(_marko_node, component);
}, {
  t: _marko_componentType
}, _marko_component);
_marko_template.Component = _marko_defineComponent(_marko_component, _marko_template._);

const _marko_template$1 = t();

const _marko_componentType$1 = r("hJEYwkTc", () => _marko_template$1),
      _marko_component$1 = {};

_marko_template$1._ = _marko_renderer(function (input, out, _component, component, state) {
  out.be("div", {
    "id": "implicit"
  }, "0", component, null, 1);

  _marko_tag(_marko_template, {}, out, _component, "1");

  out.ee();
}, {
  t: _marko_componentType$1,
  i: true
}, _marko_component$1);
_marko_template$1.Component = _marko_defineComponent(_marko_component$1, _marko_template$1._);

const _marko_template$2 = t();

const _marko_componentType$2 = r("LGZb1o67", () => _marko_template$2),
      _marko_component$2 = {};

_marko_template$2._ = _marko_renderer(function (input, out, _component, component, state) {
  out.be("div", {
    "id": "page"
  }, "0", component, null, 1);

  _marko_tag(_marko_template$1, {}, out, _component, "1");

  out.ee();
}, {
  t: _marko_componentType$2,
  i: true
}, _marko_component$2);
_marko_template$2.Component = _marko_defineComponent(_marko_component$2, _marko_template$2._);

export default _marko_template$2;
