'use strict';

var components = require('marko/components');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var components__default = /*#__PURE__*/_interopDefaultLegacy(components);

var component = {
  onMount() {
    console.log("mounted");
  },
};

components__default['default'].register("AW2ukATU", component);

components__default['default'].init();
