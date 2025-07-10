require('dotenv').config();
require('./server');
require('./listeners/tmi');
require('./listeners/tes');
require('./events/tesEvents');