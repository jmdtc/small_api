import _ from "lodash"

const getWhereClause = (dimension, value) => {
  let column = dimension
  let bracket = ""
  if (dimension.includes("_lt") || dimension.includes("_gt")) {
    column = dimension.slice(0, -3)
    bracket = dimension.includes("_lt") ?
      "<" : ">"
  }
  switch (column) {
    case "power_trust":
      return `lrt_power_trust ${bracket} ? `
    case "price":
      return `ad.price ${bracket} ? `
    case "visibility":
      return `visibility ${bracket} ?`
    case "ref_domains":
      return `lrt_referring_domains ${bracket} ?`
    case "domain_name":
      return `domain_name LIKE ?`
    case "lang":
      return `LOWER(lang) = ?`
    case "country":
      return `LOWER(country) = ?`
    case "blacklist":
      return `blacklist = ?`
    case "agency":
      return `agency = ?`
    case "category":
      return `LOWER(t.tag) IN (${Array(value.length)
          .fill("?")
          .join(",")
        })`
  }
}

const formatValue = (dimension, value) => {
  const boolToInt = value === "true" ?
    1 : 0
  switch (dimension) {
    case "blacklist":
      return boolToInt
    case "agency":
      return boolToInt
    case "domain_name":
      return `%${value}%`
    case "category":
      return value.map(s => s.toLowerCase())
    default:
      if (typeof value === "string") return value.toLowerCase()
      return value
  }
}

const getSqlClauses = (filters, pagination) => {
  const getLimitClauses = (pagination) => {
    const { page, per_page } = pagination
    const perPageChecked = per_page > 50 || per_page === undefined ?
      50 : Number(per_page)
    const pageChecked = page === undefined ?
      0 : (Number(page) * perPageChecked) - perPageChecked
    return {
      limitClauses: ["LIMIT ?", "OFFSET ?"],
      values: [perPageChecked, pageChecked]
    }
  }

  const filtersDimensions = Object.keys(filters)
  const whereClauses = filtersDimensions.reduce((acc, curr) => {
    const filterValue = filters[curr]
    const formattedValue = formatValue(curr, filterValue)
    const newWhereClause = getWhereClause(curr, filterValue)
    if (Array.isArray(filterValue)) {
      return {
        whereClauses: [...acc.whereClauses, newWhereClause],
        values: [...acc.values, ...formattedValue]
      }
    }
    return {
      whereClauses: [...acc.whereClauses, newWhereClause],
      values: [...acc.values, formattedValue]
    }
  }, {
    whereClauses: [],
    values: []
  })
  const limitClauses = getLimitClauses(pagination)
  return {
    ...whereClauses,
    ...limitClauses,
    values: [...whereClauses.values, ...limitClauses.values]
  }
}

const getDomainsFromFilters = async ({ values, whereClauses, limitClauses }, db) => {
  const squashEntries = (domains) => {
    const getAgenciesKey = (acc, domId, agency_name, price) => {
      const agencyObject = {
        name: agency_name,
        price: price
      }
      if (acc[domId]) {
        if (acc[domId].agencies.some(a => _.isEqual(a, agencyObject)) ||
        price === null || agency_name === null) {
          return acc[domId].agencies
        }
        return [...acc[domId].agencies, agencyObject]
      }
      if (price === null || agency_name === null) {
        return []
      }
      return [agencyObject]
    }

    const getTagsKey = (acc, domId, newTag) => {
      if (acc[domId]) {
        if (acc[domId].tags.some(t => t === newTag) || newTag === null) {
          return acc[domId].tags
        }
        return [...acc[domId].tags, newTag]
      }
      if (newTag === null) {
        return []
      }
      return [newTag]
    }

    const squashedObject = domains.reduce((acc, curr) => {
      const { id } = curr
      const toOmit = ["tag", "price", "agency_name"]
      const notToBeSquashed = _.omit(curr, toOmit)
      const { tag, price, agency_name } = _.pick(curr, toOmit)
      const agencies = getAgenciesKey(acc, id, agency_name, price)
      const tags = getTagsKey(acc, id, tag)
      return {
        ...acc,
        [id]: {
          ...notToBeSquashed,
          tags: tags,
          agencies: agencies
        }
      }
    }, {})
    return Object.values(squashedObject)
  }
  if (whereClauses.length < 1) {
    whereClauses = ["1 = 1"]
  }
  const joinBase =
    `FROM domains d
    LEFT JOIN domain_tags dt ON d.id = dt.domain_id
    LEFT JOIN tags t ON dt.tag_id = t.id
    LEFT JOIN agencies_domains ad ON d.id = ad.domain_id
    LEFT JOIN agencies a ON ad.agency_id = a.id`
  const idSql =
    `SELECT d.id
    ${joinBase}
    WHERE ${whereClauses.join(" AND ")}
    GROUP BY d.id
    ${limitClauses.join(" ")}`
  const domainsIDs = await db.all(idSql, values)
    .then(doms => doms.map(d => d.id))

  const finalSql =
    `SELECT
      d.*,
      t.tag,
      ad.price,
      a.name AS agency_name
    ${joinBase}
    WHERE d.id IN (${domainsIDs.join(",")})`
  const domainsMetrics = await db.all(finalSql)
    .then(squashEntries)
  return domainsMetrics
}

const getDomainsFromQuery = async (queryObject, db) => {
  const paginationKeys = ["per_page", "page"]
  const filters = _.omit(queryObject, paginationKeys)
  const pagination = _.pick(queryObject, paginationKeys)
  const sqlClauses = getSqlClauses(filters, pagination)
  const domains = await getDomainsFromFilters(sqlClauses, db)
  return domains
}

module.exports =  {
  getDomainsFromQuery
}
