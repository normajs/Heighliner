
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


  loadBalence: (id) ->

    self = @
    workers = self.heighliner.workers()

    if id
      ids = [id]
    else
      ids = self.ids

    for doc in ids
      worker = Random.choice workers
      Heighliner.flightplans.update(doc, {
        $set:
          worker: self.workerPlusShip(worker)
        },
        (err, count) ->
          # async the update
          if err then throw new Meteor.error err
      )


  loadPassengers: (name) ->

    self = @

    query = Heighliner.flightplans.find({
      heighliner: name
    })

    added = ->
      args = _.values(arguments)
      self.added.apply self, args


    self.heighliner.workersReady ->
      self.loadBalence()


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


      query.observeChanges({
        added: added
        changed: changed
      })


  storeIds: (id) ->
    self = @
    self.ids.push id


  workerAdded: (id, fields) ->

    if not fields.observed
      Heighliner.flightplans.update(id, {
        $set:
          observed: true
        },
        (err, count) ->
          # async the update
          if err then throw new Meteor.error err
      )

      return




  added: (id, fields) ->
    self = @

    # app is first time starting up. We push all ids
    # of needed fligtplans to an array and once a worker
    # comes online, they get to start chewing away at them
    if not self.heighliner.clusterOnline and not fields.observed
      self.storeIds id
      return


    if not fields.observed
      self.loadBalence(id)
      return



  changed: (id, fields) ->

    self = @
    # action is doc being observed
    if fields.observed is true

      manifest = Heighliner.flightplans.findOne(id, {
        fields:
          manifest: true
      })

      manifest or= {}
      manifest = manifest.manifest

      actions = self.heighliner.manifestActions

      land = (err, result) ->

        Heighliner.flightplans.update(id, {
          $set:
            complete: true
        }, (err, count) ->
          # async the update
          if err then throw new Meteor.error err
        )

        return

      if actions.length

        for cb in actions by -1
          cb.call self.heighliner, id, manifest, land

      else
        land null




Heighliner.navigator = Navigator
