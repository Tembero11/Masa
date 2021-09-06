export enum EventType {
    PlayerJoinEvent,
    PlayerLeaveEvent,
}

export default class Event {
    type: EventType;
    constructor(eventType: EventType) {
        this.type = eventType;
    }
}