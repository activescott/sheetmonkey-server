

- [+] Update URL paths so that service endpoints are clearly separate from content pages
  - Routes:
    - /api/ - API 
    - /     - content
- [ ] Setup client app:
  - [ ] [svelt](https://svelte.technology/guide) + [redux](http://redux.js.org/docs/introduction/CoreConcepts.html)
  - [+] roundtrip jwt in a test call
- [ ] Need mocha tests for server.
- [ ] Setup developer login via SS
  - [ ] store developer tokens & user id in DynamoDB
  - [ ] show user info on content pages
- [ ] Need mocha tests for client.
- [ ] UI to CRUD clients + secrets
  - [ ] via DynamoDB
- [ ] Enable redirect flow to extension for clients.
  - [ ] redirect endpoint.
  - [ ] fail if unknown client id
  - [ ] get code=>tokens, store tokens, redirect token to extension.
- [ ] Setup cloudfront:
  - [ ] Add cache-control headers to the content served (maybe aggressively cached css, images, but not cached html & js)
  - [ ] cloudfront setup in aws.
  - [ ] how to keep agig from creating a new API??
- [ ] Can content page paths be added to serverless.yml via a script (based on all files in a dir)? How about with an import?

- [ ] Break out the staticFileHandler, tokenHandler, and necessary parts of vandium to provide a boilerplate/starter for a serverless web app backend.