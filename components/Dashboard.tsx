
import React from 'react';
import { useGolfData } from '../hooks/useGolfData.ts';
import { Course } from '../types.ts';
import { GolfBallIcon, ChartBarIcon, PlusCircleIcon, JpLogo } from './icons.tsx';

interface DashboardProps {
    onStartRound: (course: Course) => void;
    onViewAnalytics: (course: Course) => void;
    onAddCourse: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartRound, onViewAnalytics, onAddCourse }) => {
    const { courses, isLoading } = useGolfData();

    if (isLoading) {
        return <div className="text-center text-caddie-light">Loading player data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Your Courses</h2>
                {courses.length === 0 ? (
                    <div className="text-center bg-gray-700 p-8 rounded-lg">
                        <JpLogo className="h-16 w-16 text-caddie-accent mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Welcome! I'm JP.</h3>
                        <p className="text-caddie-light mb-6">
                            To get started, let's add your home course to my memory banks.
                            <br />
                            Once we have a course, we can track rounds, learn tendencies, and start shaving strokes off your game.
                        </p>
                         <button
                            onClick={onAddCourse}
                            className="inline-flex items-center justify-center gap-2 bg-caddie-accent hover:bg-sky-400 text-caddie-dark font-bold py-3 px-5 rounded-md transition duration-300 shadow-lg"
                        >
                            <PlusCircleIcon className="h-6 w-6" />
                            Add Your First Course
                        </button>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {courses.map(course => (
                            <li key={course.id} className="bg-gray-700 p-4 rounded-md shadow-md flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                                <div>
                                    <h3 className="text-xl font-semibold text-caddie-accent">{course.name}</h3>
                                    <p className="text-sm text-caddie-gray">{course.roundHistory.length} round(s) played</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => onStartRound(course)}
                                        className="flex items-center gap-2 bg-caddie-green hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                                    >
                                        <GolfBallIcon className="h-5 w-5" />
                                        Start Round
                                    </button>
                                    <button
                                        onClick={() => onViewAnalytics(course)}
                                        className="flex items-center gap-2 bg-caddie-gray hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                                    >
                                        <ChartBarIcon className="h-5 w-5" />
                                        Analytics
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {courses.length > 0 && (
                <button
                    onClick={onAddCourse}
                    className="w-full flex items-center justify-center gap-2 bg-caddie-accent hover:bg-sky-400 text-caddie-dark font-bold py-3 px-4 rounded-md transition duration-300 shadow-lg"
                >
                    <PlusCircleIcon className="h-6 w-6" />
                    Add New Course
                </button>
            )}

        </div>
    );
};

export default Dashboard;
