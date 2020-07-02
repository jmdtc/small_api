const checkParamsInUrl = (queryObject) => {
  const removeBrackets = (dimension) => {
    const brackets = ["lt", "gt"]
    const dimSplit = dimension.split("_")
    if (dimSplit.some(el => brackets.includes(el))) {
      const index = dimSplit.findIndex(el => brackets.includes(el))
      const sliced = dimSplit.slice(0,index)
      return sliced.join("_")
    }
    return dimension
  }
  const checkForType = (paramType, value) => {
    switch (paramType) {
      case "string":
        return true
      case "boolean":
        const lowered = value.toLowerCase()
        return lowered === "true" || lowered === "false"
      case "array":
        return Array.isArray(value)
    }
  }
  const datatypes = {
    integer: ["power_trust", "visibility", "ref_domains", "price"],
    string: ["domain_name", "lang", "country"],
    boolean: ["blacklist", "agency"],
    array: ["category"]
  }
  const dimensionsChecked = Object.keys(queryObject).map(paramName => {
    const paramType = Object.keys(datatypes).filter(type => {
      if (datatypes[type].includes(paramName)) {
        return true
      }
      return false
    })[0]
    const dimExists = paramType === undefined ? false : true
    if (!dimExists) {
      const formattedParamsName = removeBrackets(paramName)
      const isInIntParamsList = datatypes.integer.includes(formattedParamsName)
      if (!isInIntParamsList) {
        return {
          paramName: paramName,
          dimExists: false,
          isRightType: false
        }
      }
      const isInteger = Number.isInteger(Number(queryObject[paramName]))
      return {
        paramName: paramName,
        dimExists: true,
        isRightType: isInteger
      }
    }

    const isRightType = checkForType(paramType, queryObject[paramName])
    return {
      paramName: paramName,
      dimExists: dimExists,
      isRightType: isRightType
    }
  })
  const statusCode = dimensionsChecked.every(dim => dim.dimExists && dim.isRightType) ?
    200 : 400
  return {
    paramStatusCode: statusCode,
    msg: dimensionsChecked
  }
}

const price_gt = (queryObject) => {
}

const visibility_gt = () => {

}

module.exports = (app, db) => {
  app.get("/api/domains", (req, res) => {
    const { query } = req
    const { paramStatusCode } = checkParamsInUrl(query)
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
