# The Divine AMD JavaScript Module Loader

This is a small, fully static AMD module loader. It does not dynamically load
scripts at runtime; instead, all modules must be available up front.

## Features

* Named modules
    * Using the `define('id', ['dep1', ...], function factory(dep1, ...) {...})` syntax.
    * Using the `define('id', function(require, exports, module) {...})` syntax.
    * Named modules can be placed in HTML files or external scripts and any
      number of modules can be in the same file.
    * Named module IDs must be absolute.
* Unnamed modules
    * Using the `define([deps], function factory(deps) {...})` syntax.
    * Using the `define(id, function(require, exports, module) {...})` syntax.
    * Unnamed modules should be in their own script file and referenced by a
      `<script>` tag. The name of the module will be automatically calculated
      based on the path.
* The `requre()` function
    * Synchronous version: `require('module')`, which returns the module
      immediately.
    * Asynchronous version: `require(['dep1', ...], function resolve(dep1, ...)
      {...}, function reject(error) { ...})`. The last argument may be omitted.
* For all dependencies, relative module paths are supported.
* When defining modules, if the factory is not a function, the module will be
  value of that argument itself, so bundling non-JavaScript code works as well.
* The property `define.amd.divine.debug` may be set to `true` to enable
  debug/diagnostics logging.

## Use Cases

* Rapid rebuilds: Pack your favorite frameworks with `webpack` as AMD once—a
  rather slow operation—and then simply concatenate or load them directly via
  `<scropt>` tags.
* Use the *TypeScript* compiler's `"outFile": "app.js"` and `"module": "amd"`
  options to compile to something deployable directly, without any other build
  steps. Perfect for development and viable even for production.

## The MIT License

Copyright 2017 Martin Blom. A Divine Software™ production.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
