import http from 'http';
import { t } from 'marko/dist/runtime/html/index.js';
import _marko_renderer from 'marko/dist/runtime/components/renderer.js';
import _marko_tag from 'marko/dist/runtime/helpers/render-tag.js';
import _marko_attr from 'marko/dist/runtime/html/helpers/attr.js';
import _marko_dynamic_tag from 'marko/dist/runtime/helpers/dynamic-tag.js';
import _flush_here_and_after__ from 'marko/dist/core-tags/core/__flush_here_and_after__.js';
import _initComponents from 'marko/dist/core-tags/components/init-components-tag.js';
import _awaitReorderer from 'marko/dist/core-tags/core/await/reorderer-renderer.js';
import _preferredScriptLocation from 'marko/dist/core-tags/components/preferred-script-location-tag.js';

const _marko_componentType$5 = "1BSUdNzk",
  _marko_template$5 = t(_marko_componentType$5);
const _marko_component$5 = {
  onMount() {
    console.log("mounted");
  }
};
_marko_template$5._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.w("<div id=class></div>");
}, {
  t: _marko_componentType$5
}, _marko_component$5);

const _marko_componentType$4 = "9/pH0cjn",
  _marko_template$4 = t(_marko_componentType$4);
const _marko_component$4 = {};
_marko_template$4._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.w("<div id=implicit>");
  _marko_tag(_marko_template$5, {}, out, _componentDef, "1");
  out.w("</div>");
}, {
  t: _marko_componentType$4,
  i: true
}, _marko_component$4);

const _marko_componentType$3 = "uoKBM4Ke",
  _marko_template$3 = t(_marko_componentType$3);
const _marko_component$3 = {};
_marko_template$3._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  const markoGlobal = out.global;
  const entries = markoGlobal.__rollupEntries || (markoGlobal.__rollupEntries = []);
  let writtenEntries = 0;
  _marko_tag(_flush_here_and_after__, {
    "renderBody": out => {
      const lastWrittenEntry = writtenEntries;
      writtenEntries = entries.length;
      for (let _steps = (writtenEntries - 1 - lastWrittenEntry) / 1, _step = 0; _step <= _steps; _step++) {
        const i = lastWrittenEntry + _step * 1;
        const _keyScope = `[${i}]`;
        _marko_dynamic_tag(out, input.renderBody, null, null, [entries[i], ...__MARKO_MANIFEST__], null, _componentDef, "1" + _keyScope);
      }
    }
  }, out, _componentDef, "0");
}, {
  t: _marko_componentType$3,
  i: true
}, _marko_component$3);

const _marko_componentType$2 = "EBjOWFdJ",
  _marko_template$2 = t(_marko_componentType$2);
const _marko_component$2 = {};
_marko_template$2._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  out.w("<!DOCTYPE html><html lang=en><head>");
  _marko_tag(_marko_template$3, {
    "renderBody": (out, entry, chunks) => {
      const jsChunk = chunks.find(chunk => chunk.name === entry);
      for (const fileName of jsChunk.imports) {
        out.w(`<link rel=modulepreload${_marko_attr("href", `/static/${fileName}`)}>`);
      }
      out.w(`<script async type=module${_marko_attr("src", `/static/${jsChunk.fileName}`)}></script><link rel=stylesheet${_marko_attr("href", `/static/${chunks.find(chunk => /\.css$/.test(chunk.fileName)).fileName}`)}>`);
    }
  }, out, _componentDef, "2");
  out.w("</head><body>");
  _marko_dynamic_tag(out, input.renderBody, null, null, null, null, _componentDef, "7");
  _marko_tag(_initComponents, {}, out, _componentDef, "8");
  _marko_tag(_awaitReorderer, {}, out, _componentDef, "9");
  _marko_tag(_preferredScriptLocation, {}, out, _componentDef, "10");
  out.w("</body></html>");
}, {
  t: _marko_componentType$2,
  i: true
}, _marko_component$2);

const _marko_componentType$1 = "NgVTgNMO",
  _marko_template$1 = t(_marko_componentType$1);
const _marko_component$1 = {};
_marko_template$1._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  _marko_tag(_marko_template$2, {
    "renderBody": out => {
      out.w("<div id=page>");
      _marko_tag(_marko_template$4, {}, out, _componentDef, "2");
      out.w("</div>");
    }
  }, out, _componentDef, "0");
}, {
  t: _marko_componentType$1,
  i: true
}, _marko_component$1);

const _marko_componentType = "NgVTgNMO",
  _marko_template = t(_marko_componentType);
const _marko_component = {};
_marko_template._ = _marko_renderer(function (input, out, _componentDef, _component, state, $global) {
  const markoGlobal = out.global;
  (markoGlobal.__rollupEntries || (markoGlobal.__rollupEntries = [])).push("src_JMN3");
  _marko_tag(_marko_template$1, input, out, _componentDef, "0");
  _marko_tag(_initComponents, {}, out, _componentDef, "1");
  _marko_tag(_awaitReorderer, {}, out, _componentDef, "2");
}, {
  t: _marko_componentType,
  i: true
}, _marko_component);

http
  .createServer((req, res) => {
    _marko_template.render({}, res);
  })
  .listen();
;var __MARKO_MANIFEST__=[[{"type":"chunk","fileName":"src_JMN3.js","name":"src_JMN3","imports":["marko/dist/runtime/components/index.js","marko/dist/runtime/vdom/index.js","marko/dist/runtime/vdom/helpers/v-element.js","marko/dist/runtime/components/renderer.js","marko/dist/runtime/components/registry","marko/dist/runtime/components/defineComponent.js"],"isEntry":true,"dynamicImports":[],"isDynamicEntry":false,"referencedFiles":[],"isImplicitEntry":false,"implicitlyLoadedBefore":[],"size":1004},{"type":"asset","fileName":"src_JMN3.css","size":24}]];
