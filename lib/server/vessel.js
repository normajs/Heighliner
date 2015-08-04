var Vessel;

Vessel = (function () {
    function Vessel(name) {
        var self;
        if (!name) {
            throw new Meteor.Error("Heighliner must have a name");
        }
        self = this;
        self.name = name;
        self.cluster = new Heighliner._cluster({
            count: 1
        });
        self.cluster.startupMaster(function () {
            self.createShip(name);
            return self.loadNavigator();
        });
    }

    Vessel.prototype.ship = function () {
        return this.name;
    };

    Vessel.prototype.createShip = function (name) {
        var self, ship;
        self = this;
        ship = Heighliner.ships.upsert({
            name: name
        }, {
            $set: {
                name: name
            }
        });
        return self.id = ship;
    };

    Vessel.prototype.loadNavigator = function () {
        var self;
        self = this;
        return self.navigator = new Heighliner.navigator(self);
    };

    Vessel.prototype.startup = function (cb) {
        var self;
        self = this;
        return self.cluster.startupMaster(cb);
    };

    Vessel.prototype.balance = function (cb) {
        var self;
        self = this;
        return self.cluster.startupWorker(cb);
    };

    Vessel.prototype.start = function () {
        var self;
        self = this;
        return self.cluster.startup();
    };

    return Vessel;

})();

Heighliner.vessel = Vessel;