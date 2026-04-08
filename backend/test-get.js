const fetch = require("node-fetch");
fetch("http://localhost:5000/api/exercises").then(res => console.log(res.status)).catch(e => console.error(e));
