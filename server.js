import express from "express"
import routes from "./app/routes"
import db from "./app/utils/dbAsync"

const app = express()
db.open("./app/database/database.db")

app.get("/", (req, res) => {
  res.send("Hello World!")
})

routes(app, db)

const server = app.listen(8080, async function() {
  console.log("App listening on port 8080!")
})

process.on('SIGINT', async () => {
    await db.close();
    process.exit();
});

process.on('SIGUSR2', async () => {
    await db.close();
    process.exit()
});

//
