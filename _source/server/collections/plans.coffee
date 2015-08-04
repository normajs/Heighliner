

Heighliner.flightplans = new Mongo.Collection("heighliner-flightplans")

planSchema = new SimpleSchema({
  heighliner:
    type: String
    optional: false
  manifest:
    type: Object
    optional: false
    blackbox: true
  complete:
    type: Boolean
    defaultValue: false
  observed:
    type: Boolean
    defaultValue: false
  worker:
    type: String
    optional: true
})

Heighliner.flightplans._ensureIndex(heighliner: "text")
Heighliner.flightplans.attachSchema planSchema
