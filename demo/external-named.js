define('external/named', ['../path/to/amd2', 'exports'], function(amd2, exports) {
    console.log('Inside named external; imported amd2: ' + amd2.name);
    exports.name = 'External Named';
});
