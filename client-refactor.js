const client = redis.createClient(redis_url,{
    retry_strategy: function(options) {
        if (options.total_retry_time > 5000) {
            return new Error('Retry time exhausted')
        }
        if (options.attempt > 5) {
            // End reconnecting with built in error
            return new Error('Max number of attempts reached');
        }
        if (options.error && options.error.code === "ECONNREFUSED") {
          // End reconnecting on a specific error and flush all commands with
          // a individual error
          //return new Error("The server refused the connection");
          console.log(options.error.code + ' - attempt - ' + options.attempt)
          return new Error('The server refused the connection')
        } 
    },
})

