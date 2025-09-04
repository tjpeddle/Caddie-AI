
import React, { useState, useEffect, useRef } from 'react';
import { Course, Round, ChatMessage, Shot, Hole, HolePerformance } from '../types.ts';
import { useGolfData } from '../hooks/useGolfData.ts';
import { getJpConversationalResponse } from '../services/geminiService.ts';
import { audioService } from '../services/audioService.ts';
import { ArrowLeftIcon, SparklesIcon, MicrophoneIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './icons.tsx';

// Fix: Add type definitions for Web Speech API to satisfy TypeScript, as these are not standard in all environments.
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onstart: () => void;
    onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList extends ArrayLike<SpeechRecognitionResult> {
    item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult extends ArrayLike<SpeechRecognitionAlternative> {
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

// Check for SpeechRecognition API
// Fix: Cast window to `any` to access browser-specific, non-standard APIs without TypeScript errors.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

const RoundView: React.FC<{
    course: Course;
    initialRound: Round;
    onRoundEnd: () => void;
}> = ({ course, initialRound, onRoundEnd }) => {
    const { saveRound, playerProfile, addCourseNote, addPlayerTendency } = useGolfData();
    const [round, setRound] = useState<Round>(initialRound);
    const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const currentHole: Hole = course.holes[currentHoleIndex];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [round.conversation]);

    useEffect(() => {
        audioService.startRound();

        if (isSpeechSupported) {
            const recognition: SpeechRecognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                setUserInput(transcript);
            };
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };
            recognitionRef.current = recognition;
        } else {
             console.warn("Speech recognition not supported by this browser.");
        }

        return () => {
            recognitionRef.current?.stop();
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = (text: string) => {
        if (!('speechSynthesis' in window) || !isSpeechEnabled) {
            return;
        }
        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    const playAudioCue = (cue: string | undefined) => {
        switch (cue) {
            case 'discovery': audioService.discoveryChime(); break;
            case 'update': audioService.updatePing(); break;
            case 'memory': audioService.memoryTone(); break;
            case 'achievement': audioService.achievementSound(); break;
            case 'log': audioService.shotLogged(); break;
            default: break;
        }
    };

    const processExtractedData = (data: any): string | undefined => {
        if (!data) return undefined;
        
        let learningConfirmation: string | undefined = undefined;

        if (data.courseNote) {
            addCourseNote(course.id, currentHole.holeNumber, data.courseNote);
            learningConfirmation = `JP added a new note for Hole ${currentHole.holeNumber}.`;
        }
        if (data.playerTendency) {
            addPlayerTendency(data.playerTendency);
            learningConfirmation = (learningConfirmation ? learningConfirmation + " " : "") + `JP updated your player profile.`;
        }


        setRound(prevRound => {
            let newRound = JSON.parse(JSON.stringify(prevRound));
            
            if (data.holeNumber && data.holeNumber > 0 && data.holeNumber <= course.holes.length) {
                const newIndex = data.holeNumber - 1;
                if (currentHoleIndex !== newIndex) setCurrentHoleIndex(newIndex);
            }

            const holeNumToUpdate = data.holeNumber || currentHole.holeNumber;
            let holePerformance = newRound.holeByHole.find((h: HolePerformance) => h.holeNumber === holeNumToUpdate);
            
            let isNewHole = false;
            if (!holePerformance) {
                holePerformance = { holeNumber: holeNumToUpdate, shots: [], score: 0, putts: 0 };
                isNewHole = true;
            }
            
            let updated = false;
            if (data.club || data.outcome) {
                const newShot: Shot = { club: data.club || 'Unknown', lie: 'Unknown', outcome: data.outcome || 'Unknown' };
                holePerformance.shots.push(newShot);
                updated = true;
            }

            if (data.scoreOnHole) {
                holePerformance.score = data.scoreOnHole;
                updated = true;
            }
            
            if (updated) {
                if (isNewHole) newRound.holeByHole.push(holePerformance);
                else {
                    const holeIndex = newRound.holeByHole.findIndex((h: HolePerformance) => h.holeNumber === holeNumToUpdate);
                    newRound.holeByHole[holeIndex] = holePerformance;
                }
            }

            return newRound;
        });

        return learningConfirmation;
    };

    const handleSendMessage = async () => {
        if (isListening) recognitionRef.current?.stop();
        if (!userInput.trim() || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: userInput, timestamp: new Date().toISOString() };
        const updatedRoundForAPI = { ...round, conversation: [...round.conversation, userMessage] };
        
        setRound(updatedRoundForAPI);
        setUserInput('');
        setIsLoading(true);

        const response = await getJpConversationalResponse(course, currentHole, updatedRoundForAPI, playerProfile);
        setIsLoading(false);

        if (response) {
            speak(response.conversationalResponse);
            playAudioCue(response.audioCue);
            const learningText = processExtractedData(response.extractedData);

            const jpMessage: ChatMessage = { 
                sender: 'jp', 
                text: response.conversationalResponse, 
                timestamp: new Date().toISOString(),
                learning: learningText
            };
            setRound(prevRound => {
                const finalRound = { ...prevRound, conversation: [...prevRound.conversation, jpMessage] };
                saveRound(course.id, finalRound);
                return finalRound;
            });
        }
    };

    const handleFinishRound = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        const finalScore = round.holeByHole.reduce((acc, h) => acc + (h.score || 0), 0);
        const finalRound = { ...round, totalScore: finalScore };
        saveRound(course.id, finalRound);
        audioService.achievementSound();
        onRoundEnd();
    };

    const handleToggleListening = () => {
        if (isLoading || !recognitionRef.current) return;
        if (isListening) recognitionRef.current.stop();
        else recognitionRef.current.start();
    };

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg flex flex-col h-[85vh]">
            <header className="flex justify-between items-center pb-4 border-b border-gray-700">
                <button onClick={handleFinishRound} className="flex items-center gap-2 text-caddie-accent hover:text-sky-300">
                    <ArrowLeftIcon className="h-5 w-5"/> End Round
                </button>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white">{course.name}</h2>
                    <p className="text-md text-caddie-light">Hole {currentHole.holeNumber} &bull; Par {currentHole.par} &bull; {currentHole.yardage} yds</p>
                </div>
                <div className="w-24 flex justify-end">
                     <button
                        onClick={() => setIsSpeechEnabled(prev => !prev)}
                        title={isSpeechEnabled ? "Disable Voice" : "Enable Voice"}
                        className="text-caddie-light hover:text-caddie-accent p-2 rounded-full transition-colors"
                    >
                        {isSpeechEnabled ? (
                            <SpeakerWaveIcon className="h-6 w-6" />
                        ) : (
                            <SpeakerXMarkIcon className="h-6 w-6 text-caddie-gray" />
                        )}
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-4 space-y-4">
                {round.conversation.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'jp' && <SparklesIcon className="h-6 w-6 text-caddie-accent flex-shrink-0 mb-1" />}
                            <div className={`max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-caddie-accent text-caddie-dark' : 'bg-gray-700 text-caddie-light'}`}>
                               <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                        {msg.learning && (
                             <p className="text-xs text-caddie-gray italic mt-1 px-2">{msg.learning}</p>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                         <SparklesIcon className="h-6 w-6 text-caddie-accent flex-shrink-0 animate-pulse" />
                         <div className="max-w-md lg:max-w-lg px-4 py-2 rounded-xl bg-gray-700 text-caddie-light">
                            <p className="italic">JP is thinking...</p>
                         </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>

            <footer className="pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Talk to JP..."
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 pr-12 focus:ring-caddie-accent focus:border-caddie-accent"
                            disabled={isLoading}
                        />
                        {isSpeechSupported && (
                             <button
                                onClick={handleToggleListening}
                                disabled={isLoading}
                                title="Use microphone"
                                className={`absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-caddie-accent disabled:text-gray-600`}
                            >
                                <MicrophoneIcon className={`h-6 w-6 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                            </button>
                        )}
                    </div>
                    <button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()} className="bg-caddie-accent hover:bg-sky-400 text-caddie-dark font-bold p-3 rounded-lg disabled:bg-caddie-gray disabled:cursor-not-allowed flex-shrink-0">
                        Send
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default RoundView;
