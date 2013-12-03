var Balancer = require('../balancer');

var balancer = new Balancer('./examples/test_worker', {
    max_limit: 10,
    min_limit: 2,
    concurrency: 20
});
var total = 15;
for (var i = 0; i < total; i++) {
    balancer.complete("T" + i);
}
var recieved = 0;
balancer.onMessage(function (msg) {
    if (msg.log) {
        console.log("[log]",msg.log);
    } else
    if (msg.result) {
        console.log("Got:", msg.result, " workers:", balancer.workers.length, " left:", total - recieved - 1, "balancer queue:", balancer.queue.length);
        if (Math.random() > 0.9) {
            total++;
            setTimeout(function () {
                balancer.complete("T" + total);
            }, 500);
        }
        if (++recieved == total) {
            console.log("Finished");
            balancer.disconnect();
        }
    }

});

