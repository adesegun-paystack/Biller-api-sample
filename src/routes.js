var express = require('express');
var router = express.Router();
const { getFields, processFields } = require('./controllers/biller.controller')

/* GET home page. */
router.get('/paystack/biller', getFields);
router.post('/paystack/biller', processFields);

module.exports = router;
