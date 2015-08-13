var FlightPlan;

FlightPlan = (function () {
    function FlightPlan(plan) {
        var self;
        if (!plan) {
            throw new Meteor.Error("No plan specified");
            return;
        }
        if (!plan.heighliner) {
            throw new Meteor.Error("No heighliner for plan specified");
            return;
        }
        self = this;
        self.plan = plan;
        self.collection = Heighliner.flightplans;
        self.landedCallbacks = [];
        self.sendPlan(plan);
    }

    FlightPlan.prototype.sendPlan = function (plan) {
        var currentPlane, flightPlanDoc, self;
        self = this;
        if (plan.name) {
            currentPlane = self.collection.findOne({
                heighliner: plan.heighliner,
                name: plan.name
            });
            if (currentPlane && !currentPlane.complete) {
                flightPlanDoc = currentPlane._id;
                self.id = flightPlanDoc;
                self.trackPlan(flightPlanDoc);
                return;
            }
        }
        return self.collection.insert(plan, function (err, id) {
            return self.trackPlan(id);
        });
    };

    FlightPlan.prototype.trackPlan = function (id) {
        var land, query, self;
        self = this;
        land = function () {
            var args;
            args = _.values(arguments);
            return self.land.apply(self, args);
        };
        query = self.collection.find(id);
        return self.handle = query.observe({
            changed: land
        });
    };

    FlightPlan.prototype.removePlan = function (id) {
        var self;
        self = this;
        self.collection.remove(id, function (err, count) {
            if (err) {
                throw new Meteor.Error(err);
            }
        });
        return self.handle.stop();
    };

    FlightPlan.prototype.land = function (newDoc, oldDoc) {
        var cb, i, ref, self;
        self = this;
        if (!newDoc.complete) {
            return;
        }
        if (!self.landedCallbacks.length) {
            self.removePlan(newDoc._id);
            return;
        }
        ref = self.landedCallbacks;
        for (i = ref.length - 1; i >= 0; i += -1) {
            cb = ref[i];
            cb.call(self, newDoc._id, newDoc.manifest);
        }
        return self.removePlan(newDoc._id);
    };

    FlightPlan.prototype.landed = function (cb) {
        return this.landedCallbacks.push(cb);
    };

    return FlightPlan;

})();

Heighliner.flightplan = FlightPlan;