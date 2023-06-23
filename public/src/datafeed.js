import {
	makeApiRequest,
	generateSymbol,
	parseFullSymbol,
} from './helpers.js';
import {
	subscribeOnStream,
	unsubscribeFromStream,
} from './streaming.js';


const lastBarsCache = new Map();

const configurationData = {
	supported_resolutions: ["1", "2", "3", "4", "5", "10", "15", "30", "60","120","180", "D", "W","6M"],
	// currency_codes : ['INR'],
	exchanges: [{
		value: '',
		name: '',
		desc: '',
	}
	],
	symbols_types: [{
		name: 'NSE',

		// `symbolType` argument for the `searchSymbols` method, if a user selects this symbol type
		value: 'NSE',
	},
		// ...
	],
};



export default {
	onReady: (callback) => {
		// console.log('[onReady]: Method call');
		setTimeout(() => callback(configurationData));
	},

	resolveSymbol: async (
		symbolName,
		onSymbolResolvedCallback,
		onResolveErrorCallback,
	) => {
		const exchange= es=='1'? 'NSECM':es=='2'?'NSEFO':es=='3'?"NSECD":es=='51'?"MCXFO":es
		const name = es=='1'? `${sym}-EQ`:es=='2'?`${sym}-FUT`:es=='OPT'?`${sym}-EQ`:es=='51'?`${sym}-MCX`:es
		const description = es=='1'? `NSECM:${sym}-EQ`:es=='2'?`NSEFO:${sym}-FUT`:es=='OPT'?`NSECD:${sym}-EQ`:es=='51'?`MCXFO:${sym}-MCX`:es
		const symbolInfo = {	
			ticker: name,	
			name:name,	
			description: description,	
			type: "-",	
			session: '0915-1530',	
			timezone: 'Asia/Kolkata',	
			exchange: `${exchange}`,	
			minmov: 1,	
			pricescale: 100,	
			has_intraday: true,	
			has_no_volume: false,	
			has_weekly_and_monthly: false,	
			supported_resolutions: configurationData.supported_resolutions,	
			volume_precision: 2,	
			data_status: 'streaming',	
		};

        window.setTimeout(function() {
            onSymbolResolvedCallback(symbolInfo);
         }, 0);
	}, 

	
	getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
		const { from, to, firstDataRequest } = periodParams;
		// console.log('[getBars]: Method call', periodParams,symbolInfo, resolution, from, to);
		try {

			const OHLCApiResponse = await axios.get(`/v1/marketdataapi/data/${es}/${ei}/${token}`)

			let bars = [];
	
            bars=OHLCApiResponse.data.Data
			if (OHLCApiResponse.Response && OHLCApiResponse.Response === 'Error' || bars.length === 0) {
                // "noData" should be set if there is no data in the requested period
                onHistoryCallback([], { noData: true });
                return;
            }
			bars.forEach(bar => {
                if (bar.time >= from && bar.time < to) {
                    bars = [...bars, {
                        time: bar.time,
                        low: bar.low,
                        high: bar.high,
                        open: bar.open,
                        close: bar.close,
						volume:bar.volume
                    }];
                }
            });
			// if (firstDataRequest) {
			// 	lastBarsCache.set(symbolInfo.full_name, {
			// 		...bars[bars.length - 1],
			// 	});
			// 	console.log(`[lastBarsCache]: returned ${JSON.stringify(lastBarsCache)} (s)`);
			// onHistoryCallback(bars, {
			// 	noData: false,
			// });
			// }
			// else{
			// 	onHistoryCallback([], {
			// 		noData: true,
			// 	});
			// }	
            // }
			if (firstDataRequest) {
                lastBarsCache.set(symbolInfo.full_name, { ...bars[bars.length - 1] });
            }
            console.log(`[getBars]: returned ${bars.length} bar(s)`);
            onHistoryCallback(bars, { noData: false });	
            }
            catch (error)
            {
                console.log('[getBars]: Get error', error);
                onErrorCallback(error);
            }
	},
	

	subscribeBars: (
		symbolInfo,
		resolution,
		onRealtimeCallback,
		subscribeUID,
		onResetCacheNeededCallback,
	) => {
		// console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID);
		subscribeOnStream(
			symbolInfo,
			resolution,
			onRealtimeCallback,
			subscribeUID,
			onResetCacheNeededCallback,
			lastBarsCache.get(symbolInfo.full_name),
		);
	},

	unsubscribeBars: (subscriberUID) => {
		// console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
		unsubscribeFromStream(subscriberUID);
	},
};



