

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
    - [ ] Create a "me" endpoint to see if we're authed. If authed, get profile. If not, error
      - Auth via cookie+Authorization header. Client Requests can extract token from cookie and add it as an Auth header in API. 
    - [ ] Bring in redux+reducers to incorporate user's profile and auth status.
    
  - [ ] Refresh token automatically in SmartsheetApi.

- [ ] Enable developer to register a plugin with optional API Client ID and Secret: Provide a unique redirect URL.

- [ ] Enable redirect flow to extension for clients.
  - [ ] redirect endpoint.
  - [ ] fail if unknown client id
  - [ ] get code=>tokens, store tokens, redirect token to extension.
   
  - [ ] Separate out oauth & user login/logout stuff into a boiler plate serverless+svelt.
    - [x] Remove vandium and validate tokens in api calls manually (consider just allowing cookie auth!)
      - [x] replace with simple vandium style authorizer or an APIG authorizer.
    - [ ] StaticFileHandler into its own package?
    - [ ] Standard lint
    - [x] Need mocha tests for server.

- [ ] Need mocha tests for client.
- [ ] add favico

- [ ] Setup cloudfront:??
  - [ ] Just consider storing pages in S3 and setting custom domain. See references:
    - https://github.com/serverless/examples/tree/master/aws-node-single-page-app-via-cloudfront
    - http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/sample-templates-services-us-west-2.html#w2ab2c21c48c13c31 (see Amazon S3 website)
  - [ ] Add cache-control headers to the content served (maybe aggressively cached css, images, but not cached html & js)
  - [ ] cloudfront setup in aws.
  - [ ] how to keep agig from creating a new API??
  

- [ ] Can content page paths be added to serverless.yml via a script (based on all files in a dir)? How about with an import?
npm 
- [ ] Break out the StaticFileHandler, JwtHandler, and necessary parts of vandium to provide a boilerplate/starter for a serverless web app backend.

- [ ] Consider using https://github.com/laardee/serverless-authentication-boilerplate as a base layer for OAuth rather than the custom stuff here :/ Wish I would have found that before I wrote the OAuth stuff here.