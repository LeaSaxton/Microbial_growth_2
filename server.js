const express = require('express');
const router = require('./router');
const app = express();
const port = 3000;

app.use('/api', router);

app.listen(port, function () {
    console.log(`Application deployed on port ${port}`);
});
