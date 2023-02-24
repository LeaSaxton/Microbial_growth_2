library(plumber)
library(httr)
library(jsonlite)
library(growthrates)

#* @apiTitle Greeting API in Plumber

#* @get /greeting
function(name = NULL) {
    if (is.null(name)) {
        return("Hello world!")
    } else {
        return(paste("Hello ", name, "!"))
    }
}

#* @get /histogram
#* @serializer png
function(sample_size=1000, breaks=100) {
    print("logging")
    samples <- rnorm(as.numeric(sample_size))
    hist(samples, breaks=as.numeric(breaks))
}

#* @get /growth_curve
#* @serializer png
function(experiment_id) {
    # Test with http://localhost:3001/growth_curve?experiment_id=ds001a3
    request <- GET(paste("http://localhost:3000/api/datapoints/",
                         experiment_id, sep=''))
    response <- content(request, as = "text", encoding = "UTF-8")
    df <- fromJSON(response)
    plot(df$time, df$cfu, xlab="Time", ylab="Population [log10 CFU / ml]")
}

#* @get /growth_curve/fit
#* @serializer png
function(experiment_id) {
    # Test with http://localhost:3001/growth_curve/fit?experiment_id=ds001a3
    request <- GET(paste("http://localhost:3000/api/datapoints/",
                         experiment_id, sep=''))
    response <- content(request, as = "text", encoding = "UTF-8")
    df <- fromJSON(response)
    fit <- fit_spline(df$time, df$cfu)
    plot(fit, xlab="Time", ylab="Population [log10 CFU / ml]")
}