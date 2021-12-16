export const EventType = {
	TRADE_OFFER: "TradeOffer",
	ALERT: "Alert",
	HAPPENING: "Happening",
}

export function createFirstMessage(eventDetails) {
	const timestamp = Date.now();
	return {
		authorId: eventDetails.authorId,
		authorName: eventDetails.authorName,
		message: `Welcome to ${eventDetails.title} event chat!`,
		timestamp
	}
}

export function createMessage(msg) {
	const timestamp = Date.now();
	return {
		authorId: msg.authorId,
		authorName: msg.authorName,
		message: msg.message,
		timestamp
	}
}

export function setEventTimestamp(eventDetails) {
	const timestampNow = Date.now();
	eventDetails['creationDate'] = timestampNow;

	return eventDetails;
}

export function parseEvent(reqBody) {
	const eventDetails = getEventTypeDetails(reqBody);

	const eventData = {
		...eventDetails,
		authorId: reqBody.authorId,
		authorName: reqBody.authorName,
		title: reqBody.title,
		latitude: reqBody.latitude,
		longitude: reqBody.longitude,
		voted: [reqBody.authorId],
		eventTemperature: 0
	}

	return eventData;
}

function getEventTypeDetails(event) {
	let eventDetails = {};
	switch (event.eventType) {
		case EventType.ALERT:
			eventDetails = {
				eventType: event.eventType,
				description: event.description,
			}
			break;
		case EventType.HAPPENING:
			eventDetails = {
				eventType: event.eventType,
				description: event.description,
			}
			break;
		case EventType.TRADE_OFFER:
			eventDetails = {
				eventType: event.eventType,
				offer: event.offer,
				receive: event.receive,
				description: event.description,
			}
			break;
		default: 
			throw new Error("Invalid event type")
	}
	return eventDetails
}

export function parseVoteToExpireTime(vote) {
	if (!vote) throw new Error("Invalid vote");
	if (vote === "like") return 60;
	if (vote === "dislike") return -60;
	throw new Error("Invalid vote");
}

export function prepareEventToEmit(userId, event) {
	if (!userId) throw new Error("No such a user id");
	
	const hasUserVoted = event['voted'].indexOf(userId) > -1;
	
	return {
		...event,
		hasUserVoted
	}
}