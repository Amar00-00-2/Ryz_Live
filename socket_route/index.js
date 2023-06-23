module.exports = (io) => {
    return {
        portFolio: require('./portfolio')(io),
        searchmarketdata: require('./search_marketdata')(io),
        watchlistmarketdata: require('./watchlist_marketdata')(io),
        dashboardmarketdata: require('./dashboard_marketdata')(io),
        optionalchainmarketdata: require('./optionalchain_marketdata')(io),
	    commonmarketdata: require("./common_market_data")(io),
        ohlc_marketdata: require('./ohlc_marketdata')(io),
        authSocket: require('./auth.socket')(io),
        scannerSocket: require('./scanner_marketdata')(io),
        chartSocket:require('./chartsocket')(io),
        // indicesMarketSocket: require('./indices_market_data.socket')(io)
        hdfcSocket: require('./hdfc_callback_data')(io),
        notificationSocket: require('./notification_socket')(io)
        // order_interactive: require('./order_notify_interactive')(io)
    }
}
