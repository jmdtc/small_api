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
  const getParamsCheckedObject = (paramsData) => {
    const { paramType, paramName, value, dimExists } = paramsData
    switch (paramType) {
      case "integer":
        return {
          paramName: paramName,
          dimExists: false,
          isRightType: false
        }
      case "string":
        return {
          paramName: paramName,
          dimExists: dimExists,
          isRightType: true
        }
      case "boolean":
        const lowered = value.toLowerCase()
        return {
          paramName: paramName,
          dimExists: dimExists,
          isRightType: lowered === "true" || lowered === "false"
        }
      case "array":
        return {
          paramName: paramName,
          dimExists: dimExists,
          isRightType: Array.isArray(value)
        }
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
    const paramsData = {
      paramType: paramType,
      paramName: paramName,
      value: queryObject[paramName],
      dimExists: dimExists
    }
    return getParamsCheckedObject(paramsData)
  })
  const statusCode = dimensionsChecked.every(dim => dim.dimExists && dim.isRightType) ?
    200 : 400
  return {
    paramStatusCode: statusCode,
    paramsCheckedMsg: dimensionsChecked
  }
}

module.exports = (app, db) => {
  app.get("/api/domains", (req, res) => {
    const { query } = req
    const { paramStatusCode, paramsCheckedMsg } = checkParamsInUrl(query)
    console.log(paramsCheckedMsg)
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
