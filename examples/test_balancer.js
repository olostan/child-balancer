var Balancer = require('../balancer');

var balancer = new Balancer('./examples/test_worker', {
    max_limit: 10,
    min_limit: 0,
    concurrency: 10
});
setTimeout(function () {
    console.log("Starting adding tasks.")
    var total = 15;
    for (var i = 0; i < total; i++) {
        balancer.complete("T" + i);
    }
    var recieved = 0;
    balancer.onMessage(function (msg) {
        if (msg.log) {
            console.log("[log]", msg.log);
        } else if (msg.result) {
            console.log("Got:", msg.result, " workers:", balancer.workers.length, " left:", total - recieved - 1, "balancer queue:", balancer.queue.length);
            if (Math.random() > 0.9) {
                total++;
                setTimeout(function () {
                    balancer.complete("T" + total);
                }, 500);
            }
            if (++recieved == total) {
                console.log("Finished. Lets wait some time. Workers:"+balancer.workers.length);
                setTimeout(function() {
                    console.log("Adding one task to test. Workers:"+balancer.workers.length);
                    balancer.complete("T" + total);

                },3000);
            }
            if (recieved== total+1) {
                console.log("Final finish");
                balancer.disconnect();
            }
        }

    });

}, 2000);
console.log("Sleeping to test 0 as min workers");