# "needs" instead of "library" or "require" is specific to r-script
needs(growthrates)
attach(input[[1]])

fit <- fit_spline(times, cfus)
coef(fit)['mumax']
