const sqlite3 = require('sqlite3').verbose()

module.exports.open = function(path) {
  return new Promise((resolve, reject) => {
    this.db = new sqlite3.Database(path, (err) => {
      if (err) reject("Error while opening" + err.message)
      else {
        console.log(path + " file opened");
        resolve(true)
      }
    })
  })
}

module.exports.all = function(sql, values) {
  return new Promise((resolve, reject) => {
    this.db.all(sql, values, (err, rows) => {
      if (err) reject("All failed: " + err.message)
      else {
        resolve(rows)
      }
    })
  })
}

module.exports.run = function(sql, values) {
  return new Promise((resolve, reject) => {
    this.db.run(sql, values, (err) => {
      if (err) {
        reject(err)
      }
      else {
        resolve(`Run operation with values ${values} : succeeded`)
      }
    })
  })
}

module.exports.domains = {
  insertInto: (domain_name, blacklistBool, agencyBool) => {
    const sql = `INSERT INTO domains
    (domain_name, blacklist, agency)
    VALUES (?,?,?)
    `
    return module.exports.run(sql, [domain_name, blacklistBool, agencyBool])
  },
  exists: async (domain_name) => {
    const sql = `SELECT EXISTS(SELECT 1 FROM domains WHERE domain_name="${domain_name}")`
    const answer = await module.exports.all(sql)
    const bool = Object.values(answer[0])[0]
    return bool
  },
  getId: async (domain_name) => {
    const sql = `SELECT id FROM domains WHERE domain_name="${domain_name}"`
    const answer = await module.exports.all(sql)
    const { id } = answer[0]
    return id
  }
}

module.exports.agencies = {
  insertInto: (name) => {
    const sql = `
    INSERT INTO agencies
    (name)
    VALUES (?)
    `
    return module.exports.run(sql, [name])
  },
  exists: async (name) => {
    const sql = `SELECT EXISTS(SELECT 1 FROM agencies WHERE name="${name}")`
    const answer = await module.exports.all(sql)
    const bool = Object.values(answer[0])[0]
    return bool
  },
  getId: async (name) => {
    const sql = `SELECT id FROM agencies WHERE name="${name}"`
    const answer = await module.exports.all(sql)
    const { id } = answer[0]
    return id
  }
}

module.exports.agencies_domains = {
  insertInto: (domain_id, agency_id, price) => {
    const sql = `
    INSERT INTO agencies_domains
    (domain_id, agency_id, price)
    VALUES (?,?,?)
    `
    return module.exports.run(sql, [domain_id, agency_id, price])
  }
}

module.exports.keywords = {
  insertInto: (kw) => {
    const sql = `
    INSERT INTO keywords
    (keyword)
    VALUES (?)
    `
    return module.exports.run(sql, [kw])
  },
  exists: async (name) => {
    const sql = `SELECT EXISTS(SELECT 1 FROM keywords WHERE keyword="${name}")`
    const answer = await module.exports.all(sql)
    const bool = Object.values(answer[0])[0]
    return bool
  },
  getId: async (name) => {
    const sql = `SELECT id FROM keywords WHERE keyword="${name}"`
    const answer = await module.exports.all(sql)
    const { id } = answer[0]
    return id
  }
}

module.exports.domain_keywords = {
  insertInto: (domain_id, keyword_id, occurences) => {
    const sql = `
    INSERT INTO domain_keywords
    (domain_id, keyword_id, occurences)
    VALUES (?,?,?)
    `
    return module.exports.run(sql, [domain_id, keyword_id, occurences])
  }
}

module.exports.tags = {
  insertInto: (tag) => {
    const sql = `
    INSERT INTO tags
    (tag)
    VALUES (?)
    `
    return module.exports.run(sql, [tag])
  },
  exists: async (tag) => {
    const sql = `SELECT EXISTS(SELECT 1 FROM tags WHERE tag="${tag}")`
    const answer = await module.exports.all(sql)
    const bool = Object.values(answer[0])[0]
    return bool
  },
  getId: async (name) => {
    const sql = `SELECT id FROM tags WHERE tag="${name}"`
    const answer = await module.exports.all(sql)
    const { id } = answer[0]
    return id
  }
}

module.exports.domain_tags = {
  insertInto: (domain_id, tag_id) => {
    const sql = `
    INSERT INTO domain_tags
    (domain_id, tag_id)
    VALUES (?,?)
    `
    return module.exports.run(sql, [domain_id, tag_id])
  }
}

module.exports.close = function() {
  return new Promise((resolve, reject) => {
    this.db.close(err => {
      if (err) reject("Close failed: " + err.message)
      else {
        console.log("Connection with db closed")
        resolve(true)
      }
    })
  })
}
