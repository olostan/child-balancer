## Simple child_process.fork balancer.

Main idea is to provide simple api for creating child workers that will process some
messages and reply it back to master process.

### Main features:
* Always keeps at least 1 active (running) worker.
* Spawns new woker in case if current worker is *busy* (see below).
* Allows to specify minimum number of workers to reserve enough workers to answer on messages
* Allows to specify maxumum number of workers. If all workers are busy, messages would be queued.
* Allows to limit concurrency of workers (by tracking task completeness, see "Usage"):
  * Setting concurrency to 1 make worker to execute only one message at time (so no async at all)
  * Setting concurrency to 10 make worker to accept up to 10 messages without responding back.
  * Setting concurrency to 0 make worker to receive all messages, no matter on how much was responded. In this
no new worker would be ever created.


### Installation

`npm install child-balancer`

### Usage
Original [send](http://nodejs.org/api/child_process.html#child_process_child_send_message_sendhandle) example:
```javascript
var cp = require('child_process');

var n = cp.fork(__dirname + '/sub.js');

n.on('message', function(m) {
  console.log('PARENT got message:', m);
});

n.send({ hello: 'world' });
```

With `child_process`:
```javascript
var Balancer = require('child_balancer');

var n = new Balancer(__dirname + '/sub.js');

n.onMessage(function(m) {
  console.log('PARENT got message:', m);
});

n.send({ hello: 'world' });
```

It will create balancer that:
* Allow each worker to access unlimited number of 'tracked' messages (see "Tracking of completeness")
* Balancer will create up to 10 workers
* Balancer will keep always 1 worker active

### Tracking of completeness

Balancer has an option to limit number of messages sent to each worker.

To achieve that new type of messages was introduced: _$complete_ messages.

To send message, that should be tracked, you need wrap message in `$complete` property, like: `{ '$complete': "Some message" }`. This
will allow Balancer to track how many tracking messages were sent to worker.

Upon completion, _worker_ should respond to _balancer_ message, that will be wrapped also with `$complete` property.

Meanwhile both sides can send ordinary messages and they wouldn't be tracked.

To configure Balancer to limit number of messages that could be processed by one client, you need to configure it:
```
{
    concurrency: 2
}
```

### Syntax

To create new balancer you need: `new Balancer(path_to_script, [config])`
Where `config` is an object with such properties: 

name | type | default | Description
--- | --- | --- | --- |
min_limit | Number | 1 | Minimal number of wokerks. After start balancer will launch this ammount of workers
max_limit | Number | 16 | Maximum number of workers. If all workers busy and there is no possibility to run new worker, messages would be queued.
concurrency | Number | 10 | Maximum number of messages that can be processed by one worker
pulseTime | Number | 500 | Period in ms when balancer need to check if new worker should be run or some worker killed
args | Array<Script> | [] | Arguments that should be passed to worker
keepWarm | boolean | false | Should Balancer keep 1 worker even if there are no task queued?

#### balancer.send(message)

Balancer will try to find free worker to send message. IF all workers are busy, then message would be queued. Next
"tick" balancer will try to create new worker and send message to it.

#### balancer.onMessage(handler)

Attach handler that would be called when worker send message back.

#### balancer.disconnect()

To stop balancer and disconnect all workers.

## To do:

* Tests
