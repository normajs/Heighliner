var FlightPlan;

FlightPlan = (function () {
    function FlightPlan(plan) {
        var self;
        if (!plan) {
            throw new Meteor.Error("No plan specified");
            return;
        }
        self = this;
        self.plan = plan;
        self.sendPlan();
    }

    FlightPlan.prototype.sendPlan = function () {
        return Flightplans.insert(self.plan);
    };

    FlightPlan.prototype.landed = function (cb) {
        if (typeof cb !== "function") {
            throw new Meteor.Error("No callback function specified");
        }
    };

    return FlightPlan;

})();

Heighliner.flightplan = FlightPlan;