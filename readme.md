# Minotaur

[![Greenkeeper badge](https://badges.greenkeeper.io/Neamar/minotaur.svg)](https://greenkeeper.io/)

## Architecture
### GET /tournaments/new
Display form. Validate data.

tournament.save()
participants.bulk.save()

### GET /tournaments/:id
Find tournament
Find participants ordered by score()
Display table

### Worker
#### refillQueue
Find all active tournaments.
Find all participants matching those tournaments
Feed them to queue.

#### queueWorker
Get recent games on v1.3
Filter only on valid queue (whitelist)
Compare with last known ID.
Atomically update games[] and score
Send notification if registered.

## Database
tournaments:
    -   _id
    -   title
    -   description
    -   startDate
    -   endDate
    -   region
    -   participants[]

participants:
    - _id
    - tournament
    - summonerId
    - ?lastKnownGame
    - games[]
    - score
    - notificationToken
    
Unique together: tournament, summonerId

## How to MVP
(and also, how to test?)

Bootstrap project
=> 1h

Probably start with the actual leaderboard display. No notification. No asking for summoner name. Just a plain table. Easy to test.
=> 2h

After this warmup, keep going with the form to create a new tournament. KISS.
=> 3h

Then, harder: the worker.
Setup FJQ :D Setup refiller and actual worker. Proper test implementation?
=> 4h

Finally, the cherry on the cake: web notification. Do they work offline? How?
=> Unknown... but exciting.
