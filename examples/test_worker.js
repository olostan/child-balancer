var id = process.pid;

console.log("Started ",id);
process.on("message", function(task) {
    setTimeout(function() {
        process.send("Task"+task+" executed by "+id);
    }, Math.random()*500|0)
});
process.on("disconnect", function() {
    console.log("Closing worker",id);
});