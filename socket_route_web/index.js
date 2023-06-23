module.exports = (io) => {
    return {
        watchlistLayout: require('./watchlist_layout')(io),
        watchlistTable: require('./watchlist_table')(io),
        indicelist: require('./indice_list')(io),
        dashboard_socket: require('./dashboard_socket')(io),
        qr_socket: require('./qr_scoket')(io)

    }
}
