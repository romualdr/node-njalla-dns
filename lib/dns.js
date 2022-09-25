const httpClient = require('./httpClient')

/**
 * Private
 */
const methods = {
    LIST_DOMAINS: 'list-domains',
    GET_RECORDS: 'list-records',
    ADD_RECORD: 'add-record',
    REMOVE_RECORD: 'remove-record',
    EDIT_RECORD: 'edit-record'
}
const error = (msg) => { throw new Error(msg || 'A fatal error occured') }

async function _getDomain(domainOrName) {
    if (!this.domains)
        await this.getDomains()
    return this.domains.find((d) => d === domainOrName.name || domainOrName) || error(`Domain ${domainOrName.name || domainOrName} not found.`)
}

async function _findRecords(domain, query) {
    // If the query has an ID - it's safe to say that the ID should be used - else take the name or query
    findMe = query.id ?? query.name ?? query
    return (await this.getRecords(domain)).filter((r) => r.id === findMe || r.name === findMe)
}

function _handleCallResult(res) {
    if (!res.data.error && res.data.result)
        return res.data.result
    if (res.data.error.code === 403)
        throw new Error('Invalid credentials. Please check your API key.')
    throw new Error(`An error occured: ${res.data.error.message}`)
}

/**
 * Public
 */
async function getDomains() {
    const result = await this.call(methods.LIST_DOMAINS)
    this.domains = [].concat(result.domains)
    return result.domains
}

async function getRecords(domainOrName) {
    const domain = await _getDomain.call(this, domainOrName)
    const result = await this.call(methods.GET_RECORDS, { domain: domain.name })
    return result.records
}

async function add(domainOrName, type, name, content, ttl = 10800) {
    const domain = await _getDomain.call(this, domainOrName)
    await this.call(methods.ADD_RECORD, {
        domain: domain.name,
        type,
        name,
        content,
        ttl
    })
    return this.getRecords(domain)
}

async function remove(domainOrName, query) {
    const domain = await _getDomain.call(this, domainOrName)
    const toRemove = await _findRecords.call(this, domain, query)
    if (!toRemove.length)
        return error(`No records matched the requested record.`)
    await Promise.all(toRemove.map((r) => this.call(methods.REMOVE_RECORD, { domain: domain.name, id: r.id })))
    return this.getRecords(domainOrName)
}

async function update(domainOrName, query, update) {
    const domain = await _getDomain.call(this, domainOrName)
    const records = await _findRecords.call(this, domain, query)

    if (!records.length || records.length > 1)
        error(`${records.length > 1 ? 'Too many' : 'No'} record(s) found for this query. Please provide a more precise query`)

    const record = records[0]

    await this.call(methods.EDIT_RECORD, {
        domain: domain.name,
        id: record.id,
        content: update.content || record.content
    })
    return this.getRecords(domain)
}

module.exports = (key, api = 'https://njal.la/api/1', client = httpClient(api, key)) => {
    const call = (method, params) => client.post('/', { method, params }).then(_handleCallResult)

    return {
        call,
        getDomains,
        getRecords,
        add,
        remove,
        update
    }
}