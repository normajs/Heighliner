var _heighliner, cluster;

if (Meteor.isServer) {
    cluster = Npm.require("cluster");
    _heighliner = (function () {
        function _heighliner(name) {
            var self;
            if (!name) {
                throw new Meteor.Error("Heighliner must have a name");
            }
            self = this;
            self.name = name;
            self.workersOnlineCallbacks = [];
            self.workerOnlineCallbacks = [];
            self.cluster = new Heighliner._cluster({
                count: 2
            });
            if (cluster.isMaster) {
                self.createShip(name);
            }
            if (cluster.isWorker) {
                self.getOrders();
            }
            self.loadNavigator();
        }


/*
    
      Utilties
     */

        _heighliner.prototype.isMaster = cluster.isMaster;

        _heighliner.prototype.isWorker = cluster.isWorker;

        _heighliner.prototype.ship = function () {
            return this.id;
        };

        _heighliner.prototype.fleet = function () {
            return this.name;
        };

        _heighliner.prototype.log = function () {
            var args, self;
            args = _.values(arguments);
            self = this;
            return self.cluster.log.apply(self.cluster, args);
        };

        _heighliner.prototype.loadNavigator = function () {
            var self;
            self = this;
            return self.navigator = new Heighliner.navigator(self);
        };


/*
    
      Master
     */

        _heighliner.prototype.createShip = function (name) {
            var bays, self, ship, shipName;
            if (!this.isMaster) {
                return;
            }
            self = this;

/*
      
        Ships can come and go. We first look to see if any
        ships are offline and we activate their spot in their
        fleet with this ship.
       */
            ship = Heighliner.ships.findOne({
                fleet: name,
                online: false
            });
            bays = [];
            shipName = Random.id();
            if (ship) {
                self.id = ship._id;
                Heighliner.ships.update(ship._id, {
                    $set: {
                        online: true,
                        name: shipName,
                        workers: bays
                    }
                });
                self.bindStatusReport(self.id);
                return;
            }
            ship = Heighliner.ships.insert({
                fleet: name,
                name: shipName,
                online: true,
                workers: bays
            });
            self.id = ship;
            return self.bindStatusReport(self.id);
        };

        _heighliner.prototype.bindStatusReport = function (id) {
            var mayday;
            if (!id) {
                return;
            }
            mayday = function () {
                Heighliner.ships.update(id, {
                    $set: {
                        online: false
                    }
                });
                return process.exit();
            };

/*
      
        This acts as our 1st line of health check. If a ship is going offline
        it logs a mayday and sets its status to offline. May it rest in
        peace in that shipyard in the sky
       */
            process.on("SIGTERM", Meteor.bindEnvironment(mayday));
            return process.on("SIGINT", Meteor.bindEnvironment(mayday));
        };

        _heighliner.prototype.sendOrders = function (order) {
            var id, ref, self, worker;
            self = this;
            ref = cluster.workers;
            for (id in ref) {
                worker = ref[id];
                worker.send(order);
            }
        };

        _heighliner.prototype.startup = function (cb) {
            var self;
            self = this;
            return self.cluster.startupMaster(cb);
        };

        _heighliner.prototype.start = function () {
            var bindWorker, query, self;
            self = this;
            if (self.cluster.online) {
                return;
            }
            bindWorker = function (worker) {
                return worker.on("message", function (msg) {
                    if (msg != null ? msg.online : void 0) {
                        return worker.send({
                            ship: self.id,
                            worker: msg.id
                        });
                    }
                });
            };
            self.startup(function () {
                var id, ref, results, worker;
                ref = cluster.workers;
                results = [];
                for (id in ref) {
                    worker = ref[id];
                    results.push(bindWorker(worker));
                }
                return results;
            });
            query = Heighliner.ships.find(self.id);
            query.observeChanges({
                changed: function (id, fields) {
                    var cb, i, ref, ref1, results;
                    if (((ref = fields.workers) != null ? ref.length : void 0) === self.cluster.count()) {
                        ref1 = self.workersOnlineCallbacks;
                        results = [];
                        for (i = ref1.length - 1; i >= 0; i += -1) {
                            cb = ref1[i];
                            results.push(cb.call(self));
                        }
                        return results;
                    }
                }
            });
            return self.cluster.startup();
        };

        _heighliner.prototype.workers = function () {
            var self, ship;
            if (!this.isMaster) {
                return;
            }
            self = this;
            ship = Heighliner.ships.findOne(self.id);
            if (ship.workers.length) {
                return ship.workers;
            } else {
                return [];
            }
        };

        _heighliner.prototype.workersReady = function (callback) {
            var self;
            self = this;
            return self.workersOnlineCallbacks.push(callback);
        };


/*
    
      Workers
     */

        _heighliner.prototype.workerReady = function (callback) {
            var self;
            self = this;
            return self.workerOnlineCallbacks.push(callback);
        };

        _heighliner.prototype.comeOnline = function (ship) {
            var cb, i, ref, results, self;
            self = this;
            ship = Heighliner.ships.findOne(ship);
            self.id = ship._id;
            Heighliner.ships.update({
                _id: ship._id
            }, {
                $addToSet: {
                    workers: {
                        name: process.pid,
                        online: true
                    }
                }
            });
            ref = self.workerOnlineCallbacks;
            results = [];
            for (i = ref.length - 1; i >= 0; i += -1) {
                cb = ref[i];
                results.push(cb.call(self));
            }
            return results;
        };

        _heighliner.prototype.getOrders = function () {
            var self;
            if (!this.isWorker) {
                return;
            }
            self = this;

/*
      
        When a worker comes online they let the heighliner
        know that it is ready. The heighliner then tells the
        worker what ship it is on and the worker adds itself
        to the heighliner's worker list
       */
            process.send({
                online: true,
                id: process.pid
            });
            return process.on("message", Meteor.bindEnvironment(function (msg) {
                if (msg.ship && msg.worker === process.pid) {
                    return self.comeOnline(msg.ship);
                }
            }));
        };

        _heighliner.prototype.balance = function (cb) {
            var self;
            self = this;
            return self.cluster.startupWorker(cb);
        };

        return _heighliner;

    })();

    Heighliner = _heighliner;
}