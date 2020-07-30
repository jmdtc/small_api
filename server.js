import express from "express"
import routes from "./app/routes"
import db from "./app/utils/dbAsync"
import cors from "cors"

const app = express()
db.open("./app/database/database.db")

app.get("/", (req, res) => {
  res.send("Hello World!")
})
app.use(cors());
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
