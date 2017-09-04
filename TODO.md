

- [+] Update URL paths so that service endpoints are clearly separate from content pages
  - Routes:
    - /api/ - API 
    - /     - content
- [x] Setup client app:
  - [+] [svelt](https://svelte.technology/guide) + 
  - [+] roundtrip jwt in a test call
  - [x] [redux](http://redux.js.org/docs/introduction/CoreConcepts.html)
- [x] Setup developer login via SS
  - [x] store developer tokens & user id in DynamoDB
  - [x] fix: add user is creating a new user, not updating existing (createdAt==updatedAt!)
  - [x] fix: expires_at not set in DDB
  
  - [x] fix: add user is overwriting ALL attributes of an existing user rather than just updating existing attributes (createdAt is missing!)
    - [x] Use `ConditionExpression: 'attribute_not_exists(id)'`, and an error occurs if it exists. Then update it instead (in the app layer, not DB).
   
  - [x] show user info on content pages
    - [x] Create a "me" endpoint to see if we're authed. If authed, get profile. If not, error
      - [x] Auth via cookie+Authorization header. Client Requests can extract token from cookie and add it as an Auth header in API. 


- [x] Enable developer to register a plugin with optional API Client ID and Secret
  - [x] redux now?
  - Backend:
    - [x] Create
    - [x] Read
    - [x] Update
    - [x] Delete
  - Client Integration:
    - [x] upgrade to [LiveReload](http://livereload.com)
    - [x] Create and save plugin
    - [x] View/list plugins in a table
    - [x] Edit some values for a plugin
    - [x] Validate edit/add plugin manifest url is a valid url
    - [x] Delete plugin

  - [x] Display gallery in extension+server
    - [x] manifest changes 
      - remove id (use the url, escaped if necessary)
      - name # The name of the plugin that will be displayed in the extension's Plugins page (max 30 characters). For inspiration see https://developer.apple.com/app-store/product-page/
      - subtitle # A concise, compelling summary of the plugin to appear below the plugin's name (max 30 characters). For inspiration see https://developer.apple.com/app-store/product-page/
      - icon # A url to an image that should be used for your plugin. Relative to the manifest. Make it square, 1024px × 1024px. For inspiration, see https://developer.apple.com/ios/human-interface-guidelines/graphics/app-icon/
      - description # An informative, engaging description that highlights the features and functionality of the plugin. For inspiration see https://developer.apple.com/app-store/product-page/
    - [x] display all plugins from sheetmonkey server.
    - [x] Allow installing a plugin in gallery.
    - [x] Allow uninstalling a plugin in gallery.

  - [x] get rid of the gallery link and make the main sheetmonkey link just load the gallery
  - [x] add a loading spinner to gallery (public plugins are slow) 
  - [x] add a loading spinner to "My Plugins" page
  
  - [x] fix the slow addition of menu items in extension with DomUtil.lazyQuerySelector
   
  - [x] Provide plugins context to use w/ rest api
    - [x] container type & id on all events/upon request
      - confirm it works with a example plugin
    - [x] row id (on row or cell events)
    - [x] column id or name (on row or cell events)
  
  - [ ] Allow plugins to get SS REST API access w/ tokens without any backend.
    - [x] Provide a unique redirect URL (once client id/secret provided) to dev to register for redirect flow.
    - [x] Start flow w/ [launchWebAuthFlow](https://developer.chrome.com/extensions/identity#method-launchWebAuthFlow)
    - [x] catch token on backend and send to extension via https://developer.chrome.com/extensions/app_identity#non
      - i.e. essentially SS redirects useragent to sheetmonkey.com, which uses secret to get token, and redirects user (with token in URL) to https://<extension-id>.chromiumapp.org/<anything-here>
    - [ ] save token on behalf of plugin (so when plugin wants an API call, extension will do it (to avoid cors))
      - This implies we need to include the plugin ID (manifest url) in <anything-here> so extension knows who to route token to
      - Security note: Review attack surface. What if someone else routes a token to the wrong plugin? Do we care?
      - NOTES:
        - Tool: chrome://identity-internals/
        - Great article: https://walty8.com/simple-gmail-notes-chrome-extension/

  - [ ] Fix redirect URL after adding plugin not appearing on My Plugins page
  - [ ] Fix redirect URL to be qualified path and not relative path on My Plugins page
  - [ ] Add plugin for Sheet permalink to clipboard
  - [ ] Add plugin for Row permalink to clipboard
  - [ ] Add plugin for Cell as JSON
  - [ ] Add plugin for Col JSON
  - [ ] Add plugin for Row JSON

  - [x] add contextmenu commands
  - [ ] add keyboard shortcut commands (pass in selection details (container, row, col))
  - [ ] plugin: refresh sheet (sheetmonkey can provide such a service to use)
  
- [ ] Don't allow adding plugins with the same name (from manifest) to sheetmonkey-server (security/phishing)
- [ ] Do more validation of manifest when adding plugins (what?) to sheetmonkey-server + preview. Maybe preview is enough?

- [ ] Give sheetmonkey server some style:
  - [ ] Icon: http://game-icons.net/lorc/originals/monkey.html
  - [ ]  Color Pallet:
      - http://paletton.com/#uid=53z0B0kygSv00++2pQU++Oi++Gn
  - [ ] favicon
  
- [ ] support reviews for plugins (requires login, each user can only review once)
  - [ ] 1-5 stars
  - [ ] text

- [ ] Secure client secret detail so it isn't exposed in cloudformation and console. Like this: http://forum.serverless.com/t/storing-database-credentials-securely/1370/9?u=activescott


- [ ] Refresh token automatically in SmartsheetApi.
  - [ ] Why?

- [ ] Break out LambdaAuthorizer into its own npm package
- [ ] Separate out oauth & user login/logout stuff into a boiler plate serverless+svelt.
  - [x] Remove vandium and validate tokens in api calls manually (consider just allowing cookie auth!)
    - [x] replace with simple vandium style authorizer or an APIG authorizer.
  - [ ] Standard lint
  - [x] Need mocha tests for server.

- [ ] Need mocha tests for client.
- [ ] add favico

- [ ] Setup cloudfront:??
  - [ ] Just consider storing pages in S3 and setting custom domain. Since the APIs require manual authorization and don't use cookies, the csrf isn't that big of a risk. See references:
    - https://github.com/serverless/examples/tree/master/aws-node-single-page-app-via-cloudfront
    - http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/sample-templates-services-us-west-2.html#w2ab2c21c48c13c31 (see Amazon S3 website)
    - https://rynop.com/2017/04/20/howto-serve-angular2-app-from-s3-and-cloudfront-with-free-https/
  - [ ] Add cache-control headers to the content served (maybe aggressively cached css, images, but not cached html & js)
  - [ ] cloudfront setup in aws.
  - [ ] how to keep agig from creating a new API??
  

- [ ] Can content page paths be added to serverless.yml via a script (based on all files in a dir)? How about with an import?
npm 
- [ ] Break out the StaticFileHandler. Add https://www.iana.org/assignments/media-types/media-types.xhtml. Make sure error response type of file is flexible (provide a file path to use as a template)
- [ ] Break out LambdaAuthorizer.js. Allow error response to be specified as a templated file (or templated string?)
- [ ] provide a boilerplate/starter for a serverless web app backend.
  - [ ] Consider using https://github.com/laardee/serverless-authentication-boilerplate as a base layer for OAuth rather than the custom stuff here :/ Wish I would have found that before I wrote the OAuth stuff here.
