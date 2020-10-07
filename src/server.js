require('dotenv').config()
import express from "express"
import path from "path"
import cors from "cors"
import routes from "./app/routes/index"
import db from "./app/utils/dbAsync"

const app = express()

//path.resolve(__dirname, "database.db")
//"./src/app/database/database.db"
db.open(
  path.resolve(__dirname, "database.db")
).catch(console.log)

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Hello World!")
})
app.use(cors());
routes(app, db)

const port = process.env.PORT || 8080
const server = app.listen(port, async function() {
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
