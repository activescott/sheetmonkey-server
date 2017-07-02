

- [+] Update URL paths so that service endpoints are clearly separate from content pages
  - Routes:
    - /api/ - API 
    - /     - content
- [ ] Setup client app:
  - [+] [svelt](https://svelte.technology/guide) + 
  - [+] roundtrip jwt in a test call
  - [ ] [redux](http://redux.js.org/docs/introduction/CoreConcepts.html)
- [ ] Setup developer login via SS
  - [x] store developer tokens & user id in DynamoDB
  - [x] fix: add user is creating a new user, not updating existing (createdAt==updatedAt!)
  - [x] fix: expires_at not set in DDB
  
  - [x] fix: add user is overwriting ALL attributes of an existing user rather than just updating existing attributes (createdAt is missing!)
    - [x] Use `ConditionExpression: 'attribute_not_exists(id)'`, and an error occurs if it exists. Then update it instead (in the app layer, not DB).
   
  - [ ] show user info on content pages
  - [ ] Refresh token automatically in SmartsheetApi.
  
  - [ ] Separate out oauth & user login/logout stuff into a boiler plate serverless+svelt.
    - [ ] Remove vandium and validate tokens in api calls manually (consider just allowing cookie auth!)
      - [ ] replace with simple vandium style authorizer or an APIG authorizer.
    - [ ] StaticFileHandler into its own package?
    - [ ] Standard lint
    - [x] Need mocha tests for server.

- [ ] Need mocha tests for client.
- [ ] UI to CRUD clients + secrets
  - [ ] via DynamoDB
- [ ] add favico
- [ ] Enable redirect flow to extension for clients.
  - [ ] redirect endpoint.
  - [ ] fail if unknown client id
  - [ ] get code=>tokens, store tokens, redirect token to extension.
- [ ] Setup cloudfront:
  - [ ] Add cache-control headers to the content served (maybe aggressively cached css, images, but not cached html & js)
  - [ ] cloudfront setup in aws.
  - [ ] how to keep agig from creating a new API??
- [ ] Can content page paths be added to serverless.yml via a script (based on all files in a dir)? How about with an import?
npm 
- [ ] Break out the StaticFileHandler, JwtHandler, and necessary parts of vandium to provide a boilerplate/starter for a serverless web app backend.

- [ ] Consider using https://github.com/laardee/serverless-authentication-boilerplate as a base layer for OAuth rather than the custom stuff here :/ Wish I would have found that before I wrote the OAuth stuff here.