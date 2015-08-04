

class Vessel

  constructor: (name) ->

    if not name
      throw new Meteor.Error("Heighliner must have a name")

    self = @
    self.name = name

    self.cluster = new Heighliner._cluster({count: 1})

    self.cluster.startupMaster ->
      self.createShip(name)
      self.loadNavigator()


  ship: -> return @.name

  createShip: (name) ->

    self = @
    ship = Heighliner.ships.upsert({name: name}, {
      $set:
        name: name
    })

    self.id = ship


  loadNavigator: ->

    self = @
    self.navigator = new Heighliner.navigator(self)

  startup: (cb) ->
    self = @
    self.cluster.startupMaster cb

  balance: (cb) ->

    self = @
    self.cluster.startupWorker cb

  start: ->

    self = @
    self.cluster.startup()

Heighliner.vessel = Vessel
