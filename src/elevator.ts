// docs: https://play.elevatorsaga.com/documentation.html
// game: https://play.elevatorsaga.com/

type FloorEvent = 'up_button_pressed' | 'down_button_pressed';
type Direction = 'up' | 'down' | 'stopped';

type Floor = {
	/**
	 * Gets the floor number of the floor object.
	 */
	floorNum: () => number;
	on: (event: FloorEvent, cb: () => void) => void;
};

// Elevator events and callbacks
type IdleCb = (elevator: number, ) => void;
type FloorButtonPressedCb = (elevator: number, floorNumber: number) => void;
type PassingFloorCb = (elevator: number, floorNumber: number, direction: Omit<Direction, 'stopped'>) => void;
type StoppedAtFloorCb = (elevator: number, floorNumber: number) => void;
type IdleEvent = (event: 'idle', cb: IdleCb) => void;
type FloorButtonPressedEvent = (event: 'floor_button_pressed', cb: FloorButtonPressedCb) => void;
type PassingFloorEvent = (event: 'passing_floor', cb: PassingFloorCb) => void;
type StoppedAtFloorEvent = (event: 'stopped_at_floor', cb: StoppedAtFloorCb) => void;

type Elevator = {
	/**
	 * Queue the elevator to go to specified floor number. If you specify true as second argument,
	 * the elevator will go to that floor directly, and then go to any other queued floors.
	 */
	goToFloor: (targetFloor: number, goDirectly?: boolean) => void;
	/**
	 * Clear the destination queue and stop the elevator if it is moving. Note that you normally
	 * don't need to stop elevators - it is intended for advanced solutions with in-transit
	 * rescheduling logic. Also, note that the elevator will probably not stop at a floor, so
	 * passengers will not get out.
	 */
	stop: () => void;
	/**
	 * Gets the floor number that the elevator currently is on.
	 */
	currentFloor: () => number;
	/**
	 * Gets or sets the going up indicator, which will affect passenger behaviour when stopping at
	 * floors.
	 */
	goingUpIndicator: (value?: boolean) => boolean; // Double check to see if there are overridesof output
	/**
	 * Gets or sets the going down indicator, which will affect passenger behaviour when stopping
	 * at floors.
	 */
	goingDownIndicator: (value?: boolean) => boolean; // Double check to see if there are overrides of output
	/**
	 * Gets the maximum number of passengers that can occupy the elevator at the same time.
	 */
	maxPassengerCount: () => number;
	/**
	 * Gets the load factor of the elevator. 0 means empty, 1 means full. Varies with passenger
	 * weights, which vary - not an exact measure.
	 */
	loadFactor: () => number; // 0-1
	/**
	 * Gets the direction the elevator is currently going to move toward. Can be "up", "down" or
	 * "stopped".
	 */
	destinationDirection: () => Direction;
	/**
	 * The current destination queue, meaning the floor numbers the elevator is scheduled to go to.
	 * Can be modified and emptied if desired. Note that you need to call checkDestinationQueue()
	 * for the change to take effect immediately.
	 */
	destinationQueue: number[];
	/**
	 * Checks the destination queue for any new destinations to go to. Note that you only need to
	 * call this if you modify the destination queue explicitly.
	 */
	checkDestinationQueue: () => void;
	/**
	 * Gets the currently pressed floor numbers as an array.
	 */
	getPressedFloors: () => number[];
	on: IdleEvent
		& FloorButtonPressedEvent
		& PassingFloorEvent
		& StoppedAtFloorEvent;
};

type MyGame = {
	goingUp: number;
	goingDown: number;
	elevators: Elevator[];
	floors: Floor[];
	floorRequests: number[];
	onElevatorIdle: IdleCb;
	onElevatorFloorButtonPressed: FloorButtonPressedCb;
	onElevatorPassingFloor: PassingFloorCb;
	onElevatorStoppedAtFloor: StoppedAtFloorCb;
	onFloorRequest: (floor: number) => void;
};

type Game = {
	init: (elevators: Elevator[], floors: Floor[]) => void;
	update: (dt: number, elevators: Elevator[], floors: Floor[]) => void;
} & MyGame;

export const game: Game = {
	goingUp: 0,
	goingDown: 0,
	elevators: [],
	floors: [],
	floorRequests: [],
	onElevatorIdle: function (index) {
		if (this.elevators.length === 0) {
			return;
		}
		const [nextFloor] = this.floorRequests.sort((a, b) => {
			const aPrime = Math.abs(this.elevators[index].currentFloor() - a);
			const bPrime = Math.abs(this.elevators[index].currentFloor() - b);
			return (aPrime > bPrime) ? 1 : -1;
		});
		this.elevators[index].goToFloor(nextFloor);
	},
	onElevatorFloorButtonPressed: function (index, floorNumber) {
		this.elevators[index].goToFloor(floorNumber);
		this.floorRequests.filter((e) => e !== floorNumber);
	},
	onElevatorPassingFloor: function (index, floorNumber, direction) {},
	onElevatorStoppedAtFloor: function (index, floorNumber) {},
	onFloorRequest: function (floorNumber) {
		this.floorRequests.push(floorNumber);
	},
	init: function (elevators, floors) {
		for (const index in floors) {
			floors[index].on('down_button_pressed', () => this.onFloorRequest(index));
			floors[index].on('up_button_pressed', () => this.onFloorRequest(index));
		}

		for (const index in elevators) {
			elevators[index].on('idle', () => this.onElevatorIdle(index));
			elevators[index].on('floor_button_pressed', (floorNumber) => this.onElevatorFloorButtonPressed(index, floorNumber));
			elevators[index].on('passing_floor', (floorNumber, direction) => this.onElevatorPassingFloor(index, floorNumber, direction));
			elevators[index].on('stopped_at_floor', (floorNumber) => this.onElevatorStoppedAtFloor(index, floorNumber));
		}
	},
	update: function (dt, elevators, floors) {
		this.elevators = elevators;
		this.floors = floors;
	}
};
