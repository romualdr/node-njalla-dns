const vm = require('vm')
const fs = require('fs')
const util = require('util')
const cheerio = require('cheerio')
const httpClient = require('./httpClient')
const writeFileAsync = util.promisify(fs.writeFile)

const ERRORS_LOG_FILENAME = 'njalla-failed-records.html'
const BASE_URL = 'https://njal.la'
const GET_NJALLA_URL = (path) => `${BASE_URL}${path}`
const GET_NJALLA_DOMAIN_URL = (domain) => `${GET_NJALLA_URL('/domains/')}${domain}/`
let HTTP

//
// PUBLIC API
//

// Allow to customize http client factory
exports._httpClient = httpClient

exports.login = async (email, password) => {

    const csrfmiddlewaretoken = await initialize()

    try {
        await HTTP.post(GET_NJALLA_URL('/signin/'), {
            csrfmiddlewaretoken,
            email,
            password
        })
    } catch(e) {
        error(`Unable to login -  ${e.status} - ${e}`)
    }
}

exports.getDomains = async () => {
    await HTTP.findCookie(BASE_URL, 'csrftoken') || error('Not connected')
    const response = await HTTP.get(GET_NJALLA_URL('/domains'))
    const $ = cheerio.load(response.data)
    return $('.table tbody td:first-child').toArray().map(e => e.firstChild.data)
}

exports.getRecords = async (domain) => getRecords(domain)

exports.add = async (domain, type, name, content, ttl) => {
    ttl = ttl || 10800
    const cookie = await HTTP.findCookie(BASE_URL, 'csrftoken') || error('Not connected')
    await HTTP.post(GET_NJALLA_DOMAIN_URL(domain), {
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
    
    const cookie = await HTTP.findCookie(BASE_URL, 'csrftoken') || error('Not connected')

    await HTTP.post(GET_NJALLA_DOMAIN_URL(domain), {
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

//
// PRIVATE API
//

const error = (msg) => { throw new Error(msg || 'A fatal error occured') }

const initialize = async () => {
    // Reset cookie jar
    HTTP = exports._httpClient._create()

    // Reset first login CSRF
    try {
        const response = await HTTP.get(GET_NJALLA_URL('/signin/'))
        const $ = cheerio.load(response.data)
        return $('input[name=csrfmiddlewaretoken]').val()
    } catch (e) {
        error(`Unable to retrieve CSRF tokens from njalla: ${e.status} - ${e}`)
    }
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
    await HTTP.findCookie(BASE_URL, 'csrftoken') || error('Not connected')
    const response = await HTTP.get(GET_NJALLA_DOMAIN_URL(domain))
    const scriptTags = cheerio.load(response.data)(`script:contains('var records =')`)

    let records = []
    let errored = false

    const rawScripts = scriptTags.get().map(el => el.children[0].data)
    for (let script of rawScripts) {
        // Find record line and replace problematic tokens for JSON parsing
        let rawRecords = script
            .split('\n')
            .find(str => str.includes('var records ='))
            .replace(/(^[ ]*var records =)|(;[ ]*$)/g, "")
            .replace(/\\/g, "\\\\")

        try {
            const parsedRecords = JSON.parse(rawRecords)
            if (Array.isArray(parsedRecords))
                records = records.concat(parsedRecords)
        } catch (e) {
            errored = true
        }
    }

    if (!records.length && errored) {
        await writeFileAsync(ERRORS_LOG_FILENAME, response.data)
        error(`Unable to parse DNS records.
A copy of the HTML has been saved to \`${ERRORS_LOG_FILENAME}\`.
You can use this to debug, or to report an error to the library maintainer
(first remove sensitive data if any).`);
    }

    if (!records.length)
        return []
    CACHED_RECORDS = records
    return CACHED_RECORDS
}
