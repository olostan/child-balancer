var cp = require('child_process');


function Balancer(script,config) {
    this.script = script;
    this.workers = [];
    this.queue = [];

    this.config = {
        pulseTime : 500,
        max_limit: 16,
        min_limit: 1
    };
    for (var k in config) {
        if (config.hasOwnProperty(k)) this.config[k] = config[k];
    }


    var instance = this;

    this._pulser = setInterval(function() {
        var busy = 0;
        for (var i =0;i<instance.workers.length;i++)
        {
            if (instance.workers[i].worked ||instance.workers[i].busy) busy++;
            instance.workers[i].worked = false;
        }
        var allWorked = busy == instance.workers.length;
        if (allWorked) {
            if (instance.workers.length<instance.config.max_limit) {
                var newWorker = new Worker(instance);
                instance.workers.push(newWorker);
                if (instance.queue.length>0)
                    newWorker.send(instance.queue.shift());
            }
        } else if (instance.workers.length>instance.config.min_limit) {
            var killedWorker = instance.workers.pop();
            killedWorker.closing = true;
            if (!killedWorker.busy) killedWorker.worker.disconnect();
        }
    }, this.config.pulseTime);

    this.workers.push(new Worker(this));
}

Balancer.prototype.tryNext = function() {
    if (this.queue.length==0) return;
    var worker = undefined;

    for(var i=0;i<this.workers.length;i++) {
        if (!this.workers[i].busy) {
            worker = this.workers[i];
            break;
        }
    }
    if (worker && !worker.busy) {
        worker.send(this.queue.shift());
    }
};


Balancer.prototype.send = function(msg) {
    this.queue.push(msg);
    this.tryNext();
};
Balancer.prototype.onMessage = function(handler) {
    if (this._handler || this._handlers) {
        if (!this._handlers) this._handlers = [];
        this._handlers.push(handler);
        if (this._handler) delete this._handler;
    } else this._handler = handler;
};

Balancer.prototype.disconnect = function() {
    for(var i=0;i<this.workers.length;i++)
        this.workers[i].worker.disconnect();
    clearInterval(this._pulser);
};
module.exports = Balancer;

// Internal class Worker for maintaining worker state
function Worker(balancer) {
    this.balancer = balancer;
    this.worker = cp.fork(balancer.script);
    this.queried = 0;
    this.closing = false;
    this.busy = false;
    this.worked = false;
    var me = this;
    this.worker.on('message',function(msg) {
        me.busy = false;
        me.worked = true;
        me.queried--;
        if (me.balancer._handlers)
            for(var idx = 0;idx<me.balancer._handlers.length;idx++) me.balancer._handlers[idx](msg);
        else if (me.balancer._handler)
            me.balancer._handler(msg);
        me.balancer.tryNext();
        if (me.closing) me.worker.disconnect();
    });
}
Worker.prototype.send = function(msg) {
    this.queried++;
    this.busy = true;
    this.worker.send(msg);
};
