const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const routes = require('./app/routes')

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!")
})

routes(app)

app.listen(3000, () => {
  console.log("App listening on port 3000!")
})
