
# API

What is a heighliner? What does it need to do? Heighliner is targeted to support database driven processes. In order for this to work it will need to have an observe method for each supported DB as well as a poll method for when the server is offline.

### Application API

From an application I want to be able to write a request...


### Scenarios:

#### A

1. Make a request to Rock for 10 people
2. Upsert all returned people
3. Make a request for more people

#### B

1. Update a person record in Apollos
2. Sync the data with Rock
3. Handle any errors / data from Rock

#### C

1. Get all data from editorials in EE
2. Upsert in Mongo
3. Callback when done

#### D

1. Watch all data from editorials in EE
2. Upsert in Mongo
3. Callback when done
