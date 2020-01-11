# node-njalla-api

Manipulate your njalla domains programmatically.

```javascript
const { login, getDomains, add } = require('njalla-dns')

;(async function main() {
    // You have to call login once before using other methods
    // - initializes cookies needed to manipulate your domain -
    await login('my_super_email@gmail.com', 'creazy_password')
    
    // Get domains for the connected accounts
    const domains = await getDomains() // [ 'romualdr.io' ]

    // Add an entry
    await add(domains[0], 'A', 'www', '192.168.10.0', 3600)
})()
```

## Installation

`npm -i njalla-dns`


## Features

- Easy to use
- Promises
- Get domains
- Get records
- Add record
- Update record
- Remove record

## Documentation

### login(username, password)

Initialize the connection with njalla and store cookies needed to manipulate records.

| parameter | type | description | example |
|-----------|------|-------------|---------|
| `username` | string | Email or username used to login in njalla (string) | `'romualdr@github.com'` | 
| `password` | string | Password used to login in njalla (string) | `'mysupersecretpassword'` | 

```javascript
const { login } = require('njalla-dns')

;(async function main() {
    // You have to call login once before using other methods
    // - initializes cookies needed to manipulate your domain -
    await login('my_super_email@gmail.com', 'creazy_password')
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<void>` |  |
| throws `Error('Unable to login')` | Incorrect credentials |

### getDomains()

Retrieves domains attached to the connected account

```javascript
const { login, getDomains } = require('njalla-dns')

;(async function main() {
    // ... login ...
    
    // Get domains
    const domains = await getDomains() // [ 'mydomain.io' ]
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<string[]>` | An array of string containing your domains |
| throws `Error('Not connected')` | You didn't use `login` before using this method |
| throws `AxiosError()` | Underlying HTTP error |

### getRecords(domain)

| parameter | type | description | example |
|-----------|------|-------------|---------|
| `domain` | string | Domains for which you want to retrieve records | `'mydomain.io'` | 

```javascript
const { login, getRecords } = require('njalla-dns')

;(async function main() {
    // ... login ...
    
    const records = await getRecords('mydomain.io') // [ { type: 'A', content: '192.168.0.1', ttl: 3600, name: 'www' } ]
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<Object[]>` | An array of records |
| throws `Error('Not connected')` | You didn't use `login` before using this method |
| throws `AxiosError()` | Underlying HTTP error |

### add(domain, type, name, content [, ttl])


| parameter | type | description | example |
|-----------|------|-------------|---------|
| `domain` | string | the domain you want to add a record on | `'mydomain.io'` |
| `type` | string | Record type | `'A'`, `'AAA'`, `'MX'`, `'TXT'`, `'CNAME'`, ... |
| `name` | string | Record name | `'www'` |
| `content` | string | Record content as string | `'192.168.1.1'` |
| `ttl` | optional, number | Time to live (default: `3600`) | `10800` |


```javascript
const { login, add } = require('njalla-dns')

;(async function main() {
    // ... login ...
    
    // ttl is optional (defaults to 10800)
    await add('mydomain.io', 'A', 'www', '192.168.10.0', 3600)
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<void>` |  |
| throws `Error('Not connected')` | You didn't use `login` before using this method |
| throws `AxiosError()` | Underlying HTTP error |

### remove(domain, record)


| parameter | type | description | example |
|-----------|------|-------------|---------|
| `domain` | string | the domain you want to add a record on | `'mydomain.io'` |
| `record` | object | Record retrieved from `getRecords(domain)` you want to remove | `{ id: 150, name: 'www', type: 'A' }` |


```javascript
const { login, getRecords, remove } = require('njalla-dns')

;(async function main() {
    // ... login ...

    // get records for domains
    const records = await getRecords('mydomain.io')

    // Remove first record
    await remove('mydomain.io', records[0])

    // Remove the www record
    await remove(domains[0], records.find((r) => r.name === 'www'))
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<void>` |  |
| throws `Error('Not connected')` | You didn't use `login` before using this method |
| throws `Error('Unable to find record [id]')` | You should give a record you retrieved from `getRecords()` |
| throws `AxiosError()` | Underlying HTTP error |

### update(domain, record, update)


| parameter | type | description | example |
|-----------|------|-------------|---------|
| `domain` | string | the domain you want to add a record on | `'mydomain.io'` |
| `record` | object | Record retrieved from `getRecords(domain)` you want to update | `{ id: 150, name: 'www', type: 'A' }` |
| `update` | object | Update object | `{ name: 'njalla' }` |
| `update.name` | optional, string | Update the name of the record | `{ name: 'njalla' }` |
| `update.content` | optional, string | Update the content of the record | `{ content: '192.168.0.199' }` |
| `update.ttl` | optional, number | Update the ttl of the record | `{ ttl: 3600 }` |

```javascript
const { login, getRecords, update } = require('njalla-dns')

;(async function main() {
    // ... login ...

    // get records for domains
    const records = await getRecords('mydomain.io')

    // Update the www record
    await update('mydomain.io', records.find((r) => r.name === 'www'), { content: '192.168.10.999' })
})()
```

| signature | description |
|-----------|-------------|
| returns `Promise<void>` |  |
| throws `Error('Not connected')` | You didn't use `login` before using this method |
| throws `Error('Unable to find record [id]')` | You should give a record you retrieved from `getRecords()` |
| throws `AxiosError()` | Underlying HTTP error |

## Motivations

I needed this to make another project - which will be available soon on GitHub aswell.