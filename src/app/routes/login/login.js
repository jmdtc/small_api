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

      console.log(rightLogin);
      res.send("Coucou")
    } catch {
      res.status(500).json({
        message: "Server error"
      })
    }
  })
}

/*
.catch(e => {
  res.status(500).json({
    message: "Server error"
  })
})
*/
