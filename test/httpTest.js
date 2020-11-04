
// const assert = require('assert');
const request = require('supertest');
const app = require('../index');
const { verifyTree } = require('../test/treeTest');

const dummyCredentials = {
    "companyName": "Cyclone Aviation",
    "email": "person@domain.com",
    "password": "password"
};

const managerCredentials = {
    "companyName": "Cyclone Aviation",
    "email": "Miquel_Pineda@cycloneaviation.com",
    "password": "pinedami"
};

const nonManagerCredentials = {
    "companyName": "Cyclone Aviation",
    "email": "Gary_Luna@cycloneaviation.com",
    "password": "lunaga"
};

let tokenManager, tokenNonManager; 

describe('Manager: authentication and tree generation sequence working as intended', () => {
    
    it('responds with JWT token', (done) => {
        request(app)
            .post('/auth/login')
            .send(managerCredentials)
            .set('Accept', 'application/json')
            .expect((res) => {
                if (!('auth-token' in res.headers)) throw new Error('Missing auth token header');
                if (typeof (res.headers["auth-token"]) !== "string") throw new Error('Token format is incorrect');
                tokenManager = res.headers["auth-token"];
            })
            .expect(200, done);
    });
    it('authenticated user can access tree data', (done) => {
        request(app)
            .get('/employees/tree')
            .set({ 'auth-token': tokenManager, Accept: 'application/json' })
            .expect((res) => {
                if (!(typeof (res.body) == "object")) throw new Error('Tree request returns data with incorrect format');
                if ((res.body.length !== 1)) throw new Error('Data is incomplete or incorrectly formated');
                if (!(verifyTree(res.body[0]))) throw new Error('Tree is poorly constructed');
            })
            .expect(200, done);
    });
    it('authenticated user can access flat data', (done) => {
        request(app)
            .get('/employees/flat')
            .set({ 'auth-token': tokenManager, Accept: 'application/json' })
            .expect((res) => {
                if (!(typeof (res.body) == "object")) throw new Error('Flat list request returns data with incorrect format');
                if (!(res.body.length > 0)) throw new Error('Data is incomplete or incorrectly formated');
            })
            .expect(200, done);
    });
});

describe('Non-manager: authentication and tree generation sequence working as intended', () => {
    it('responds with JWT token', (done) => {
        request(app)
            .post('/auth/login')
            .send(nonManagerCredentials)
            .set('Accept', 'application/json')
            .expect((res) => {
                if (!('auth-token' in res.headers)) throw new Error('Missing auth token header');
                if (typeof (res.headers["auth-token"]) !== "string") throw new Error('Token format is incorrect');
                tokenNonManager = res.headers["auth-token"];
            })
            .expect(200, done);
    });
    it('authenticated user can access tree data', (done) => {
        request(app)
            .get('/employees/tree')
            .set({ 'auth-token': tokenNonManager, Accept: 'application/json' })
            .expect((res) => {
                if (!(typeof (res.body) == "object")) throw new Error('Tree request returns data with incorrect format');
                if ((res.body.length !== 1)) throw new Error('Data is incomplete or incorrectly formated');
                if (!(verifyTree(res.body[0]))) throw new Error('Tree is poorly constructed');
            })
            .expect(200, done);
    });
    it('authenticated user can access flat data', (done) => {
        request(app)
            .get('/employees/flat')
            .set({ 'auth-token': tokenNonManager, Accept: 'application/json' })
            .expect((res) => {
                if (!(typeof (res.body) == "object")) throw new Error('Flat list request returns data with incorrect format');
                if (!(res.body.length > 0)) throw new Error('Data is incomplete or incorrectly formated');
            })
            .expect(200, done);
    });
})

describe('Invalid user is rejected', () => {
    it('authentication does not assign JWT', function (done) {
        request(app)
            .post('/auth/login')
            .send(dummyCredentials)
            .set('Accept', 'application/json')
            .expect(401, done);
    });
});
