

class Armada

  constructor: ->

    self = @

    self.collection = Heighliner.ships


  statusReport: (fleet, cb) ->

    if not cb then cb = ->

    self = @
    fleet = self.collection.find({fleet: fleet}).fetch()

    if not fleet.length
      cb([])
      return


    for ship, index in fleet by -1
      console.log ship
      alive = self.hail(ship)

      if alive
        continue

      fleet.slice(index, 1)


    cb fleet



  hail: (ship, cb) ->

    self = @

    cb or= -> return

    if not ship
      cb false
      return


    if not ship.endpoint
      self.collection.remove(ship._id, (err, count) ->
        if err
          throw new Meteor.Error err
      )

      cb false
      return

    try
      alive = HTTP.get(ship.endpoint)
    catch e
      self.collection.remove(ship._id, (err, count) ->
        if err
          throw new Meteor.Error err
      )
      cb false
      return

    if alive.statusCode is 200
      cb true
      return


    self.collection.remove(ship._id, (err, count) ->
      if err
        throw new Meteor.Error err
    )
    cb false




  hashEndpoint: ->
    return process.env.ROOT_URL


  watchFleet: (fleet) ->

    self = @


    getReport = ->
      ships = self.collection.find({fleet: fleet}).fetch()
      for ship in ships

        self.hail ship

    Meteor.setInterval(getReport, 5000)



  enlist: (fleet, cb) ->

    self = @

    # remove previous ship instances of this app
    oldShips = self.collection.find({endpoint: self.hashEndpoint()}).fetch()

    # sync clean up before we get going
    for ship in oldShips
      self.collection.remove(ship._id)


    # make sure all ships are still reporting
    self.statusReport(fleet, (ships) ->

      # ships are disposable so lets give this one a new name
      shipName = Random.id()

      # the number of cores on this instance will inform how
      # many bays of cargo this ship can carry
      # each bay (worker) will get a new id once the worker starts
      bays = []

      # add a new ship sync so we can get the id
      self.collection.insert({
        fleet: fleet
        name: shipName
        online: true
        workers: bays
        endpoint: self.hashEndpoint()
      }, (err, id) ->

        console.log err, id, process.env.MONGO_URL

        if err
          throw new Meteor.Error err

        if not cb
          return

        self.watchFleet(fleet)

        cb id

      )


    )

Heighliner.armada = new Armada()
