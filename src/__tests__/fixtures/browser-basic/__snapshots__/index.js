import { t } from 'marko/dist/runtime/vdom/index.js';
import _marko_createElement from 'marko/dist/runtime/vdom/helpers/v-element.js';
import _marko_renderer from 'marko/dist/runtime/components/renderer.js';
import { r } from 'marko/dist/runtime/components/registry';
import _marko_defineComponent from 'marko/dist/runtime/components/defineComponent.js';
import _marko_tag from 'marko/dist/runtime/helpers/render-tag.js';

const _marko_componentType$2 = "NApEsAbr",
  _marko_template$2 = t(_marko_componentType$2);
const _marko_node = _marko_createElement("div", {
  "id": "class"
}, "0", null, 0, 1);
r(_marko_componentType$2, () => _marko_template$2);
const _marko_component$2 = {
  onMount() {
    console.log("mounted");
  }
};
_marko_template$2._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.n(_marko_node, _component);
}, {
  t: _marko_componentType$2
}, _marko_component$2);
_marko_template$2.Component = _marko_defineComponent(_marko_component$2, _marko_template$2._);

const _marko_componentType$1 = "XB6QxsYj",
  _marko_template$1 = t(_marko_componentType$1);
r(_marko_componentType$1, () => _marko_template$1);
const _marko_component$1 = {};
_marko_template$1._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.be("div", {
    "id": "implicit"
  }, "0", _component, null, 1);
  _marko_tag(_marko_template$2, {}, out, _componentDef, "1");
  out.ee();
}, {
  t: _marko_componentType$1,
  i: true
}, _marko_component$1);
_marko_template$1.Component = _marko_defineComponent(_marko_component$1, _marko_template$1._);

const _marko_componentType = "aXMop0py",
  _marko_template = t(_marko_componentType);
r(_marko_componentType, () => _marko_template);
const _marko_component = {};
_marko_template._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.be("div", {
    "id": "page"
  }, "0", _component, null, 1);
  _marko_tag(_marko_template$1, {}, out, _componentDef, "1");
  out.ee();
}, {
  t: _marko_componentType,
  i: true
}, _marko_component);
_marko_template.Component = _marko_defineComponent(_marko_component, _marko_template._);

_marko_template.renderSync().appendTo(document.body);
