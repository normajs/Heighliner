

if Meteor.isServer

  cluster = Npm.require("cluster")

  class _heighliner

    constructor: (name) ->

      if not name
        throw new Meteor.Error("Heighliner must have a name")

      self = @
      self.name = name

      # master
      self.workersOnlineCallbacks = []
      self.clusterOnline = false

      # workers
      self.workerOnlineCallbacks = []
      self.manifestActions = []
      self.workerOnline = false

      # utility
      self.cluster = new Heighliner._cluster()
      self.plans = Heighliner.flightplans

      if cluster.isMaster
        # create a new ship
        self.createShip(name)

      if cluster.isWorker
        self.getOrders()


      # load the navigator on board the ship to monitor the logs
      self.loadNavigator()
    ###

      Utilties

    ###
    isMaster: cluster.isMaster
    isWorker: cluster.isWorker

    ship: -> return @.id
    fleet: -> return @.name
    log: ->
      args = _.values(arguments)
      self = @
      self.cluster.log.apply self.cluster, args

    loadNavigator: ->

      self = @
      self.navigator = new Heighliner.navigator(self)



    ###

      Master

    ###
    createShip: (name) ->

      # We only want the main application code registering as a heighliner
      if not @.isMaster
        return

      self = @

      ###

        Ships can come and go. We first look to see if any
        ships are offline and we activate their spot in their
        fleet with this ship.

      ###
      ship = Heighliner.ships.findOne({
        fleet: name
        online: false
      })


      # the number of cores on this instance will inform how
      # many bays of cargo this ship can carry
      # each bay (worker) will get a new id once the worker starts
      # we wipe each ships workers on creation
      bays = []


      # ships are disposable so lets give this one a new name
      shipName = Random.id()


      # we have a ship in the docks ready for flightplans
      # lets assume the identity, wipe its workers, and bring
      # it online
      if ship

        # store a reference to this ship on the master class
        self.id = ship._id


        # launch the ship into service, may she serve proudly
        Heighliner.ships.update(ship._id, {
          $set:
            online: true
            name: shipName
            workers: bays
        })
        self.bindStatusReport self.id
        return

      # looks like the fleet is all engaged, lets christen a
      # new ship for flight
      ship = Heighliner.ships.insert({
        fleet: name
        name: shipName
        online: true
        workers: bays
      })

      self.id = ship
      self.bindStatusReport self.id

    bindStatusReport: (id) ->

      if not id then return

      mayday = ->
        Heighliner.ships.update(id, {
          $set:
            online: false
        })

        process.exit()


      ###

        This acts as our 1st line of health check. If a ship is going offline
        it logs a mayday and sets its status to offline. May it rest in
        peace in that shipyard in the sky

      ###
      process.on "SIGTERM", Meteor.bindEnvironment(mayday)
      process.on "SIGINT", Meteor.bindEnvironment(mayday)

    sendOrders: (order) ->

      self = @
      for id, worker of cluster.workers
        worker.send order

      return

    startup: (cb) ->
      self = @
      self.cluster.startupMaster cb

    start: ->

      self = @

      Meteor.startup ->

        if self.cluster.online
          return

        # async protection
        bindWorker = (worker) ->
          worker.on("message", (msg) ->
            if msg?.online
              worker.send({
                ship: self.id
                worker: msg.id
              })
          )


        # prior to the ship taking flight, we need to bind the workers
        # to pick a thread and come online
        self.startup ->

          for id, worker of cluster.workers
            bindWorker worker


        # we bind a reactive watch on the ship to
        # execute callbacks once all workers are attached
        query = Heighliner.ships.find(self.id)

        query.observeChanges({
          changed: (id, fields) ->

            if fields?.workers?.length is self.cluster.count()
              self.clusterOnline = true
              for cb in self.workersOnlineCallbacks by -1
                cb.call self

        })
        self.cluster.startup()


    workers: ->
      if not @.isMaster
        return

      self = @
      ship = Heighliner.ships.findOne(self.id)

      if ship.workers.length
        return ship.workers
      else
        return []

    workersReady: (callback) ->

      self = @

      self.workersOnlineCallbacks.push callback



    ###

      Workers

    ###

    workerReady: (callback) ->

      self = @

      if self.workerOnline
        callback null
      else
        self.workerOnlineCallbacks.push callback



    comeOnline: (ship) ->
      self = @
      ship = Heighliner.ships.findOne(ship)
      self.id = ship._id
      self.workerOnline = true

      Heighliner.ships.update({
        _id: ship._id
      }, {
        $addToSet:
          workers:
            name: process.pid
            online: true
      })

      for cb in self.workerOnlineCallbacks by -1
        cb.call self


    getOrders: ->
      if not @.isWorker
        return

      self = @

      ###

        When a worker comes online they let the heighliner
        know that it is ready. The heighliner then tells the
        worker what ship it is on and the worker adds itself
        to the heighliner's worker list

      ###
      process.send({
        online: true
        id: process.pid
      })

      # add to heighliner worker list
      process.on("message", Meteor.bindEnvironment( (msg) ->

        if msg.ship and msg.worker is process.pid
          self.comeOnline msg.ship

      ))

    balance: (cb) ->

      self = @
      self.cluster.startupWorker cb

    process: (cb) ->
      self = @

      if self.isMaster
        return

      self.manifestActions.push cb

      
  `
  Heighliner = _heighliner
  `
