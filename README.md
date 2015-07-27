
# Heighliner

Heighliner is a micro-service application framework used to create highly scaleable database worker processes. It is currently in pre development with plans to support node and one day Go worker applications. The goal is to create an efficient wrapper around database driven processes with an API for load balancing and interfacing with Kuberenetes.



### Namesake

In Frank Herbert's Dune universe, a Heighliner was a starship used by the Spacing Guild to transport people and equipment across the known universe.
Guild Heighliners were usually immense in size, easily accommodating many thousands of passengers and the vast export of planetary goods.

Spacing Guild Heighliners could be used to fold space to travel vast distances across the universe in an instant. They were piloted by Guild Navigators and Steersmen.

Kuberenetes is Greek for "the pilot or steersman of a ship," or, metaphorically, "a guide or governor". So Kuberenetes is the steersman (navigator) of Heighliners to carry data across applications.


### Goals

1. Incredibly small base with connections for different databases
2. Easy to scale and balance queues between workers
3. Slimmed down docker container runtime (smallest possible footprint)
4. Advanced logging and 3rd party service tie-ins
5. Server only (no client)


### Related Projects
(Guild)[https://github.com/normajs/Guild] - Navigator management tool
(Norma)[https://github.com/normajs/Norma] - Automated asset pipeline built on node
(Junction)[https://github.com/normajs/Junction] - Client Side Javascript Library with helpers and plugin systems
(Junction-framework)[https://github.com/normajs/Junction-framework] - CSS layout framework for the Junction library
