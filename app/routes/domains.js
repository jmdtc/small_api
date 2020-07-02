const parseQueries = (queryObject) => {
}

const checkParamsInUrl = (queryObject) => {
  const removeBrackets = (dimension) => {
    const brackets = ["lt", "gt"]
    return dimension
      .split("_")
      .filter(part => {
        if (brackets.some(brack => brack === part)) {
          return false
        }
        return true
      })
      .join("_")
  }
  const datatypes = {
    integer: ["power_trust", "visibility", "ref_domains", "price"],
    string: ["domain_name", "lang", "country"],
    boolean: ["blacklist", "agency"],
    array: ["category"]
  }
  const dimensionsChecked = Object.keys(datatypes).map(key => {
    return {
      type: key,
      wrongType: Object.keys(queryObject).filter(queryKey => {
        const noBracketsParam = removeBrackets(queryKey)
        if (!Object.keys(datatypes).some(type => datatypes[type].includes(noBracketsParam))) return true
        if (!datatypes[key].includes(noBracketsParam)) return false
        switch (key) {
          case "integer":
            return !Number.isInteger(Number(queryObject[queryKey]))
          case "string":
            return false
          case "boolean":
            const lowered = queryObject[queryKey].toLowerCase()
            return lowered !== "true" && lowered !== "false"
          case "array":
            return !Array.isArray(queryObject[queryKey])
        }
      })
    }
  })
  const statusCode = dimensionsChecked.every(dim => dim.wrongType.length < 1) ?
    200 : 400
  return statusCode
}

const price_gt = (queryObject) => {
}

const visibility_gt = () => {

}

module.exports = (app, db) => {
  app.get("/api/domains", (req, res) => {
    const { query } = req
    const paramStatusCode = checkParamsInUrl(query)
    res.statusCode = paramStatusCode
    if (paramStatusCode === 400) {
      res.status(400).send("Bad params")
    }
    else {
      res.send("choupi")
    }
  })

  app.get("", (req, res) => {

  })
}
