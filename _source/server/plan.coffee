

class FlightPlan
  constructor: (plan) ->

    if not plan
      throw new Meteor.Error("No plan specified")
      return

    self = @
    self.plan = plan

    self.sendPlan()

  sendPlan: ->

    Flightplans.insert(self.plan)


  landed: (cb) ->

    if typeof cb isnt "function"
      throw new Meteor.Error("No callback function specified")


Heighliner.flightplan = FlightPlan
