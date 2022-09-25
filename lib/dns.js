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

const handleCallResult = (res) => {
    if (!res.data.error && res.data.result)
        return res.data.result
    if (res.data.error.code === 403)
        throw new Error('Invalid credentials. Please check your API key.')
    throw new Error(`An error occured: ${res.data.error.message}`)
}

const call = (client, method, params) => client.post('/', { method, params }).then(handleCallResult)

const findRecords = async (client, domain, query) => {
    // If the query has an ID - it's safe to say that the ID should be used - else take the name or query
    findMe = query.id ?? query.name ?? query
    return (await getRecords(client)(domain)).filter((r) => r.id === findMe || r.name === findMe)
}


/**
 * Public API
 */
const getDomains = (client) => async () => {
    const { domains } = await call(client, methods.LIST_DOMAINS)
    return domains
}

const getDomain = (client) => async (domainOrName) => {
    const domains = await (getDomains(client)())
    return domains.find((d) => d.name === (domainOrName.name || domainOrName)) || error(`Domain ${domainOrName.name || domainOrName} not found.`)
}

const getRecords = (client) => async (domainOrName) => {
    const domain = await (getDomain(client)(domainOrName))
    const { records } = await call(client, methods.GET_RECORDS, { domain: domain.name })
    return records
}

const add = (client) => async (domainOrName, type, name, content, ttl = 10800) => {
    const domain = await (getDomain(client)(domainOrName))
    await call(client, methods.ADD_RECORD, {
        domain: domain.name,
        type,
        name,
        content,
        ttl
    })
    return getRecords(client)(domain)
}

const remove = (client) => async (domainOrName, query) => {
    const domain = await (getDomain(client)(domainOrName))
    const toRemove = await findRecords(client, domain, query)
    if (!toRemove.length)
        return error(`No records matched the requested record.`)
    await Promise.all(toRemove.map((r) => call(client, methods.REMOVE_RECORD, { domain: domain.name, id: r.id })))
    return getRecords(client)(domainOrName)
}

const update = (client) => async (domainOrName, query, update) => {
    const domain = await (getDomain(client)(domainOrName))
    const records = await findRecords(client, domain, query)

    if (!records.length || records.length > 1)
        error(`${records.length > 1 ? 'Too many' : 'No'} record(s) found for this query. Please provide a more precise query`)

    const record = records[0]

    await call(client, methods.EDIT_RECORD, {
        domain: domain.name,
        id: record.id,
        content: update.content || record.content
    })
    return getRecords(client)(domain)
}


module.exports = (key, api = 'https://njal.la/api/1', client = httpClient(api, key)) => {
    return {
        getDomains: getDomains(client),
        getDomain: getDomain(client),
        getRecords: getRecords(client),
        add: add(client),
        remove: remove(client),
        update: update(client)
    }
}
