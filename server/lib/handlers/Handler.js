'use strict';

class Handler {
    /**
     * Returns the specified object as a JSON response properly formatted for lambda.
     * @param {*any} jsonBody 
     */
    responseAsJson(jsonBody) {
        let response = {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: jsonBody
        };
        return response;
    }
}

module.exports = Handler;