/*

  The navigator class provides the tailing
 */
var Navigator, count, originalCount, time;

time = 0;

count = 0;

originalCount = 0;

Navigator = (function () {
    function Navigator(heighliner) {
        var self;
        if (!heighliner) {
            throw new Meteor.Error("Heighliner is required");
            return;
        }
        self = this;
        self.name = heighliner.ship();
        self.heighliner = heighliner;
        self.ids = [];
        if (self.heighliner.isMaster) {
            self.loadPassengers(heighliner.fleet());
        } else {
            heighliner.balance(function () {
                return self.watchShip(heighliner.fleet());
            });
        }
    }

    Navigator.prototype.loadBalence = function (id) {
        var doc, i, ids, len, results, self, worker, workers;
        self = this;
        workers = self.heighliner.workers();
        if (id) {
            ids = [id];
        } else {
            ids = self.ids;
        }
        results = [];
        for (i = 0, len = ids.length; i < len; i++) {
            doc = ids[i];
            worker = Random.choice(workers);
            results.push(Heighliner.flightplans.update(doc, {
                $set: {
                    worker: self.workerPlusShip(worker)
                }
            }, function (err, count) {
                if (err) {
                    throw new Meteor.error(err);
                }
            }));
        }
        return results;
    };

    Navigator.prototype.loadPassengers = function (name) {
        var added, query, self;
        self = this;
        query = Heighliner.flightplans.find({
            heighliner: name
        });
        added = function () {
            var args;
            args = _.values(arguments);
            return self.added.apply(self, args);
        };
        self.heighliner.workersReady(function () {
            return self.loadBalence();
        });
        self.initalized = false;
        query.observeChanges({
            added: added
        });
        return self.initalized = true;
    };

    Navigator.prototype.workerPlusShip = function (worker) {
        var self;
        self = this;
        if (worker) {
            return (self.heighliner.ship()) + "-" + worker.name;
        } else {
            return (self.heighliner.ship()) + "-" + process.pid;
        }
    };

    Navigator.prototype.watchShip = function (name) {
        var self;
        self = this;
        return self.heighliner.workerReady(function () {
            var added, changed, query;
            query = Heighliner.flightplans.find({
                heighliner: name,
                worker: self.workerPlusShip()
            });
            added = function () {
                var args;
                args = _.values(arguments);
                return self.workerAdded.apply(self, args);
            };
            changed = function () {
                var args;
                args = _.values(arguments);
                return self.changed.apply(self, args);
            };
            return query.observeChanges({
                added: added,
                changed: changed
            });
        });
    };

    Navigator.prototype.storeIds = function (id) {
        var self;
        self = this;
        return self.ids.push(id);
    };

    Navigator.prototype.workerAdded = function (id, fields) {
        if (!fields.observed) {
            Heighliner.flightplans.update(id, {
                $set: {
                    observed: true
                }
            }, function (err, count) {
                if (err) {
                    throw new Meteor.error(err);
                }
            });
        }
    };

    Navigator.prototype.added = function (id, fields) {
        var self;
        self = this;
        if (!self.heighliner.clusterOnline && !fields.observed) {
            self.storeIds(id);
            return;
        }
        if (!fields.observed) {
            self.loadBalence(id);
        }
    };

    Navigator.prototype.changed = function (id, fields) {
        var actions, cb, i, land, manifest, results, self;
        self = this;
        if (fields.observed === true) {
            manifest = Heighliner.flightplans.findOne(id, {
                fields: {
                    manifest: true
                }
            });
            manifest || (manifest = {});
            manifest = manifest.manifest;
            actions = self.heighliner.manifestActions;
            land = function (err, result) {
                Heighliner.flightplans.update(id, {
                    $set: {
                        complete: true
                    }
                }, function (err, count) {
                    if (err) {
                        throw new Meteor.error(err);
                    }
                });
            };
            if (actions.length) {
                results = [];
                for (i = actions.length - 1; i >= 0; i += -1) {
                    cb = actions[i];
                    results.push(cb.call(self.heighliner, id, manifest, land));
                }
                return results;
            } else {
                return land(null);
            }
        }
    };

    return Navigator;

})();

Heighliner.navigator = Navigator;