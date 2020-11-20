import React, { Component } from 'react';
import './Logger.css';
import { getMidiNoteByNr } from '../lib/Midi';


export default class Logger extends Component {

    constructor(props) {
        super(props);
        this.state = {
            midiInputs: [],
            messages: [],
            // Filter options
            devices: new Set(),
            channels: new Set(),
            commands: new Set(),
            // Filter options set
            hiddenDevices: new Set(),
            hiddenChannels: new Set(),
            hiddenCommands: new Set()

        };
        this.commands = new Map([
            [128, 'noteOff'],
            [144, 'noteOn'],
            [224, 'pitchWheel'],
        ]);
    }

    componentDidMount() {
        // Request MIDI access
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(this._onMIDISuccess, this._onMIDIFailure);
        } else {
            console.error('WebMIDI is not supported in this browser.');
            alert('You browser does not support WebMIDI');
        }
    }

    /**
     * Handles a successful MIDI access request
     * @param {*} midiAccess MIDI access
     */
    _onMIDISuccess = (midiAccess) => {
        console.log('MIDI Access', midiAccess);
        console.log(`${midiAccess.inputs.size} input devices`);
        const inputs = [];
        for (let input of midiAccess.inputs.values()) {
            console.log(` - ${input.name}`);
            input.onmidimessage = this._handleMIDIMessage;
            inputs.push(input);
        }
        this.setState({
            midiInputs: inputs
        });
        // console.groupCollapsed(`${midiAccess.inputs.size} output devices`);
        // for (let output of midiAccess.outputs.values()) {
        //     console.log(` - ${output.name}`);
        // }
        // console.groupEnd();
    }

    /**
     * Handles MIDI access errors
     * @param {*} error
     */
    _onMIDIFailure = (error) => console.error('Cannot access MIDI devices.', error);

    /**
     * Handles incoming MIDI messages
     * @param {*} message MIDI message
     */
    _handleMIDIMessage = (message) => {
        // console.log(message);
        const device = message.target.name;
        const commandAndChannel = message.data[0];
        const channel = commandAndChannel % 16;
        const command = commandAndChannel - channel;
        const commandName = this.commands.get(command) || 'unknownCommand';
        const time = message.timeStamp;
        const pitch = message.data[1];
        // A velocity value might not be included with a noteOff command
        const velocity = (message.data.length > 2) ? message.data[2] : 0;
        const messageObject = {
            message,
            id: this.state.messages.length,
            device,
            channel,
            command,
            commandName,
            time,
            pitch,
            velocity
        };
        // Update sets of existing devices, channels, commands
        const devices = new Set(this.state.devices).add(device);
        const channels = new Set(this.state.channels).add(channel);
        const commands = new Set(this.state.commands).add(command);
        this.setState({
            messages: this.state.messages.concat(messageObject),
            devices,
            channels,
            commands
        });
    }

    toggleDevice = (e) => {
        const { hiddenDevices } = this.state;
        const value = e.target.value;
        const updated = new Set(hiddenDevices);
        if (hiddenDevices.has(value)) {
            updated.delete(value);
        } else {
            updated.add(value);
        }
        this.setState({ hiddenDevices: updated });
    }

    toggleChannel = (e) => {
        const { hiddenChannels } = this.state;
        const value = +e.target.value;
        const updated = new Set(hiddenChannels);
        if (hiddenChannels.has(value)) {
            updated.delete(value);
        } else {
            updated.add(value);
        }
        this.setState({ hiddenChannels: updated });
    }

    toggleCommand = (e) => {
        const { hiddenCommands } = this.state;
        const value = +e.target.value;
        const updated = new Set(hiddenCommands);
        if (hiddenCommands.has(value)) {
            updated.delete(value);
        } else {
            updated.add(value);
        }
        this.setState({ hiddenCommands: updated });
    }

    render() {
        const { messages, midiInputs, devices, channels, commands, hiddenDevices, hiddenChannels, hiddenCommands } = this.state;

        // Log and show inputs
        const inputs = [];
        for (let input of midiInputs) {
            // console.log(input.name);
            inputs.push((
                <div
                    key={input.name}
                    className='midiInput'
                    title='Click to log the object to the browser console'
                    onClick={() => console.log(input)}
                >
                    {input.name}
                </div>
            ));
        }
        // console.log(midiInputs);

        // Filter message sby user defined filters
        const filteredMessages = messages.filter(d => {
            const { device, channel, command } = d;
            if (hiddenDevices.has(device) || hiddenChannels.has(channel) || hiddenCommands.has(command)) {
                return false;
            }
            return true;
        });

        // Create JSX for messages
        const nShown = 50;
        const messageElements = filteredMessages
            .reverse()
            .slice(0, nShown)
            .map(d => (
                <div
                    className={`message ${d.commandName}`}
                    key={d.id}
                    title='Click to log the object to the browser console'
                    onClick={() => console.log(d)}
                >
                    <div className='id' title='Number'>
                        {d.id}
                    </div>
                    <div className='time' title={`Time: ${d.time}`}>
                        {Math.floor(d.time)}
                    </div>
                    <div className='device' title={`Device: ${d.device}`}>
                        {d.device.slice(0, 30)}
                    </div>
                    <div className='channel' title='Channel'>
                        {d.channel}
                    </div>
                    <div className='command' title='Command'>
                        {d.command} {d.commandName}
                    </div>
                    {[128, 144].includes(d.command) && (
                        <div className='pitch' title='Pitch'>
                            {d.pitch} {getMidiNoteByNr(d.pitch).label}
                        </div>
                    )}
                    {[144].includes(d.command) && (
                        <div className='velocity' title='Velocity'>
                            {d.velocity}
                        </div>
                    )}
                </div>
            ));

        return (
            <div className='Logger'>
                <div>
                    <h2>{midiInputs.length} MIDI Input{midiInputs.length > 1 && 's'}</h2>
                    <div>
                        {inputs}
                    </div>
                </div>
                <div>
                    <h2>
                        {messages.length} messages, {filteredMessages.length} with current filter, showing newest on top, limited to {nShown}
                    </h2>
                    <div className='filterOptions'>
                        Devices
                        <div>
                            {Array.from(devices).sort().map(d => (
                                <button
                                    key={d}
                                    value={d}
                                    onClick={this.toggleDevice}
                                    className={hiddenDevices.has(d) ? 'hidden' : 'shown'}
                                    title='Click to hide / show'
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        Channels
                        <div>
                            {Array.from(channels).sort((a, b) => a - b).map(d => (
                                <button
                                    key={d}
                                    value={d}
                                    onClick={this.toggleChannel}
                                    className={hiddenChannels.has(d) ? 'hidden' : 'shown'}
                                    title='Click to hide / show'
                                >
                                    Channel {d}
                                </button>
                            ))}
                        </div>
                        Commands
                        <div>
                            {Array.from(commands).sort((a, b) => a - b).map(d => (
                                <button
                                    key={d}
                                    value={d}
                                    onClick={this.toggleCommand}
                                    className={hiddenCommands.has(d) ? 'hidden' : 'shown'}
                                    title='Click to hide / show'
                                >
                                    {d} ({this.commands.get(d) || 'unknownCommand'})
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className='message'>
                        <div className='id'>#</div>
                        <div className='time'>Time (ms)</div>
                        <div className='device'>Input</div>
                        <div className='channel'>Channel</div>
                        <div className='command'>Command</div>
                        <div className='pitch'>Note</div>
                        <div className='velocity'>Velocity</div>
                    </div>
                    <div className='messagesContainer'>
                        {messageElements}
                    </div>
                </div>
            </div>
        );
    }
}
