// const {Client, Config} = require('@adyen/api-library');
// const axios = require("axios");

// const config = new Config();
// const client = new Client({
//   config,
//   httpClient: {
//     async request(endpoint, json, config, isApiKeyRequired, requestOptions) {
//         const response = await axios({
//             method: 'POST',
//             url: endpoint,
//             data: JSON.parse(json),
//             headers: {
//                 "X-API-Key": config.apiKey,
//                 "Content-type": "application/json"
//             },
//         });

//         return response.data;
//     }
//   }
// });

// const {HttpURLConnectionClient, Client, Config} = require('@adyen/api-library');

// const config = new Config();
// const client = new Client({ config });
// const httpClient = new HttpURLConnectionClient();
// httpClient.proxy = { host: "http://google.com", port: 8888,  };

// client.setEnvironment('TEST');
// client.httpClient = httpClient;