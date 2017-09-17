(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports'], factory);
    }
    else if (typeof module === "object" && module.exports) {
        factory(module.exports);
    }
    else {
        factory(root);
    }
}(this, function (exports) {
    var entries        = {};
    var initQueue      = [];
    var onReadyQueue   = [];
    var unnamedCounter = 0;

    function moduleName() {
        var base   = typeof document !== "undefined" && document.location      && document.location.href;
        var script = typeof document !== "undefined" && document.currentScript && document.currentScript.src;

        if (typeof script !== "string") {
            script = document.getElementsByTagName("script");
            script = script[script.length - 1].src;
        }

        var baseDir = base.replace(/[^/]+$/, "");
        var module;

        if (script.indexOf(baseDir) === 0) {
            module = script.substr(baseDir.length);
        }
        else {
            module = script.replace(/.*\//, "");
        }

        module = module.replace(/\.[^.]*$/, "");

        if (define.amd.divine.debug) {
            console.debug("Module name '" + module + "' calculated from base '" + base + "', script '" + script + "'.");
        }

        return module;
    }

    function absolutePath(base, path) {
        if (path.charAt(0) !== ".") {
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

        if (define.amd.divine.debug) {
            console.debug("Module name '" + module + "' calculated from base '" + base + "', path '" + path + "'.");
        }

        return module;
    }

    function invoke(async, fn) {
        if (!async) {
            fn();
        }
        else if (typeof Promise === "function") {
            new Promise(function(resolve) { resolve(); }).then(fn);
        }
        else if (typeof setImmediate === "function") {
            setImmediate(fn);
        }
        else {
            setTimeout(fn, 0);
        }
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
            id = "[anonymous-" + ++unnamedCounter + "]";

            if (define.amd.divine.debug) {
                console.warn("Defining unnamed module '" + id + "'.");
            }
        }
        else {
            if (define.amd.divine.debug) {
                console.debug("Defining module '" + id + "'.");
            }
        }

        deps = deps.map(function(dep) {
            return absolutePath(id, dep.toString());
        });

        if (entries[id]) {
            console.error(new Error("Module '" + id + "' already defined."));
            return;
        }

        var entry = entries[id] = {
            module:       { id: id, exports: undefined },
            factory:      factory,
            dependencies: deps
        };

        if (typeof factory !== "function") {
            entry.module.exports = factory;
        }
        else {
            initQueue.push(entry);

            if (initQueue.length === 1) {
                invoke(true, initModules);
            }
        }
    }

    function initModules() {
        // Initialize all modules
        for (var entry = initQueue.shift(); entry; entry = initQueue.shift()) {
            initModule(entry.module.id);
        }

        // Invoke registered onReady callbacks when all pending modules have been initialized
        for (var callback = onReadyQueue.shift(); callback; callback = onReadyQueue.shift()) {
            try { callback() } catch (ex) { console.error(ex) }
        }
    }

    function initModule(id) {
        var entry = entries[id];

        if (entry && typeof entry.module.exports === "undefined") {
            // Mark as initialized/initializing
            entry.module.exports = {};

            // Make sure dependencies are initialized first
            entry.dependencies.forEach(initModule);

            var builtins = {
                require: function require(deps, resolve, reject) {
                    return requireHelper(deps, resolve, reject, entry.module.id, true, builtins);
                },
                exports: entry.module.exports,
                module: entry.module
            };

            // Resolve dependencies and initialize module
            requireHelper(entry.dependencies, function() {
                if (define.amd.divine.debug) {
                    console.debug("Initializing module '" + id + "'.");
                }

                var exports = entry.factory.apply(null, arguments);

                if (exports) {
                    // Keep references to circular dependencies at least somewhat valid by pointing
                    // the prototype chain of the original empty exports to the new object.
                    entry.module.exports.__proto__ = exports;
                    entry.module.exports = exports;

                    if (define.amd.divine.debug) {
                        console.warn("Module '" + id + "' did not use the 'exports' dependency, which is required for full circular dependency support.");
                    }
                }

                // Drop references no longer required
                entry.factory      = null;
                entry.dependencies = null;
            }, undefined, entry.module.id, false, builtins);
        }
    }

    function onReady(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("onReady() argument must be a function");
        }

        if (initQueue.length == 0) {
            invoke(true, callback);
        }
        else {
            onReadyQueue.push(callback);
        }
    }

    function requireHelper(deps, resolve, reject, id, async, builtins) {
        if (typeof deps === "string" && !resolve && !reject) {
            deps = absolutePath(id, deps);

            if (builtins[deps]) {
                return builtins[deps];
            }
            else if (entries[deps]) {
                return entries[deps].module.exports;
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
            invoke(async, function() {
                try {
                    resolve.apply(null, (deps.map(function(dep) { return requireHelper(dep.toString(), null, null, id, false, builtins); })));
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

    define.amd = {
        divine: {
            debug:   false,
            onReady: onReady
        }
    };

    exports.define  = define;
    exports.require = function require(deps, resolve, reject) {
        return requireHelper(deps, resolve, reject, "", true, { require: exports.require });
    };
}));
