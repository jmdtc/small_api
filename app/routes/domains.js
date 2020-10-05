import _ from "lodash"
import dataTypes from "./dataTypes/domains_datatypes"
import { getDomainsFromQuery, countResults, countColValues } from "./sql/domains_get"

const squashCategories = (queryObject) => {
  return Object.keys(queryObject).reduce((acc, curr) => {
    const shouldBeArrays = ["category", "homepage_title"]
    const value = queryObject[curr]
    if (shouldBeArrays.includes(curr) && value !== undefined && !Array.isArray(value)) {
      return {
        ...acc,
        [curr]: [value]
      }
    }
    return {
      ...acc,
      [curr]: value
    }
  },{})
}

const checkParamsInUrl = async (queryObject, dataTypes, db) => {
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

  const checkParamRequirements = async (paramTypeObject, dataTypes, db) => {
    const isInteger = (val) => Number.isInteger(Number(val))
    const { paramValue, paramType, paramKey } = paramTypeObject
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
      case "boolean": {
        const lowered = paramValue.toLowerCase()
        reqFulfilled = lowered === "true" || lowered === "false"
        break;
      }
      case "array":
        reqFulfilled = Array.isArray(paramValue)
        break;
      case "sorter": {
        const lowered = paramValue.toLowerCase()
        if (paramKey === "sort_by") {
          const sql = `
            SELECT
              d.*,
              ad.price
            FROM domains d
            LEFT JOIN domain_tags dt ON d.id = dt.domain_id
            LEFT JOIN tags t ON dt.tag_id = t.id
            LEFT JOIN agencies_domains ad ON d.id = ad.domain_id
            LEFT JOIN agencies a ON ad.agency_id = a.id
            WHERE d.id = 1
          `
          const columns = await db.all(sql).then(r => Object.keys(r[0]))
          reqFulfilled = columns.includes(lowered)
          break;
        }
        else if (paramKey === "order") {
          reqFulfilled = (lowered === "asc" || lowered === "desc")
        }
        break;
      }
      default:
        reqFulfilled = false
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

  const paramsTypeChecked = await Promise.all(paramsMappedToType.map(param => checkParamRequirements(param, dataTypes, db)))
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

const checkValidityOfParams = async ({query}, dataTypes, db) => {
  const formattedQuery = squashCategories(query)
  const paramsChecked = await checkParamsInUrl(formattedQuery, dataTypes, db)
  return {
    ...paramsChecked,
    formattedQuery: formattedQuery
  }
}


module.exports = (app, db) => {
  app.get("/api/domains", async (req, res) => {
    const { msg, statusCode, formattedQuery } = await checkValidityOfParams(req, dataTypes, db)
    if (statusCode === 400) {
      res.status(400).send("Bad params")
    }
    else {
      const domains = await getDomainsFromQuery(formattedQuery, db)
      res.json(domains)
    }
  })

  app.get("/api/domains/countResults", async (req, res) => {
    const { msg, statusCode, formattedQuery } = await checkValidityOfParams(req, dataTypes, db)
    if (statusCode === 400) {
      res.status(400).send("Bad params")
    }
    else {
      const count = await countResults(formattedQuery, db)
      res.json(count[0])
    }
  })

  app.get("/api/domains/getCategories", async (req, res) => {
    const availableTags = await countColValues("tag", db)
    res.json(availableTags)
  })

  app.get("/api/domains/getLanguages", async (req, res) => {
    const availableLangs = await countColValues("lang", db)
    res.json(availableLangs)
  })

  app.get("/api/domains/getCountries", async (req, res) => {
    const availableCountries = await countColValues("country", db)
    res.json(availableCountries)
  })
}
