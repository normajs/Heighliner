cluster = Npm.require("cluster")
cores = Npm.require("os").cpus().length

class Cluster

  constructor: (settings) ->

    self = @

    self.settings = _.defaults(settings or {}, {
      disable: false
      count: cores
    })

    self.masterCallbacks = []
    self.workerCallbacks = []
    self.isMaster = cluster.isMaster
    self.isWorker = cluster.isWorker

  count: ->
    return @.settings.count

  startupMaster: (fn) ->
    @.masterCallbacks.push fn

  startupWorker: (fn) ->
    @.workerCallbacks.push fn

  runCallbacks: (callbacks) ->

    for cb in callbacks by -1
      cb.call @

  startup: ->

    self = @

    if self.settings.disable
      return

    if self.isMaster
      self.start()
      self.runCallbacks(self.masterCallbacks)
      return

    self.runCallbacks(self.workerCallbacks)


  start: ->

    self = @
    if Object.keys(cluster.workers).length is 0

      length = self.settings.count
      while length > 0
        worker = cluster.fork({PORT: 0, VELOCITY: 0})
        worker.on("exit", ->
          self.log("Worker proccess killed")
        )
        length--

      self.online = true
      return

    self.online = true
    self.log("Workers have already been started")

  stop: ->
    for worker in cluster.workers
      worker.kill()

  log: ->
    args = _.values(arguments)
    if cluster.isMaster
      args.unshift "MASTER:"
    else
      args.unshift  "PID #{process.pid}:"

    console.log.apply @, args

Heighliner._cluster = Cluster
