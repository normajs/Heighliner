
###

  The navigator class provides the tailing

###
time = 0
count = 0
originalCount = 0
class Navigator

  constructor: (heighliner) ->
    if not heighliner
      throw new Meteor.Error("Heighliner is required")
      return

    self = @
    self.name = heighliner.ship()
    self.heighliner = heighliner
    self.ids = []


    if self.heighliner.isMaster
      self.loadPassengers(heighliner.fleet())


    else

      heighliner.balance ->
        self.watchShip(heighliner.fleet())


  loadPassengers: (name) ->

    self = @
    query = Heighliner.flightplans.find({
      heighliner: name
    })

    added = ->
      args = _.values(arguments)
      self.added.apply self, args


    self.heighliner.workersReady ->
      workers = self.heighliner.workers()

      for doc in self.ids
        worker = Random.choice workers
        # workerName = 
        Heighliner.flightplans.update(doc, {
          $set:
            worker: self.workerPlusShip(worker)
          })



    self.initalized = false
    query.observeChanges({
      added: added
    })
    self.initalized = true

  workerPlusShip: (worker) ->
    self = @

    if worker
      return "#{self.heighliner.ship()}-#{worker.name}"
    else
      return "#{self.heighliner.ship()}-#{process.pid}"

  watchShip: (name) ->

    self = @

    self.heighliner.workerReady ->


      query = Heighliner.flightplans.find({
        heighliner: name
        worker: self.workerPlusShip()
      })

      added = ->
        args = _.values(arguments)
        self.workerAdded.apply self, args

      changed = ->
        args = _.values(arguments)
        self.changed.apply self, args

      removed = ->
        args = _.values(arguments)
        self.removed.apply self, args


      query.observeChanges({
        added: added
        changed: changed
      })

      query.observe({
        removed: removed
      })


  storeIds: (id) ->
    self = @
    self.ids.push id


  workerAdded: (id, fields) ->

    if not fields.observed
      Heighliner.flightplans.update(id, {
        $set:
          observed: true
        })

      return

    if fields.observed and fields.complete
      Heighliner.flightplans.remove id


  added: (id, fields) ->
    self = @

    # app is first time starting up. We push all ids
    # of needed fligtplans to an array and once a worker
    # comes online, they get to start chewing away at them
    if not self.initalized and not fields.observed
      self.storeIds id
      return

    # if not fields.observed
    #
    #   workers = self.heighliner.getWorkers()
    #   console.log workers
      # singular thread the action
      # if fields.worker
      #   return
    #
    #   Heighliner.flightplans.update(fields._id, {
    #     $set:
    #       observed: true
    #       worker: self.worker
    #     })
    #
    #   return
    #
    # # singular thread the action
    # if fields.worker and fields.worker isnt self.worker
    #   return
    #
    #
    # if fields.observed and fields.complete
    #   Heighliner.flightplans.remove fields._id


  changed: (id, fields) ->
    console.log id, fields
    # action is doc being observed
    if fields.observed is true

      # fake action
      Heighliner.flightplans.update(id, {
        $set:
          complete: true
        })

      return

    # action is doc being complete
    if fields.complete is true
      Heighliner.flightplans.remove id
      return


  removed: (fields) ->
    self = @
    if fields?.worker is self.workerPlusShip()
      console.log fields._id



Heighliner.navigator = Navigator
