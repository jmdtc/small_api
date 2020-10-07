import jwt from "jsonwebtoken"

const auth = () => {
  console.log("ok");
  next()
}

export default function(app, db) {
  app.post("/api/login", async (req, res) => {
    try {
      const { user, password } = req.body
      const { PW, LEAP_USER } = process.env
      const rightLogin = user === LEAP_USER && password === PW
      if (!rightLogin) {
        res.status(401).json({
          message: "Authentication failed"
        })
      }

      const payload = {
        user: "lb_team"
      }
      jwt.sign(
        payload,
        "something", {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
              token
          });
        }
      )
    } catch {
      res.status(500).json({
        message: "Server error"
      })
    }
  })

  app.get("/api/loggedIn", auth, async (req, res) => {
    res.status(200).send("worked")
  })
}

/*
.catch(e => {
  res.status(500).json({
    message: "Server error"
  })
})
*/
