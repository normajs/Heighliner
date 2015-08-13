

class FlightPlan
  constructor: (plan) ->

    # validations
    if not plan
      throw new Meteor.Error("No plan specified")
      return

    if not plan.heighliner
      throw new Meteor.Error("No heighliner for plan specified")
      return

    # storage
    self = @
    self.plan = plan
    self.collection = Heighliner.flightplans
    self.landedCallbacks = []

    # actions
    self.sendPlan plan


  # insert the document and bind a handler
  sendPlan: (plan) ->

    self = @


    if plan.name
      currentPlane = self.collection.findOne({
        heighliner: plan.heighliner
        name: plan.name
      })

      if currentPlane and not currentPlane.complete
        flightPlanDoc = currentPlane._id
        self.id = flightPlanDoc
        self.trackPlan flightPlanDoc

        return


    self.collection.insert plan, (err, id) ->

      self.trackPlan id


  trackPlan: (id) ->

    self = @

    land = ->
      args = _.values(arguments)
      self.land.apply self, args

    query = self.collection.find id

    self.handle = query.observe({
      changed: land
    })


  removePlan: (id) ->
    self = @

    self.collection.remove(id, (err, count) ->
      if err
        throw new Meteor.Error err
    )


    self.handle.stop()


  land: (newDoc, oldDoc) ->

    self = @

    # saftey net
    if not newDoc.complete
      return

    if not self.landedCallbacks.length
      self.removePlan(newDoc._id)
      return


    for cb in self.landedCallbacks by -1
      cb.call self, newDoc._id, newDoc.manifest

    self.removePlan(newDoc._id)




  landed: (cb) ->
    @.landedCallbacks.push cb



Heighliner.flightplan = FlightPlan
