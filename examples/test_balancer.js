var Balancer = require('../balancer');

var balancer = new Balancer('./examples/test_worker', {
    max_limit : 10,
    min_limit: 2
});
var total = 15;
for (var i = 0;i<total;i++) {
    balancer.send("T"+i);
}
var recieved = 0;
balancer.onMessage(function(msg) {
    console.log("Got:",msg," workers:", balancer.workers.length," left:",total-recieved-1);
    if (Math.random()>0.2) {
            total++;
            setTimeout(function() {
                balancer.send("T"+total);
            },500);
    }
    if (++recieved==total) {
        console.log("Finished");
        balancer.disconnect();
    }

});

