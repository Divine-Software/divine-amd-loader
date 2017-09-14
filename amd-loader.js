(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    }
    else if (typeof module === 'object' && module.exports) {
        factory(module.exports);
    }
    else {
        factory(root);
    }
}(this, function (exports) {
    var modules = {};
    var unnamed = 0;

    function moduleName() {
        var base   = typeof document !== "undefined" && document.location      && document.location.href;
        var script = typeof document !== "undefined" && document.currentScript && document.currentScript.src;

        if (typeof script !== "string") {
            script = document.getElementsByTagName("script");
            script = script[script.length - 1].src;
        }

        var baseDir = base.replace(/[^/]+$/, "");
        var module;

        if (script.startsWith(baseDir)) {
            module = script.substr(baseDir.length);
        }
        else {
            module = script.replace(/.*\//, "");
        }

        module = module.replace(/\.[^.]*$/, "");

        if (define.amd.bestest.debug) {
            console.debug("Module name '" + module + "' calculated from base '" + base + "', script '" + script + "'.");
        }

        return module;
    }

    function absolutePath(base, path) {
        if (path[0] !== ".") {
            return path;
        }

        var baseParts = base.split("/");
        var pathParts = path.split("/");

        baseParts.pop();

        pathParts.forEach(function(part) {
            if (part === "." || part === "") {
                // Nothing to do
            }
            else if (part === "..") {
                baseParts.pop();
            }
            else {
                baseParts.push(part);
            }
        });

        var module = baseParts.join("/");

        if (define.amd.bestest.debug) {
            console.debug("Resolved module '" + path + "' relative base '" + base + "' to '" + module + "'.");
        }

        return module;
    }

    function define() {
        var id, deps, factory;

        if (arguments.length === 1) {
            id      = moduleName();
            deps    = ["require", "exports", "module"];
            factory = arguments[0];
        }
        else if (arguments.length === 2 && typeof arguments[0] === "string") {
            id      = arguments[0];
            deps    = ["require", "exports", "module"];
            factory = arguments[1]
        }
        else if (arguments.length === 2) {
            id      = moduleName();
            deps    = arguments[0];
            factory = arguments[1];
        }
        else if (arguments.length === 3) {
            id      = arguments[0];
            deps    = arguments[1];
            factory = arguments[2];
        }
        else {
            throw new Error("define() expected 1, 2 or 3 arguments.");
        }

        if (typeof id !== "string") {
            throw new TypeError("Module ID must be a string.");
        }
        else if (!Array.isArray(deps)) {
            throw new TypeError("Modulde dependencies must be an Array.");
        }

        if (!id) {
            id = "<anonymous-" + ++unnamed + ">";
            if (define.amd.bestest.debug) {
                console.warn(new Error("Defining unnamed module '" + id + "'."));
            }
        }
        else {
            if (define.amd.bestest.debug) {
                console.debug("Defining module '" + id + "'.");
            }
        }

        if (modules[id]) {
            console.error(new Error("Module '" + id + "' already defined."));
            return;
        }

        var module = modules[id] = { module: { id: id }, exports: {} };

        if (typeof factory !== 'function') {
            module.exports = factory;
        }
        else {
            var builtins = {
                require: function require(deps, resolve, reject) {
                    return requireHelper(deps, resolve, reject, id, builtins);
                },
                exports: module.exports,
                module: module.module
            };

            builtins.require(deps, function() {
                var exports = factory.apply(null, arguments);

                if (exports) {
                    // Keep references to circular dependencies at least somewhat valid by pointing
                    // the prototype chain of the original empty exports to the new object.
                    module.exports.__proto__ = exports;
                    module.exports = exports;

                    if (define.amd.bestest.debug) {
                        console.warn("Module '" + id + "' did not use the 'exports' dependency, which is required for full circular dependency support.");
                    }
                }
            });
        }
    }

    function requireHelper(deps, resolve, reject, id, builtins) {
        if (typeof deps === "string" && !resolve && !reject) {
            deps = absolutePath(id, deps);

            if (builtins[deps]) {
                return builtins[deps];
            }
            else if (modules[deps]) {
                return modules[deps].exports;
            }
            else {
                throw new Error("require() failed to find module '" + deps + "' (referenced from module '" + id + "').");
            }
        }
        else if (!Array.isArray(deps)) {
            throw new TypeError("First require() argument should be an Array.");
        }
        else if (typeof resolve !== "function") {
            throw new TypeError("Second require() argument should be a function.");
        }
        else if (reject && typeof reject !== "function") {
            throw new TypeError("Third require() argument should be a function, if specified.");
        }
        else {
            setTimeout(function() {
                try {
                    resolve.apply(null, (deps.map(function(dep) { return requireHelper(dep.toString(), null, null, id, builtins); })));
                }
                catch (ex) {
                    if (typeof reject === "function") {
                        reject(ex);
                    }
                    else {
                        console.error(ex);
                    }
                }
            }, 0);
        }
    }

    define.amd      = { bestest: { debug: false } };
    exports.define  = define;
    exports.require = function require(deps, resolve, reject) {
        return requireHelper(deps, resolve, reject, "", { require: exports.require });
    };
}));
