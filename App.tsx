
import React, { useState, useMemo } from 'react';
import { GolfDataProvider, useGolfData } from './hooks/useGolfData.ts';
import Dashboard from './components/Dashboard.tsx';
import CourseSetup from './components/CourseSetup.tsx';
import RoundView from './components/RoundView.tsx';
import AnalyticsView from './components/AnalyticsView.tsx';
import { Course, Round } from './types.ts';
import { JpLogo } from './components/icons.tsx';

type View = 'dashboard' | 'setup' | 'round' | 'analytics';

interface ActiveRound {
  course: Course;
  round: Round;
}

const AppContent: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
    const { courses } = useGolfData();

    const handleStartRound = (course: Course) => {
        const newRound: Round = {
            date: new Date().toISOString(),
            conditions: 'Clear skies, 5 mph wind',
            holeByHole: [],
            totalScore: 0,
            conversation: [
              {
                sender: 'jp',
                text: `Hey! Back at ${course.name} again? How are you feeling about your game today? We're starting on Hole 1.`,
                timestamp: new Date().toISOString(),
              }
            ]
        };
        setActiveRound({ course, round: newRound });
        setView('round');
    };
    
    const handleViewAnalytics = (course: Course) => {
        setActiveCourse(course);
        setView('analytics');
    };

    const handleExit = () => {
        setActiveCourse(null);
        setActiveRound(null);
        setView('dashboard');
    }

    const renderView = () => {
        switch (view) {
            case 'setup':
                return <CourseSetup onFinished={() => setView('dashboard')} />;
            case 'round':
                if (activeRound) {
                    return <RoundView course={activeRound.course} initialRound={activeRound.round} onRoundEnd={handleExit} />;
                }
                return null;
            case 'analytics':
                 if (activeCourse) {
                    return <AnalyticsView course={activeCourse} onBack={handleExit} />;
                }
                return null;
            case 'dashboard':
            default:
                return (
                    <Dashboard
                        onStartRound={handleStartRound}
                        onViewAnalytics={handleViewAnalytics}
                        onAddCourse={() => setView('setup')}
                    />
                );
        }
    };
    
    return (
        <div className="min-h-screen bg-caddie-dark font-sans flex flex-col items-center p-4 sm:p-6">
            <header className="w-full max-w-5xl mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <JpLogo className="h-10 w-10 text-caddie-accent" />
                    <h1 className="text-3xl font-bold text-white tracking-tight">JP AI Caddie</h1>
                </div>
            </header>
            <main className="w-full max-w-5xl">
                {renderView()}
            </main>
        </div>
    );
};

const App: React.FC = () => (
    <GolfDataProvider>
        <AppContent />
    </GolfDataProvider>
);

export default App;
