import { init } from 'marko/dist/runtime/components/index.js';
import { t } from 'marko/dist/runtime/vdom/index.js';
import _marko_createElement from 'marko/dist/runtime/vdom/helpers/v-element.js';
import _marko_renderer from 'marko/dist/runtime/components/renderer.js';
import { r } from 'marko/dist/runtime/components/registry';
import _marko_defineComponent from 'marko/dist/runtime/components/defineComponent.js';

const _marko_componentType = "n16FFHyL",
  _marko_template = t(_marko_componentType);
const _marko_node = _marko_createElement("div", {
  "id": "class"
}, "0", null, 0, 1);
r(_marko_componentType, () => _marko_template);
const _marko_component = {
  onMount() {
    console.log("mounted");
  }
};
_marko_template._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.n(_marko_node, _component);
}, {
  t: _marko_componentType
}, _marko_component);
_marko_template.Component = _marko_defineComponent(_marko_component, _marko_template._);

init();
