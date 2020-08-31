const merge = require('webpack-merge');
const common = require('./webpack.common');

const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    plugins: [
        new BrowserSyncPlugin({
            host: 'localhost',
            port: 3000,
            server: './public'
        })
    ]
})