import express from "express"
import bodyParser from "body-parser"
import routes from "./app/routes"
const app = express()

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!")
})

routes(app)

app.listen(8080, () => {
  console.log("App listening on port 8080!")
})
