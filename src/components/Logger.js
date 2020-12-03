import React, { Component } from 'react';
import './Logger.css';
import { Midi } from 'musicvis-lib';


export default class Logger extends Component {

    constructor(props) {
        super(props);
        this.state = {
            midiInputs: [],
            messages: []
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
        console.log(message);
        const device = message.target.name;
        const command = message.data[0];
        const channel = command % 16;
        const time = message.timeStamp;
        const pitch = message.data[1];
        // A velocity value might not be included with a noteOff command
        const velocity = (message.data.length > 2) ? message.data[2] : 0;
        const commandName = this.commands.get(command) || 'unknownCommand';
        this.state.messages.push((
            <div
                className={`message ${commandName}`}
                key={this.state.messages.length}
                title='Click to log the object to the browser console'
                onClick={() => console.log(message)}
            >
                <div className='id' title='Number'>
                    {this.state.messages.length}
                </div>
                <div className='time' title={`Time: ${time}`}>
                    {Math.floor(time)}
                </div>
                <div className='device' title={`Device: ${device}`}>
                    {device.slice(0, 30)}
                </div>
                <div className='channel' title='Channel'>
                    {channel}
                </div>
                <div className='command' title='Command'>
                    {command} {commandName}
                </div>
                {[128, 144].includes(command) && (
                    <div className='pitch' title='Pitch'>
                        {pitch} {Midi.getMidiNoteByNr(pitch).label}
                    </div>
                )}
                {[144].includes(command) && (
                    <div className='velocity' title='Velocity'>
                        {velocity}
                    </div>
                )}
            </div>
        ));
        this.setState({ messages: this.state.messages });
    }

    render() {
        const inputs = [];
        for (let input of this.state.midiInputs) {
            console.log(input.name);

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
        console.log(this.state.midiInputs);
        console.log(inputs);

        return (
            <div className='Logger'>
                <div>
                    <h2>{this.state.midiInputs.length} MIDI Inputs</h2>
                    <div>
                        {inputs}
                    </div>
                </div>
                <div>
                    <h2>
                        {this.state.messages.length} messages
                    </h2>
                    <div className='message'>
                        <div className='id'>#</div>
                        <div className='time'>Time (ms)</div>
                        <div className='device'>Input</div>
                        <div className='channel'>Channel</div>
                        <div className='command'>Command</div>
                        <div className='pitch'>Note</div>
                        <div className='velocity'>Velocity</div>
                    </div>
                    <div>
                        {this.state.messages}
                    </div>
                </div>
            </div>
        );
    }
}
