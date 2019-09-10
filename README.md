<h1 align="center">
  <!-- Logo -->
  <br/>
  @marko/rollup
	<br/>

  <!-- Language -->
  <a href="http://typescriptlang.org">
    <img src="https://img.shields.io/badge/%3C%2F%3E-typescript-blue.svg" alt="TypeScript"/>
  </a>
  <!-- Format -->
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Styled with prettier"/>
  </a>
  <!-- CI -->
  <a href="https://travis-ci.org/marko-js/rollup">
  <img src="https://img.shields.io/travis/marko-js/rollup.svg" alt="Build status"/>
  </a>
  <!-- Coverage -->
  <a href="https://coveralls.io/github/marko-js/rollup">
    <img src="https://img.shields.io/coveralls/marko-js/rollup.svg" alt="Test Coverage"/>
  </a>
  <!-- NPM Version -->
  <a href="https://npmjs.org/package/@marko/rollup">
    <img src="https://img.shields.io/npm/v/@marko/rollup.svg" alt="NPM Version"/>
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/@marko/rollup">
    <img src="https://img.shields.io/npm/dm/@marko/rollup.svg" alt="Downloads"/>
  </a>
</h1>

A Marko plugin for Rollup.

# Features
1. Compiles Marko templates for the browser.
2. Externalizes styles to be consumed by other tools (eg: [rollup-plugin-postcss](https://github.com/egoist/rollup-plugin-postcss#readme)).
3. Can calculate browser dependencies for a page template and send only templates with components to the browser.
4. Can output a bundle which automatically initializes Marko components.

**Note: The Marko 4 compiler outputs commonjs modules by default, this means the `rollup-plugin-commonjs` is required!**

# Installation

```console
npm install @marko/rollup
```

# Example Rollup config

```javascript
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import marko from "@marko/rollup";

export default {
  ...,
  plugins: [
    marko(),
    nodeResolve({
      browser: true,
      extensions: [".js", ".marko"]
    }),
    // NOTE: Marko 4 compiles to commonjs, this plugin is also required.
    commonjs({
      extensions: [".js", ".marko"]
    }),
    // If using `style` blocks with Marko you must use an appropriate plugin.
    postcss({
      external: true
    })
  ]
};
```

# Top level components

Marko was designed to send as little JavaScript to the browser as possible. One of the ways we do this is by automatically determining which templates in your app should be shipped to the browser.  When rendering a template on the server, it is only necessary to bundle the styles and interactive components rendered by that template.

To send the minimal amount of Marko templates to the browser you can provide a Marko template directly as the `input` to Rollup with the `hydrate` option as `true`.

```js
export default {
  input: "./my-marko-page.marko",
  plugins: [
    marko({
      hydrate: true
    }),
    ...
  ],
  ...
}
```

Include Rollup's output assets on the page with the server-rendered html and the components will be automatically initialized (you don't need to call `template.render` yourself in the browser).

## Advanced usage

### Multiple copies of Marko
In some cases you may want to embed multiple isolated copies of Marko on the page. Since Marko relies on some `window` properties to initialize this can cause issues. By default Marko will read the server rendered hydration code from `window.$components`.

This plugin exposes an `initComponents` option which allows you to provide your own JavaScript expression to evaluate when initializing the components.

```js
export default {
  input: "./my-marko-page.marko",
  plugins: [
    marko({
      hydrate: true,
      initComponents: "window.MY_APP_MARKO_COMPONENTS"
    }),
    ...
  ],
  ...
}
```

You can also set `initComponents` to `false` if you wish to manually call `require("marko.components").init(...)`.

## Code of Conduct

This project adheres to the [eBay Code of Conduct](./.github/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
