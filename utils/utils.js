// @ts-nocheck
export const EventType = {
	TRADE_OFFER: "TradeOffer",
	ALERT: "Alert",
	HAPPENING: "Happening",
}

export function createFirstMessage(eventDetails) {
	return {
		authorId: eventDetails.authorId,
		authorName: eventDetails.authorName,
		message: `Welcome to ${eventDetails.title} event chat!`,
	}
}

export function setEventTimestamp(eventDetails) {
	try{
		const timestampNow = Date.now();
		return {
			...eventDetails,
			creationDate: timestampNow,
		}
	} catch(err) {
		return {
			error: err.message,
		}
	}
}

export function parseEvent(reqBody) {
	const eventDetails = getEventTypeDetails(reqBody);
	
	if(eventDetails.error) return eventDetails;

	const eventData = {
		...eventDetails,
		authorId: reqBody.authorId,
		authorName: reqBody.authorName,
		title: reqBody.title,
		latitude: reqBody.latitude,
		longitude: reqBody.longitude,
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
			eventDetails = {
				error: "Invalid event type"
			}
			break;
	}
	return eventDetails
}

