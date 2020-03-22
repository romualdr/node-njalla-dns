const dns = require('../../index')
const mockedClient = require('../utils/mockClient') 
const test = require('ava')

dns._httpClient = mockedClient

test('getRecords: should not find record', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('mydomain.io'), 'getRecords.simple.html')
    
    await dns.login('', '')
    const records = await dns.getRecords('mydomain.io')
    t.falsy(records.find((r) => r.name === 'no_domain'), 'Record was not found')
})

test('getRecords: should parse records without ; in result', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('mydomain.io'), 'getRecords.simple.html')
    
    await dns.login('', '')
    const records = await dns.getRecords('mydomain.io')
    t.truthy(records.find((r) => r.name === 'myrecord'), 'Record was not found')
})

test('getRecords: should parse complex records ( like DKIM with ; )', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('dkim.io'), 'getRecords.dkim.html')
    
    await dns.login('', '')
    const records = await dns.getRecords('dkim.io')
    t.truthy(records.find((r) => r.name === 'myrecord'), 'Record was not found')
})

test('getRecords: should parse DKIM records with slashes in it', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('dkim_with_slashes.io'), 'getRecords.dkim_with_slashes.html')

    await dns.login('', '')
    const records = await dns.getRecords('dkim_with_slashes.io')
    t.truthy(records.find((r) => r.name === 'myrecord'), 'Record was not found')
})

test('getRecords: should parse records with space between ; and the end of the line', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('spaces_at_the_end.io'), 'getRecords.spaces_at_the_end.html')

    await dns.login('', '')
    const records = await dns.getRecords('spaces_at_the_end.io')
    t.truthy(records.find((r) => r.name === 'myrecord'), 'Record was not found')
})

test('getRecords: should parse records without semicolon at the end', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('no_semicolon.io'), 'getRecords.no_semicolon.html')

    await dns.login('', '')
    const records = await dns.getRecords('no_semicolon.io')
    t.truthy(records.find((r) => r.name === 'myrecord'), 'Record was not found')
})

test('getRecords: should parse records without semicolon & dkim & slashes & spaces', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('dkim_slashes_no_sc_spaces.io'), 'getRecords.dkim_slashes_no_sc_spaces.html')

    await dns.login('', '')
    const records = await dns.getRecords('dkim_slashes_no_sc_spaces.io')
    t.truthy(records.find((r) => r.name === 'myrecord'), 'Record was not found')
})

test('getRecords: should parse multiple mixed scripts with simple and complex records', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('double.io'), 'getRecords.double.html')

    await dns.login('', '')
    const records = await dns.getRecords('double.io')
    t.truthy(records.find((r) => r.name === 'simple'), 'Record was not found')
    t.truthy(records.find((r) => r.name === 'complex'), 'Record was not found')
})

test('getRecords: should handle partially broken records', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('partially_broken.io'), 'getRecords.partially_broken.html')
    
    await dns.login('', '')
    const records = await dns.getRecords('partially_broken.io')
    t.truthy(records.find((r) => r.name === 'valid_record'), 'Record was not found')
})

test('getRecords: should throw error on completely broken records', async t => {
    await mockedClient.addMock(mockedClient.GET_NJALLA_URL('/signin/'), 'signin.html')
    await mockedClient.addMock(mockedClient.GET_NJALLA_DOMAIN_URL('broken.io'), 'getRecords.broken.html')
    
    await dns.login('', '')
    await t.throwsAsync(async () => {
		await dns.getRecords('broken.io')
	}, { instanceOf: Error });
})
