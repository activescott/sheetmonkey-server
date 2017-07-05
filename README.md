# SheetMonkey Server

**SheetMonkey Server** allows developers to register SheetMonkey plugins for Smartsheet so that they are discoverable and easily installable with the [SheetMonkey Extension](https://github.com/activescott/sheetmonkey). 

**Status**: Early days yet so this isn't really working beyond implementing login for developers (via OAuth with Smartsheet). The next milestone will enable developers to register plugins and make the plugins discoverable and installable in the [SheetMonkey Extension](https://github.com/activescott/sheetmonkey). Eventually, the goal is to enable plugins to be developed that can access the Smartsheet API for the current Sheet, Sight, or Report and those plugins will not require a backend. See [the Roadmap](https://github.com/activescott/sheetmonkey-server/milestones) for what's planned.

**Disclaimer**: This project is not endorsed, certified, or supported by Smartsheet. This is merely an experiment I'm playing around with on my own time.

# Usage 
Visit [beta.sheetmonkey.com](https://beta.sheetmonkey.com) for the beta environment. YMMV.

# Build & Deployment
The project consists of a server (`server/`) and client (`client/`). The server is entirely built with [Serverless](https://github.com/serverless/serverless) on AWS Lambda, Amazon API Gateway, and AWS DynamoDB. The client is built with [Svelte](https://svelte.technology) & [Redux](http://redux.js.org). ES6 JavaScript is used as much as possible in both server and client.

## Client
Build the client with `npm build` or `client/build.sh`. It will be bundled and deployed to `client/dist/`. Currently I am debugging by running `npm run watch` or `client/dev.sh` and then simply opening `client/dist/index.html` locally in the browser. Need to upgrade to [LiveReload](http://livereload.com).

## Server
You don't need to build the server locally, but you can run mocha tests with `npm test` or `npm run watch`. To deploy to AWS and run `deploy.sh` or `npm deploy` and [Serverless](https://github.com/serverless/serverless) will do the rest.
