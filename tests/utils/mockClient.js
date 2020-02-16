const fs = require('fs')
const path = require('path')
const util = require('util')

const readFile = util.promisify(fs.readFile)

const MOCKS = []
const MOCKS_FILES = {}
const METHODS = { GET: 'GET', POST: 'POST' }

const toMockObject = (path, data, method) => {
    return { path, data, method }
}

const findMock = (path, method) => {
    return MOCKS.find(m => m.path === path && m.method === method)
}

const getMockData = async (filename) => {
    let data = MOCKS_FILES[filename]
    if (data)
        return data
    data = await readFile(path.resolve(__dirname, `../mocks/${filename}`))
    data = data.toString()
    MOCKS_FILES[filename] = data
    return data 
}

const addMock = async (path, filename, method) => {
    let mock = findMock(path, method)
    let data = await getMockData(filename)
    if (!mock) {
        mock = toMockObject(path, data, method)
        MOCKS.push(mock)
    } else {
        mock.data = data
    }
}

const MockNotFound = (message) => {
    throw Error(`[MockNotFound] ${message}`)
}

const BASE_URL = 'https://njal.la'
const GET_NJALLA_URL = (path) => `${BASE_URL}${path}`
const GET_NJALLA_DOMAIN_URL = (domain) => `${GET_NJALLA_URL('/domains/')}${domain}/`

const mock = {
    addMock: (path, filename, method = METHODS.GET) => addMock(path, filename, method),
    GET_NJALLA_URL: GET_NJALLA_URL,
    GET_NJALLA_DOMAIN_URL: GET_NJALLA_DOMAIN_URL
}

const client = {
    get(path) {
        const mock = findMock(path, METHODS.GET) || MockNotFound(`Path ${path} not found in mocks`)
        return { data: mock.data }
    },
    post(path, data) {
        return ''
    },
    findCookie(url, cookie) {
        return cookie
    },
    _create() {
        console.log('Running mocked client')
        return this
    }
}

module.exports = {
    ...mock,
    ...client
}
