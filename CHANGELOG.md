# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [4.0.1](https://github.com/marko-js/rollup/compare/v4.0.0...v4.0.1) (2023-05-19)


### Bug Fixes

* esm issue with duplicated import ([9acf312](https://github.com/marko-js/rollup/commit/9acf312b37f60875e798ca4a44da90ee0fbd5d9f))

## [4.0.0](https://github.com/marko-js/rollup/compare/v3.3.1...v4.0.0) (2023-05-19)


### ⚠ BREAKING CHANGES

* drop support for node < 16

* chore: resolve ts errors

* fix: inline correct __dirname code for esm

### Features

* support rollup 3 ([#38](https://github.com/marko-js/rollup/issues/38)) ([634f42d](https://github.com/marko-js/rollup/commit/634f42d74d758b3618d863560d300175ce13ea36))

### [3.3.1](https://github.com/marko-js/rollup/compare/v3.3.0...v3.3.1) (2021-06-24)


### Bug Fixes

* issue with multiple browser configs not waiting for eachother ([23f2d85](https://github.com/marko-js/rollup/commit/23f2d85c521b44e95fa4a7722af429130a98b293))

## [3.3.0](https://github.com/marko-js/rollup/compare/v3.2.1...v3.3.0) (2021-06-23)


### Features

* allow other plugins to modify the browser input ([f6a3e03](https://github.com/marko-js/rollup/commit/f6a3e03a9c26dba0984a2f93f97f1e9fcd72d47c))


### Bug Fixes

* issue with assets not being inlined with multi config ([#22](https://github.com/marko-js/rollup/issues/22)) ([8f38818](https://github.com/marko-js/rollup/commit/8f38818dafa3e42599785a39a7777b6e7e6673f1))

### [3.2.1](https://github.com/marko-js/rollup/compare/v3.2.0...v3.2.1) (2021-05-03)


### Bug Fixes

* reduce unecessary client bundle runs ([f512d51](https://github.com/marko-js/rollup/commit/f512d51a6d7c321376fb969d566f4b2a7add3ee4))

## [3.2.0](https://github.com/marko-js/rollup/compare/v3.1.1...v3.2.0) (2021-04-28)


### Features

* avoid writing to server entries file unnecessarily ([d1cab4e](https://github.com/marko-js/rollup/commit/d1cab4e4426432a7768eea381087ce97c207fb87))

### [3.1.1](https://github.com/marko-js/rollup/compare/v3.1.0...v3.1.1) (2021-04-28)


### Bug Fixes

* invalid entry id output in windows ([d2e8ec5](https://github.com/marko-js/rollup/commit/d2e8ec5ad9eaa1cf9efec92d2f660051a1b214f3))

## [3.1.0](https://github.com/marko-js/rollup/compare/v3.0.0...v3.1.0) (2021-04-08)


### Features

* add custom serialize option ([918d14b](https://github.com/marko-js/rollup/commit/918d14bf4a92b61a0bb19f7afa64fa38c33f8048))
* expose size meta data for chunks ([7109aeb](https://github.com/marko-js/rollup/commit/7109aeb2ba27ba7f1a16e538ddd0d6ea20ee4d3f))
* hide error message about empty entry chunks ([50b56fe](https://github.com/marko-js/rollup/commit/50b56feaccf9004f9ec0482eff834d0b125be949))


### Bug Fixes

* allow plugin invocations to happen out of order ([#9](https://github.com/marko-js/rollup/issues/9)) ([f19760b](https://github.com/marko-js/rollup/commit/f19760bc3a53fe65622b52b4c664b54bb277dad1))

## [3.0.0](https://github.com/marko-js/rollup/compare/v2.2.1...v3.0.0) (2021-03-27)


### ⚠ BREAKING CHANGES

* drop support for Marko 4 compiler
* new api to support server plugin

### Features

* Linked server & browser compilers ([#6](https://github.com/marko-js/rollup/issues/6)) ([35644d7](https://github.com/marko-js/rollup/commit/35644d7ec398d888aa9bcb70008f79eb7cb46cce))


### Bug Fixes

* marko 5 imports, remove warning about eval ([a2e311f](https://github.com/marko-js/rollup/commit/a2e311fd61819c5579af699009fc854dd79d3f7f))

## [2.3.0](https://github.com/marko-js/rollup/compare/v2.0.2...v2.3.0) (2020-09-28)


### Features

* marko 5 compiler support ([3d2184b](https://github.com/marko-js/rollup/commit/3d2184bf2f42c78fd4fb8c07e5d88f4a1a3e983f))
* update deps, cleanup config, support rollup 2 ([927a5b5](https://github.com/marko-js/rollup/commit/927a5b56f72619e7a8e20ca34761db99b027d227))


### Bug Fixes

* marko 5 imports, remove warning about eval ([a2e311f](https://github.com/marko-js/rollup/commit/a2e311fd61819c5579af699009fc854dd79d3f7f))
* marko 5 peer dependency ([633fa8f](https://github.com/marko-js/rollup/commit/633fa8f94c2ffc36be7a3647a1e1f4710824c9b5))
* plugin compatibility with Rollup Watch Mode ([00a668c](https://github.com/marko-js/rollup/commit/00a668c4ccef7487ccc2c1cb4b2987cd332bb0da))
* run lint on all files ([52969eb](https://github.com/marko-js/rollup/commit/52969eb92c77dba791e15bbd98feb2f2c43ddad1))
* use specifiers where possible on inserted imports ([83cea9d](https://github.com/marko-js/rollup/commit/83cea9d1ca7d082eadafd66f0f0d14639376db6b))

### [2.2.1](https://github.com/marko-js/rollup/compare/v2.2.0...v2.2.1) (2020-08-25)


### Bug Fixes

* marko 5 peer dependency ([633fa8f](https://github.com/marko-js/rollup/commit/633fa8f94c2ffc36be7a3647a1e1f4710824c9b5))

## [2.2.0](https://github.com/marko-js/rollup/compare/v2.1.1...v2.2.0) (2020-08-25)


### Features

* update deps, cleanup config, support rollup 2 ([927a5b5](https://github.com/marko-js/rollup/commit/927a5b56f72619e7a8e20ca34761db99b027d227))


### Bug Fixes

* plugin compatibility with Rollup Watch Mode ([00a668c](https://github.com/marko-js/rollup/commit/00a668c4ccef7487ccc2c1cb4b2987cd332bb0da))

### [2.1.1](https://github.com/marko-js/rollup/compare/v2.1.0...v2.1.1) (2020-03-03)

## [2.1.0](https://github.com/marko-js/rollup/compare/v2.0.3...v2.1.0) (2020-03-03)


### Features

* marko 5 compiler support ([3d2184b](https://github.com/marko-js/rollup/commit/3d2184bf2f42c78fd4fb8c07e5d88f4a1a3e983f))

### [2.0.3](https://github.com/marko-js/rollup/compare/v2.0.2...v2.0.3) (2020-03-03)


### Bug Fixes

* run lint on all files ([52969eb](https://github.com/marko-js/rollup/commit/52969eb92c77dba791e15bbd98feb2f2c43ddad1))
* use specifiers where possible on inserted imports ([83cea9d](https://github.com/marko-js/rollup/commit/83cea9d1ca7d082eadafd66f0f0d14639376db6b))

### [2.0.2](https://github.com/marko-js/rollup/compare/v2.0.1...v2.0.2) (2020-02-01)

### [2.0.1](https://github.com/marko-js/rollup/compare/v2.0.0...v2.0.1) (2019-10-02)


### Bug Fixes

* add missing dependencies ([2a18002](https://github.com/marko-js/rollup/commit/2a18002))

## [2.0.0](https://github.com/marko-js/rollup/compare/v1.0.0...v2.0.0) (2019-09-25)


### ⚠ BREAKING CHANGES

* Adds a new option `runtimeId` which replaces the string behaviour of the `initComponents` option.

### Features

* align with `runtimeId` implementation for use with multiple copies of Marko ([ae0caae](https://github.com/marko-js/rollup/commit/ae0caae))

## 1.0.0 (2019-09-10)


### Features

* initial commit ([d85d0ed](https://github.com/marko-js/rollup/commit/d85d0ed))

## 1.1.0 (2019-09-10)


### Features

* initial commit ([5011475](https://github.com/marko-js/rollup/commit/5011475))
