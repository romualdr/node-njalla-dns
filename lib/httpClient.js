const axios = require('axios')

module.exports = (api, key) => axios.create({
    baseURL: api,
    timeout: 10000,
    headers: { 'Authorization': `Njalla ${key}` }
})