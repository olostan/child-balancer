var id = process.pid;

console.log("Started ",id);
var executing  = 0;
process.on("message", function(task) {
    executing++;
    process.send({log:"Got task to execute by "+id+" task:"+task});
    setTimeout(function() {
        executing--;
        process.send({'$complete':{ result:"Task"+task+" executed by "+id+" worker left:"+executing}});
    }, Math.random()*2500|0)
});
process.on("disconnect", function() {
    console.log("Closing worker",id);
});