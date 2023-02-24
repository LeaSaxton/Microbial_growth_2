needs(httr)
needs(jsonlite)
needs(growthrates)

API_URL <- "http://localhost:3000/api"

load_datapoints <- function(experiment) {
    request <- GET(paste(API_URL, "datapoints", experiment, sep='/'))
    response <- content(request, as = "text", encoding = "UTF-8")
    return(fromJSON(response))
}

load_experiment <- function(experiment) {
    request <- GET(paste(API_URL, "experiments", experiment, sep='/'))
    response <- content(request, as = "text", encoding = "UTF-8")
    return(fromJSON(response))
}

experiment_id <- 'ds003b10'
datapoints <- load_datapoints(experiment_id)
experiment <- load_experiment(experiment_id)

plot_title <- paste("Growth of", experiment$organism,
                    "in", experiment$medium,
                    "at", experiment$temperature, "degrees C")

fit <- fit_spline(datapoints$time, datapoints$cfu)

plot(fit, pch=20,
     main=plot_title, xlab="Time", ylab="Population [log10 CFU / ml]")

coef(fit)
