import { init } from 'marko/components';
import _marko_createElement from 'marko/dist/runtime/vdom/helpers/v-element';
import _marko_renderer from 'marko/dist/runtime/components/renderer';
import { t } from 'marko/dist/runtime/vdom';
import { r } from 'marko/dist/runtime/components/registry-browser';
import _marko_defineComponent from 'marko/dist/runtime/components/defineComponent';

const _marko_template = t();

const _marko_node = _marko_createElement("div", {
  "id": "class"
}, "0", null, 0, 1);

const _marko_componentType = r("1BSUdNzk", () => _marko_template),
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

init();
