import React, { Component } from 'react';
import './App.css';
// Views
import Logger from './components/Logger';
// API, data etc.
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

export default class App extends Component {

    render() {
        return (
            <div className={`App bright`} >
                <Logger />
                <div className='githubLink'>
                    <a href='https://github.com/fheyen/webmidi-logger'>
                        <FontAwesomeIcon icon={faGithub} />&nbsp;
                        https://github.com/fheyen/webmidi-logger
                    </a>
                </div>
            </div >
        );
    }
}
