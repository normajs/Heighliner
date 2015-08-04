var shipSchema, workers;

Heighliner.ships = new Mongo.Collection("heighliners");

workers = new SimpleSchema({
    name: {
        type: String,
        optional: false
    },
    online: {
        type: Boolean,
        defaultValue: false
    }
});

shipSchema = new SimpleSchema({
    name: {
        type: String,
        optional: false
    },
    fleet: {
        type: String,
        optional: false
    },
    workers: {
        type: [workers],
        optional: true
    },
    online: {
        type: Boolean,
        defaultValue: false
    }
});

Heighliner.ships.attachSchema(shipSchema);