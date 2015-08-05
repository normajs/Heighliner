var planSchema;

Heighliner.flightplans = new Mongo.Collection("heighliner-flightplans");

planSchema = new SimpleSchema({
    heighliner: {
        type: String,
        optional: false
    },
    manifest: {
        type: Object,
        optional: false,
        blackbox: true,
        defaultValue: {}
    },
    observed: {
        type: Boolean,
        defaultValue: false
    },
    complete: {
        type: Boolean,
        defaultValue: false
    },
    worker: {
        type: String,
        optional: true
    },
    name: {
        type: String,
        optional: true
    }
});

Heighliner.flightplans._ensureIndex({
    heighliner: "text"
});

Heighliner.flightplans.attachSchema(planSchema);