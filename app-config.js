var config = {
    // Name of built js-file
    jsFilename : 'app.js',
    // Port to run the application on
    port: 3000,
    // Webpack dev port to run on
    devPort: 3001,
    // Url for your go server
    goServerUrl: 'https://ci.example.com',
    // Go user to use for communication with go server
    goUser: 'xxx',
    // Password for go user
    goPassword: 'xxx',
    // How often data from go should be refreshed in seconds
    goPollingInterval: 30
}
module.exports = config;
