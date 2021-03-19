# node-njalla-dns

Manipulate your njalla domains programmatically.
Now using official nja.la API 🎉

```javascript
const njalla = require('njalla-dns')

;(async function main() {
    // Initialize your client with your API key (You can grab one at njal.la/settings/api/)
    const dns = njalla('131ecf5e2090419e8bfd94f71d612ddc')
    
    // Get domains for the connected accounts
    const domains = await dns.getDomains() // [ { name: 'romualdr.io', status: 'active', expiry: '2020-02-10T12:15:46Z' } ]

    // Add an entry
    await dns.add(domains[0], 'A', 'www', '192.168.10.0', 3600)

    // Update an entry
    await dns.update(domains[0], 'www', { 'content': '192.168.10.1' })
    
    // Remove this entry
    await dns.remove(domains[0], 'www')

    // Print all your records for a domain
    console.log(await dns.getRecords(domains[0]))
})()
```

## Getting Started

- Go to [njal.la/settings/api/](https://njal.la/settings/api/) to grab an API key
- `npm i njalla-dns`

## Features

- Easy to use
- Promises
- Get domains
- Get records
- Add record
- Update record
- Remove record

## Documentation

### njalla(key)

Initialize the connection with njalla.

| parameter | type | description | example |
|-----------|------|-------------|---------|
| `key` | string | An API key (string) | `'131ecf5e2090419e8bfd94f71d612ddc'` | 

```javascript
const njalla = require('njalla-dns')

;(async function main() {
    // Initialize your client with your API key (You can grab one at njal.la/settings/api/)
    await njalla('131ecf5e2090419e8bfd94f71d612ddc')
})()
```

| signature | description |
|-----------|-------------|
| returns an object with all methods |  |

------

### getDomains()

Retrieves domains attached to the connected account

```javascript
const njalla = require('njalla-dns')

;(async function main() {
    // initialize
    const dns = await njalla('131ecf5e2090419e8bfd94f71d612ddc')
    
    // Get domains
    const domains = await dns.getDomains() // [ { name: 'romualdr.io', status: 'active', expiry: '2020-02-10T12:15:46Z' } ]
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<domain[]>` | An array of domains |
| throws `AxiosError()` | Underlying HTTP error |

------

### getRecords(domain)

| parameter | type | description | example |
|-----------|------|-------------|---------|
| `domain` | string or object | Domains for which you want to retrieve records | `'mydomain.io' or a domain object` | 

```javascript
const njalla = require('njalla-dns')

;(async function main() {
    // initialize
    const dns = await njalla('131ecf5e2090419e8bfd94f71d612ddc')
    
    // Get domains
    const domains = await dns.getRecords('mydomain.io') // [ { type: 'A', content: '192.168.0.1', ttl: 3600, name: 'www' } ]
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<Object[]>` | An array of records |
| throws `Error('Invalid credentials. Please check your API key.')` | Invalid API key |
| throws `Error('An error occured: error.')` | njal.la error |
| throws `AxiosError()` | Underlying HTTP error |

------

### add(domain, type, name, content [, ttl])


| parameter | type | description | example |
|-----------|------|-------------|---------|
| `domain` | string | the domain you want to add a record on | `'mydomain.io'` |
| `type` | string | Record type | `'A'`, `'AAA'`, `'MX'`, `'TXT'`, `'CNAME'`, ... |
| `name` | string | Record name | `'www'` |
| `content` | string | Record content as string | `'192.168.1.1'` |
| `ttl` | optional, number | Time to live (default: `3600`) | `10800` |


```javascript
const njalla = require('njalla-dns')

;(async function main() {
    // initialize
    const dns = await njalla('131ecf5e2090419e8bfd94f71d612ddc')
    
    // ttl is optional (defaults to 10800)
    await dns.add('mydomain.io', 'A', 'www', '192.168.10.0', 3600)
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<Object[]>` | An array of records after addition |
| throws `Error('Invalid credentials. Please check your API key.')` | Invalid API key |
| throws `Error('An error occured: error.')` | njal.la error |
| throws `AxiosError()` | Underlying HTTP error |

------

### remove(domain, record)


| parameter | type | description | example |
|-----------|------|-------------|---------|
| `domain` | string | the domain you want to add a record on | `'mydomain.io'` |
| `record` | object or string | Record name or object from `getRecords(domain)` | `{ id: 150, name: 'www', type: 'A' }` |


```javascript
const njalla = require('njalla-dns')

;(async function main() {
    // initialize
    const dns = await njalla('131ecf5e2090419e8bfd94f71d612ddc')

    // Remove 'www' record
    await dns.remove('mydomain.io', 'www')

    // alternatively - you can directly use a record for getRecords
    const records = await dns.getRecords('mydomains.io')
    await dns.remove('mydomain.io', records[0])
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<Object[]>` | An array of records after removal |
| throws `Error('No records matched the requested record.')` | Record doesn't exists |
| throws `Error('Invalid credentials. Please check your API key.')` | Invalid API key |
| throws `Error('An error occured: error.')` | njal.la error |
| throws `AxiosError()` | Underlying HTTP error |

------

### update(domain, record, update)


| parameter | type | description | example |
|-----------|------|-------------|---------|
| `domain` | string | the domain you want to add a record on | `'mydomain.io'` |
| `record` | object or string | Record name or object from `getRecords(domain)` | `{ id: 150, name: 'www', type: 'A' }` |
| `update` | object | Update object | `{ content: '192.168.0.199' }` |
| `update.content` | optional, string | Update the content of the record | `'192.168.0.199'` |

```javascript
const njalla = require('njalla-dns')

;(async function main() {
    // initialize
    const dns = await njalla('131ecf5e2090419e8bfd94f71d612ddc')

    // Get records
    const records = await getRecords('mydomain.io')

    // Update record
    await update('mydomain.io', records.find((r) => r.name === 'www'), { content: '192.168.10.199' })

    // Alternatively - **please note** that this will fail if you have multiple records with the same name 
    await update('mydomain.io', 'www', { content: '192.168.10.199' })
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<Object[]>` | An array of records after update |
| throws `Error('Too many record(s) found for this query. Please provide a more precise query')` | nja.la allows multiple times the same record - we need a more precise record input |
| throws `Error('No record(s) found for this query. Please provide a more precise query')` | record not found |
| throws `Error('Invalid credentials. Please check your API key.')` | Invalid API key |
| throws `Error('An error occured: error.')` | njal.la error |
| throws `AxiosError()` | Underlying HTTP error |

## Contributing

Feel free to submit a pull request if you want to improve something.

Missing as of Mars 2021
- tests
- a lot of njal.la API functions
## Motivations

I needed this to make another project - which will be available soon on GitHub aswell.
