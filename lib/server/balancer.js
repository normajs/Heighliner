var Cluster, cluster, cores;

cluster = Npm.require("cluster");

cores = Npm.require("os").cpus().length;

Cluster = (function () {
    function Cluster(settings) {
        var self;
        self = this;
        self.settings = _.defaults(settings || {}, {
            disable: false,
            count: cores
        });
        self.masterCallbacks = [];
        self.workerCallbacks = [];
        self.isMaster = cluster.isMaster;
        self.isWorker = cluster.isWorker;
    }

    Cluster.prototype.count = function () {
        return this.settings.count;
    };

    Cluster.prototype.startupMaster = function (fn) {
        return this.masterCallbacks.push(fn);
    };

    Cluster.prototype.startupWorker = function (fn) {
        return this.workerCallbacks.push(fn);
    };

    Cluster.prototype.runCallbacks = function (callbacks) {
        var cb, i, results;
        results = [];
        for (i = callbacks.length - 1; i >= 0; i += -1) {
            cb = callbacks[i];
            results.push(cb.call(this));
        }
        return results;
    };

    Cluster.prototype.startup = function () {
        var self;
        self = this;
        if (self.settings.disable) {
            return;
        }
        if (self.isMaster) {
            self.start();
            self.runCallbacks(self.masterCallbacks);
            return;
        }
        return self.runCallbacks(self.workerCallbacks);
    };

    Cluster.prototype.start = function () {
        var length, self, worker;
        self = this;
        if (Object.keys(cluster.workers).length === 0) {
            length = self.settings.count;
            while (length > 0) {
                worker = cluster.fork({
                    PORT: 0,
                    VELOCITY: 0
                });
                worker.on("exit", function () {
                    return self.log("Worker proccess killed");
                });
                length--;
            }
            self.online = true;
            return;
        }
        self.online = true;
        return self.log("Workers have already been started");
    };

    Cluster.prototype.stop = function () {
        var i, len, ref, results, worker;
        ref = cluster.workers;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
            worker = ref[i];
            results.push(worker.kill());
        }
        return results;
    };

    Cluster.prototype.log = function () {
        var args;
        args = _.values(arguments);
        if (cluster.isMaster) {
            args.unshift("MASTER:");
        } else {
            args.unshift("PID " + process.pid + ":");
        }
        return console.log.apply(this, args);
    };

    return Cluster;

})();

Heighliner._cluster = Cluster;