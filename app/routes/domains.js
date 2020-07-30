import _ from "lodash"
import dataTypes from "./dataTypes/domains_datatypes"
import { getDomainsFromQuery } from "./sql/domains_get"

const formatQuery = (queryObject) => {
  const { category } = queryObject
  if (category !== undefined && !Array.isArray(category)) {
    return {
      ...queryObject,
      category: [category]
    }
  }
  return queryObject
}

const checkParamsInUrl = (queryObject, dataTypes) => {
  const getParamType = (paramKey, value, dataTypes) => {
    const types = Object.keys(dataTypes)
    const paramTypeIndex = types.findIndex(type => {
      const typeDimensions = dataTypes[type]
      if (type === "interval" || type === "float_interval") {
        return typeDimensions.map(dim => dim + "_gt").includes(paramKey) ||
          typeDimensions.map(dim => dim + "_lt").includes(paramKey)
      }
      return typeDimensions.includes(paramKey)
    })
    const paramType = types[paramTypeIndex]
    return {
      paramKey: paramKey,
      paramValue: value,
      paramType: paramType
    }
  }

  const checkParamRequirements = (paramTypeObject) => {
    const isInteger = (val) => Number.isInteger(Number(val))

    const { paramValue, paramType } = paramTypeObject
    let reqFulfilled = false
    switch (paramType) {
      case "page":
        reqFulfilled = isInteger(paramValue) && paramValue > 0
        break;
      case "interval":
        reqFulfilled = isInteger(paramValue) && paramValue >= 0
        break;
      case "float_interval":
        reqFulfilled = !Number.isNaN(paramValue) && paramValue >= 0
        break;
      case "string":
        reqFulfilled = true
        break;
      case "boolean":
        const lowered = paramValue.toLowerCase()
        reqFulfilled = lowered === "true" || lowered === "false"
        break;
      case "array":
        reqFulfilled = Array.isArray(paramValue)
        break;
    }
    return {
      ...paramTypeObject,
      reqFulfilled: reqFulfilled
    }
  }

  const paramsKeys = Object.keys(queryObject)
  const paramsMappedToType = paramsKeys.map(key => getParamType(key, queryObject[key], dataTypes))
  if (paramsMappedToType.some(param => param.paramType === undefined)) {
    return {
      statusCode: 400,
      msg: "Dimension does not exist: " +
        paramsMappedToType
        .filter(param => param.paramType === undefined)
        .map(param => param.paramKey)
        .join(", ")
    }
  }

  const paramsTypeChecked = paramsMappedToType.map(param => checkParamRequirements(param))
  const statusCode = paramsTypeChecked.every(param => param.reqFulfilled === true) ?
    200 : 400
  const msg = statusCode === 400 ?
    "Wrong type: " +
      paramsTypeChecked
      .filter(param => param.reqFulfilled === false)
      .map(param => param.paramKey)
      .join(", ") : ""
  return {
    statusCode: statusCode,
    msg: msg
  }
}


module.exports = (app, db) => {
  app.get("/api/domains", async (req, res) => {
    const { query } = req
    const formattedQuery = formatQuery(query)
    const { msg, statusCode } = checkParamsInUrl(formattedQuery, dataTypes)
    if (statusCode === 400) {
      res.status(400).send("Bad params")
    }
    else {
      const domains = await getDomainsFromQuery(formattedQuery, db)
      res.json(domains)
    }
  })
}
