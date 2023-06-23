// Datafeed implementation, will be added later
import Datafeed from './datafeed.js';

// console.log(Datafeed)
// window.tvWidget = new TradingView.widget({
// 	// symbol: 'Bitfinex:BTC/USD', // default symbol
// 	// debug: true,

// 	symbol: sym, // default symbol
// 	interval: '1', // default interval
// 	fullscreen: true, // displays the chart in the fullscreen mode
// 	timezone: "Asia/Kolkata",
// 	container: 'tv_chart_container',
// 	datafeed: Datafeed,
// 	library_path: '../charting_library_clonned_data/charting_library/',
// });


window.tvWidget = new TradingView.widget({
    symbol: sym,            // Default symbol pair
    interval: '1',                        // Default interval
    fullscreen: true,   
	timezone: "Asia/Kolkata",                   // Displays the chart in the fullscreen mode
    container: 'tv_chart_container',       // Reference to the attribute of the DOM element
    datafeed: Datafeed,
    library_path: '../charting_library_clonned_data/charting_library/',
});