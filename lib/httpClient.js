const axios = require('axios')
const querystring = require('querystring')
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')

exports._create = () => {

    const _module = {}
    
    // Initialize client
    const COOKIE_JAR = new tough.CookieJar()
    const HTTP = axios.create({})
    axiosCookieJarSupport(HTTP)
    HTTP.defaults.jar = COOKIE_JAR

    _module.post = async (path, data) => {
        return HTTP.post(path, querystring.stringify(data), {
            headers: { 'Referer': path },
            withCredentials: true
        })
    }

    _module.get = async (path) => {
        return HTTP.get(path, {
            withCredentials: true
        })
    }

    _module.findCookie = (path, key) => {
        return new Promise((ok, ko) => {
            COOKIE_JAR.getCookies(path, (e, cookies) => {
                if (e) return ko(e)
                return ok(cookies.find((cookie) => cookie.key === key))
            })
        })
    }
    
    return _module
}
