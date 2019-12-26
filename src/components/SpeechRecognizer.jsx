import React, { Component, Fragment } from 'react';
import { extractTranscripts } from '../tools/speech-recognizer';

const DEFAULT_CONFIG = {
  continuous: true,
  interimResults: true,
  maxAlternatives: 1,
  lang: 'en-NZ',
};

export const SpeechRecognizerStatus = {
  INACTIVE: 0,
  RECOGNIZING: 1,
  STOPPED: 2,
  FAILED: 3,
}

export const SpeechRecognizer = class SpeechRecognizer extends Component {
  constructor(props) {
    super(props);

    const {
      startSpeechRecognition,
      grammars,
      continuous,
      interimResults,
      maxAlternatives,
      lang,
    } = props;

    this.state = {
      status: startSpeechRecognition ? SpeechRecognizerStatus.RECOGNIZING : SpeechRecognizerStatus.INACTIVE,
      results: null,
      formattedResults: null,
      transcripts: [],
      error: null,
    }

    // @ts-ignore -- For now...
    const speechRecognitionConstructor = window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition ||
      window.oSpeechRecognition;

    if (!speechRecognitionConstructor) {
      this.state.status = SpeechRecognizerStatus.FAILED;
      return;
    }

    let speechRecognizer = new speechRecognitionConstructor();

    if (grammars) {
      // @ts-ignore -- For now...
      const speechGrammarListConstructor = window.SpeechGrammarList || window.webkitSpeechGrammarList;

      const speechGrammarList = new speechGrammarListConstructor();
      speechGrammarList.addFromString(grammars, 10000000);

      speechRecognizer.grammars = speechGrammarList;
    }

    speechRecognizer.continuous = continuous || DEFAULT_CONFIG.continuous;
    speechRecognizer.interimResults = interimResults || DEFAULT_CONFIG.interimResults;
    speechRecognizer.maxAlternatives = maxAlternatives || DEFAULT_CONFIG.maxAlternatives;
    speechRecognizer.lang = lang || DEFAULT_CONFIG;

    speechRecognizer.onstart = (event) => this.onStart(event);
    speechRecognizer.onaudiostart = (event) => this.onStart(event);
    speechRecognizer.onspeechstart = (event) => this.onStart(event);
    speechRecognizer.onsoundstart = (event) => this.onStart(event);
    speechRecognizer.onresult = (event) => this.onResult(event);
    speechRecognizer.onerror = (error) => this.onError(error);
    
    this.state.speechRecognizer = speechRecognizer;
  }

  onStart = (event) => {
    this.setState({
      status: SpeechRecognizerStatus.RECOGNIZING,
    }, () => {
      const { onStart } = this.props;

      if (onStart) {
        onStart(event, this.props, this.state);
      }
    });
  }

  onResult = (event) => {
    const { results } = event;
    const { formatResults, onResult } = this.props;
    const formattedResults = formatResults ? formatResults(results) : results;
    const transcripts = extractTranscripts(results);

    this.setState({
      results,
      formattedResults,
      transcripts,
    }, () => {
      if (!onResult) {
        return;
      }

      onResult(results, formattedResults, transcripts);
    });
  }

  onError = (error) => {
    this.setState({
      error,
      status: SpeechRecognizerStatus.FAILED,
    }, () => {
      const { onError } = this.props;

      if (onError) {
        onError(error);
      }
    });
  }

  renderInactiveStatus = () => {
    const { renderInactiveStatus } = this.props;

    if (renderInactiveStatus) {
      return renderInactiveStatus(this.props, this.state);
    }

    return <h2>Ready to start...</h2>;
  }

  renderRecognizingStatus = () => {
    const { renderRecognizingStatus } = this.props;

    if (renderRecognizingStatus) {
      return renderRecognizingStatus(this.props, this.state);
    }

    return <h2>Recording tags...</h2>;
  }

  renderStoppedStatus = () => {
    const { renderStoppedStatus } = this.props;

    if (renderStoppedStatus) {
      return renderStoppedStatus(this.props, this.state);
    }

    const { transcripts } = this.state;

    if (!transcripts.length) {
      return <h2>No transcripts found in speech.</h2>;
    }

    return (
      <Fragment>
        <h2>Transcripts from speech:</h2>
        <ul>
          {transcripts.map((transcript, i) => {
            return (
              <li key={`transcript-${i}`}>{transcript}</li>
            )
          })}
        </ul>
      </Fragment>
    )
  }

  componentDidUpdate() {
    const { status } = this.state;

    if (status === SpeechRecognizerStatus.FAILED) {
      return;
    }

    const { startSpeechRecognition } = this.props;
    const { speechRecognizer } = this.state;

    if (startSpeechRecognition && status !== SpeechRecognizerStatus.RECOGNIZING) {
      speechRecognizer.start();

      return;
    }

    if (!startSpeechRecognition && status === SpeechRecognizerStatus.RECOGNIZING) {
      speechRecognizer.stop();

      this.setState({
        status: SpeechRecognizerStatus.STOPPED,
      });
    }
  }

  componentDidMount() {
    const { status } = this.state;

    if (status === SpeechRecognizerStatus.FAILED) {
      console.error(
        `There was an error at initialisation. 
        Most likely related to SpeechRecognition not being supported by the current browser.
        Check https://caniuse.com/#feat=speech-recognition for more info`
      );

      this.onError(null);
    }
  }

  render() {
    const { dontRender } = this.props;
    const { error, status } = this.state;

    if (dontRender) {
      return null;
    }

    if (status === SpeechRecognizerStatus.FAILED) {
      console.error('There has been an error trying to start recognizing: ', error);
      return null;
    }

    if (status === SpeechRecognizerStatus.INACTIVE) {
      return this.renderInactiveStatus();
    }

    if (status === SpeechRecognizerStatus.RECOGNIZING) {
      return this.renderRecognizingStatus();
    }

    return this.renderStoppedStatus();
  }
}