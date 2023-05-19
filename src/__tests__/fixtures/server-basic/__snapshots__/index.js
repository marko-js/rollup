import http from 'http';
import { t } from 'marko/dist/runtime/html/index.js';
import _marko_renderer from 'marko/dist/runtime/components/renderer.js';
import _marko_tag from 'marko/dist/runtime/helpers/render-tag.js';

const _marko_componentType$2 = "71MAcDxK",
  _marko_template$2 = t(_marko_componentType$2);
const _marko_component$2 = {
  onMount() {
    console.log("mounted");
  }
};
_marko_template$2._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.w("<div id=class></div>");
}, {
  t: _marko_componentType$2
}, _marko_component$2);

const _marko_componentType$1 = "c1uTHRl3",
  _marko_template$1 = t(_marko_componentType$1);
const _marko_component$1 = {};
_marko_template$1._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.w("<div id=implicit>");
  _marko_tag(_marko_template$2, {}, out, _componentDef, "1");
  out.w("</div>");
}, {
  t: _marko_componentType$1,
  i: true
}, _marko_component$1);

const _marko_componentType = "gaG2ehQw",
  _marko_template = t(_marko_componentType);
const _marko_component = {};
_marko_template._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.w("<div id=page>");
  _marko_tag(_marko_template$1, {}, out, _componentDef, "1");
  out.w("</div>");
}, {
  t: _marko_componentType,
  i: true
}, _marko_component);

http
  .createServer((req, res) => {
    _marko_template.render({}, res);
  })
  .listen();
