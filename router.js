const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const rscript = require('r-script');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const microbe_router = express.Router();

const db = new sqlite3.Database('./microdb.sqlite');

microbe_router.use(function (req, res, next) {
    console.log('Received request');
    next();
});

microbe_router.get('/greeting', function (req, res) {
    res.send('Hello world!');
});

microbe_router.get('/greeting/:name/:lastname?', function (req, res) {
    if (req.params.lastname) {
        res.send(`Hello Dr ${req.params.lastname}!`);
    } else {
        res.send(`Hello ${req.params.name}!`);
    }
});

microbe_router.get('/authors', function (req, res) {
    const query = 'SELECT * FROM authors;';
    db.all(query, [], function (err, rows) {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

microbe_router.get('/authors/count', function (req, res) {
    const query = 'SELECT COUNT(*) AS author_count FROM authors;';
    db.get(query, [], function (err, row) {
        if (err) {
            throw err;
        }
        res.json(row);
    });
});

microbe_router.get('/experiments',
                   function(req, res) {
    const query = 'SELECT * FROM experiments;';
    db.all(query, [], function (err, rows) {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

microbe_router.get('/experiments/count',
                   function(req, res) {
    const query = 'SELECT COUNT(*) AS experiment_count FROM experiments;';
    db.get(query, [], function (err, row) {
        if (err) {
            throw err;
        }
        res.json(row);
    });
});

// Returning maximum growth rate as a function of temperature
// Test: http://localhost:3000/api/fit/growthrates/Staphylococcus%20aureus/TSA
microbe_router.get('/fit/growthrates/:organism/:medium',
                   function(req, res) {
    const query = 'SELECT time, cfu, temperature ' +
                  'FROM datapoints JOIN experiments ' +
                  'ON datapoints.experiment_id = experiments.experiment_id ' +
                  'WHERE organism = ? AND medium = ?' +
                  'ORDER BY temperature, time';
    const parameters = [
        req.params.organism,
        req.params.medium
    ];
    db.all(query, parameters, function (err, rows) {
        if (err) {
            throw err;
        }
        // map() is much simpler than manually extracting in a loop!
        const r_input = {
            temperatures: rows.map(row => row.temperature),
            times: rows.map(row => row.time),
            cfus: rows.map(row => row.cfu)
        }

        const unique_temperatures = [];
        for (let i = 0; i < rows.length; i++) {
            const temp = rows[i].temperature;
            if (!unique_temperatures.includes(temp)) {
                unique_temperatures.push(temp);
            }
        }

        rscript('fit_temperature_model.R').data(r_input)
                                          .call(function (err, coefs) {
            res.json({
                temperatures: unique_temperatures,
                growth_rates: coefs
            });
        });
    });
});

microbe_router.get('/fit/growth/:experiment_id',
                   function(req, res) {
    const query = 'SELECT time, cfu FROM datapoints ' +
                  'WHERE experiment_id = ? ORDER BY time;';
    const parameters = [
        req.params.experiment_id
    ];
    db.all(query, parameters, function (err, rows) {
        if (err) {
            throw err;
        }
        const r_input = {
            times: [],
            cfus: []
        };
        for (let i = 0; i < rows.length; i++) {
            r_input.times.push(rows[i].time);
            r_input.cfus.push(rows[i].cfu);
        }
        rscript('fit_model.R').data(r_input)
                                .call(function (err, growth_coef) {
            if (err) {
                // Encoding and displaying R error message
                console.log(String.fromCharCode.apply(null, err));
                throw err;
            }
            const output = {
                experiment_id: req.params.experiment_id,
                growth_coefficient: growth_coef
            };
            res.json(output);
        });
    });
});

microbe_router.get('/experiments/:experiment_id',
                   function(req, res) {
    const query = 'SELECT * FROM experiments WHERE experiment_id = ?;';
    const parameters = [
        req.params.experiment_id
    ];
    db.all(query, parameters, function (err, rows) {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

microbe_router.get('/experiments/:medium/:mintemp/:maxtemp',
                   function (req, res) {
    const query = 'SELECT * FROM experiments WHERE medium = ? ' +
                  'AND temperature >= ? AND temperature <= ?;';
    const parameters = [
        req.params.medium,
        req.params.mintemp,
        req.params.maxtemp
    ];
    db.all(query, parameters, function (err, rows) {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

microbe_router.get('/datapoints/:experiment_id',
                   function (req, res) {
    const query = 'SELECT * FROM datapoints WHERE experiment_id = ? ' +
                  'ORDER BY time;';
    const parameters = [ req.params.experiment_id ];
    db.all(query, parameters, function (err, rows) {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// EXTRA TASK
// Using the request package and temporary files for a very simple solution.
// If you wish to re-use code from the front-end, you can also use
// the node-XMLHttpRequest package (npm install xmlhttprequest).

const request = require('request');
const fs = require('fs');
const tmp = require('tmp');

microbe_router.get('/plot_growth_curve/:experiment_id', function(req, res) {
    const url = `http://localhost:3001/growth_curve/fit?experiment_id=${req.params.experiment_id}`;
    const output_filename = `${req.params.experiment_id}_plot.png`;
    request(url, { encoding: 'binary' }, function(err, response, body) {
        if (err) {
            throw err;
        }
        const temporary_file = tmp.fileSync();
        fs.writeFile(temporary_file.name, body, 'binary', function (err) {
            if (err) {
                throw err;
            }
            res.download(temporary_file.name, output_filename);
        });
    });

});

module.exports = microbe_router
