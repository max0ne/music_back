require('dotenv').config();
const fs = require('fs');
const db = require('../src/models/db');

dotenv.config();

fs.readFileSync('/Users/max/Desktop/albums.csv').map(console.log);
