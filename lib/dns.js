const axios = require('axios')
const cheerio = require('cheerio')
const querystring = require('querystring')
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')

const BASE_URL = 'https://njal.la'
const GET_NJALLA_URL = (path) => `${BASE_URL}${path}`
const GET_NJALLA_DOMAIN_URL = (domain) => `${GET_NJALLA_URL('/domains/')}${domain}/`

let HTTP
let COOKIE_JAR
let CACHED_RECORDS

//
// PRIVATE API
//

const post = async (path, data) => {
    return HTTP.post(path, querystring.stringify(data), {
        headers: { 'Referer': path },
        withCredentials: true
    })
}

const get = async (path) => {
    return HTTP.get(path, {
        withCredentials: true
    })
}

const error = (msg) => { throw new Error(msg || 'A fatal error occured') }

const initialize = async () => {
    // Reset cookie jar
    COOKIE_JAR = new tough.CookieJar()
    HTTP = axios.create({})
    axiosCookieJarSupport(HTTP)
    HTTP.defaults.jar = COOKIE_JAR
    CACHED_RECORDS = undefined

    // Reset first login CSRF
    try {
        const response = await get(GET_NJALLA_URL('/signin/'))
        const $ = cheerio.load(response.data)
        return $('input[name=csrfmiddlewaretoken]').val()
    } catch (e) {
        error(`Unable to retrieve CSRF tokens from njalla: ${e.status} - ${e}`)
    }
}

const findCookie = (path, key) => {
    return new Promise((ok, ko) => {
        COOKIE_JAR.getCookies(path, (e, cookies) => {
            if (e) return ko(e)
            return ok(cookies.find((cookie) => cookie.key === key))
        })
    })
}

const getActionUpdateRecords = (records) => {
    const update = {}
    records.forEach((record) => {
        update[record.id] = record
    })
    return update 
}

const getRecords = async (domain, cached) => {
    if (cached && CACHED_RECORDS)
        return CACHED_RECORDS
    await findCookie(BASE_URL, 'csrftoken') || error('Not connected')
    const response = await get(GET_NJALLA_DOMAIN_URL(domain))
    const matched = response.data.match(/(?<=(var records = ))\[[^;\n]+/gm)
    if (!matched.length)
        return []
    CACHED_RECORDS = JSON.parse(matched)
    return CACHED_RECORDS
}

//
// PUBLIC API
//

exports.login = async (email, password) => {

    const csrfmiddlewaretoken = await initialize()

    try {
        await post(GET_NJALLA_URL('/signin/'), {
            csrfmiddlewaretoken,
            email,
            password
        })
    } catch(e) {
        error(`Unable to login -  ${e.status} - ${e}`)
    }
}

exports.getDomains = async () => {
    await findCookie(BASE_URL, 'csrftoken') || error('Not connected')
    const response = await get(GET_NJALLA_URL('/domains'))
    const $ = cheerio.load(response.data)
    return $('.table tbody td:first-child').toArray().map(e => e.firstChild.data)
}

exports.getRecords = async (domain) => getRecords(domain)

exports.add = async (domain, type, name, content, ttl) => {
    ttl = ttl || 10800
    const cookie = await findCookie(BASE_URL, 'csrftoken') || error('Not connected')
    await post(GET_NJALLA_DOMAIN_URL(domain), {
        action: 'add',
        csrfmiddlewaretoken: cookie.value,
        type,
        name,
        ttl,
        content
    })
    CACHED_RECORDS = undefined
}

exports.remove = async (domain, { id }) => {
    const records = await getRecords(domain, true)
    const updated = records.filter((r) => {
        return r.id !== id
    })

    if (updated.length === records.length)
        error(`Unable to find record ${id}`)
    
    const cookie = await findCookie(BASE_URL, 'csrftoken') || error('Not connected')

    await post(GET_NJALLA_DOMAIN_URL(domain), {
        action: 'update',
        csrfmiddlewaretoken: cookie.value,
        records: JSON.stringify(getActionUpdateRecords(updated))
    })
    CACHED_RECORDS = undefined
}

exports.update = async (domain, { id }, { name, content, ttl } = {}) => {
    const records = await getRecords(domain, true)
    const record = records.find((r) => {
        return r.id === id
    }) || error(`Unable to find record ${id}`)

    await this.remove(domain, { id })
    await this.add(domain,
        record.type,
        name || record.name,
        content || record.content,
        ttl || record.ttl
    )
}
