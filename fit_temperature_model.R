needs(growthrates)

# Receiving parallel vectors of "temperatures", "times", and "cfus"
attach(input[[1]])

mumax <- c()
for (t in unique(temperatures)) {
    index <- temperatures == t
    fit <- fit_spline(times[index], cfus[index])
    mumax <- c(mumax, coef(fit)['mumax'])
}

mumax