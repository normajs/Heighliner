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
            var doc, i, len, ref, results, worker, workers;
            workers = self.heighliner.workers();
            ref = self.ids;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
                doc = ref[i];
                worker = Random.choice(workers);
                results.push(Heighliner.flightplans.update(doc, {
                    $set: {
                        worker: self.workerPlusShip(worker)
                    }
                }));
            }
            return results;
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
            var added, changed, query, removed;
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
            removed = function () {
                var args;
                args = _.values(arguments);
                return self.removed.apply(self, args);
            };
            query.observeChanges({
                added: added,
                changed: changed
            });
            return query.observe({
                removed: removed
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
            });
            return;
        }
        if (fields.observed && fields.complete) {
            return Heighliner.flightplans.remove(id);
        }
    };

    Navigator.prototype.added = function (id, fields) {
        var self;
        self = this;
        if (!self.initalized && !fields.observed) {
            self.storeIds(id);
        }
    };

    Navigator.prototype.changed = function (id, fields) {
        console.log(id, fields);
        if (fields.observed === true) {
            Heighliner.flightplans.update(id, {
                $set: {
                    complete: true
                }
            });
            return;
        }
        if (fields.complete === true) {
            Heighliner.flightplans.remove(id);
        }
    };

    Navigator.prototype.removed = function (fields) {
        var self;
        self = this;
        if ((fields != null ? fields.worker : void 0) === self.workerPlusShip()) {
            return console.log(fields._id);
        }
    };

    return Navigator;

})();

Heighliner.navigator = Navigator;