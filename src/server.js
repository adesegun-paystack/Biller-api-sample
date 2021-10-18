require('dotenv').config({
    path: '.env',
});

const app = require('./app');

app.set('port', process.env.PORT || 8080);
const server = app.listen(app.get('port'), async () => {
    const address = server.address()
    console.log(`🚀 Express running → PORT ${address.port}`);
});
