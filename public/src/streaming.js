import { parseFullSymbol } from './helpers.js';

const socket = io("http://localhost:4400/chart");
const channelToSubscription = new Map();

socket.on('connect', () => {
	console.log('[socket] Connected');
});

socket.on('disconnect', (reason) => {
	console.log('[socket] Disconnected:', reason);
});

socket.on('error', (error) => {
	console.log('[socket] Error:', error);
});

// socket.on("ohlcApi",(data)=>console.log("OHLC Data",data))

socket.emit('Initialize_socket',{sym,es,ei,token,userid,source})

socket.on('trading_view',  async(data) => {
	console.log("Chart socket connected..");
	if (parseInt(0) !== 0) {
		// skip all non-TRADE events
		return;
	}
	console.log("subscriptionItem" +JSON.stringify(data.BarTime))
	const tradePrice = parseFloat(data.TradedPrice);
	const tradeTime = parseInt(data.BarTime);
	const Segment= data.ExchangeSegment=='1'? 'NSECM':data.ExchangeSegment=='2'?'NSEFO':data.ExchangeSegment=='3'?"NSECD":data.ExchangeSegment=='51'?"MCXFO":data.ExchangeSegment
	const Symbol = data.ExchangeSegment=='1'? `${sym}-EQ`:data.ExchangeSegment=='2'?`${sym}-FUT`:data.ExchangeSegment=='OPT'?`${sym}-EQ`:data.ExchangeSegment=='51'?`${sym}-MCX`:data.ExchangeSegment
	const channelString = `0~${Segment}~${Symbol}~${Symbol}`;
	console.log(data);
	const subscriptionItem = channelToSubscription.get(channelString);
	if (subscriptionItem === undefined) {
		return;
	}
	const lastDailyBar = subscriptionItem.lastDailyBar;
	const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);
	console.log("subscriptionItem" +JSON.stringify(subscriptionItem))
	let bar;
	if (tradeTime >= nextDailyBarTime) {
		console.log('[socket] Generate new bar');
		bar = {
			time: data.BarTime,
			open: tradePrice,
			high: tradePrice,
			low: tradePrice,
			close: tradePrice,
			volume:tradePrice
		};
		console.log('[socket] Generate new bar', bar);
	} else {
		console.log('[socket] Update the latest bar by price');
		bar = {
			...lastDailyBar,
			high: Math.max(lastDailyBar.high, tradePrice),
			low: Math.min(lastDailyBar.low, tradePrice),
			close: tradePrice,
			volume:tradePrice
		};
		console.log('[socket] Update the latest bar by price', bar);
	}
	subscriptionItem.lastDailyBar = bar;

	// send data to every subscriber of that symbol
	subscriptionItem.handlers.forEach(handler => handler.callback(bar));
});

function getNextDailyBarTime(barTime) {
	const date = new Date(barTime * 1000);
	date.setDate(date.getDate() + 1);
	return date.getTime() / 1000;
}

export function subscribeOnStream(symbolInfo,resolution,onRealtimeCallback,subscribeUID,onResetCacheNeededCallback,lastDailyBar,){
	// console.log("subscribeOnStreamsubscribeOnStreamsubscribeOnStream");
	const parsedSymbol = parseFullSymbol(symbolInfo.full_name);

	const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;

	const handler = {
		id: subscribeUID,
		callback: onRealtimeCallback,
	};
	let subscriptionItem = channelToSubscription.get(channelString);
	// console.log("channelString",channelToSubscription);

	if (subscriptionItem) {
		// already subscribed to the channel, use the existing subscription
		subscriptionItem.handlers.push(handler);
		return;
	}
	subscriptionItem = {
		subscribeUID,
		resolution,
		lastDailyBar,
		handlers: [handler],
	};
	// console.log(channelString,subscriptionItem);
	channelToSubscription.set(channelString, subscriptionItem);
	// console.log('[subscribeBars]: Subscribe to streaming. Channel:', channelString);
	socket.emit('SubAdd', { subs: [channelString] });
}

export function unsubscribeFromStream(subscriberUID) {
	// find a subscription with id === subscriberUID
	for (const channelString of channelToSubscription.keys()) {
		const subscriptionItem = channelToSubscription.get(channelString);
		const handlerIndex = subscriptionItem.handlers
			.findIndex(handler => handler.id === subscriberUID);

		if (handlerIndex !== -1) {
			// remove from handlers
			subscriptionItem.handlers.splice(handlerIndex, 1);

			if (subscriptionItem.handlers.length === 0) {
				// unsubscribe from the channel, if it was the last handler
				// console.log('[unsubscribeBars]: Unsubscribe from streaming. Channel:', channelString);
				socket.emit('SubRemove', { subs: [channelString] });
				channelToSubscription.delete(channelString);
				break;
			}
		}
	}
}
