
import React from 'react';
import { Course } from '../types.ts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowLeftIcon } from './icons.tsx';

interface AnalyticsViewProps {
    course: Course;
    onBack: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ course, onBack }) => {
    
    const scoringTrendData = course.roundHistory.map((round, index) => ({
        name: `Round ${index + 1}`,
        score: round.totalScore,
        date: new Date(round.date).toLocaleDateString(),
    }));

    const holePerformanceData = course.holes.map(hole => {
        const history = course.roundHistory
            .map(r => r.holeByHole.find(h => h.holeNumber === hole.holeNumber))
            .filter(Boolean);
        
        if (history.length === 0) {
            return { name: `Hole ${hole.holeNumber}`, avgScore: 0, par: hole.par };
        }
        
        const avgScore = history.reduce((acc, h) => acc + h!.score, 0) / history.length;
        return { name: `Hole ${hole.holeNumber}`, avgScore: parseFloat(avgScore.toFixed(2)), par: hole.par };
    });

    const bestRound = course.roundHistory.length > 0 ? Math.min(...course.roundHistory.map(r => r.totalScore)) : 'N/A';
    const avgScore = course.roundHistory.length > 0 ? (course.roundHistory.reduce((acc, r) => acc + r.totalScore, 0) / course.roundHistory.length).toFixed(2) : 'N/A';

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 text-caddie-accent hover:text-sky-300">
                     <ArrowLeftIcon className="h-5 w-5"/> Back to Dashboard
                </button>
                <h2 className="text-2xl font-bold text-white text-right">Analytics for {course.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-caddie-accent">Rounds Played</h3>
                    <p className="text-3xl font-bold text-white">{course.roundHistory.length}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-caddie-accent">Scoring Average</h3>
                    <p className="text-3xl font-bold text-white">{avgScore}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-caddie-accent">Best Score</h3>
                    <p className="text-3xl font-bold text-white">{bestRound}</p>
                </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-caddie-accent mb-4">Scoring Trend</h3>
                {scoringTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={scoringTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                            <XAxis dataKey="name" stroke="#F3F4F6" />
                            <YAxis stroke="#F3F4F6" domain={['dataMin - 2', 'dataMax + 2']}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}/>
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="#38BDF8" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : <p className="text-caddie-gray text-center">No round data to display.</p>}
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-caddie-accent mb-4">Average Score by Hole</h3>
                 {holePerformanceData.some(d => d.avgScore > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={holePerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                            <XAxis dataKey="name" stroke="#F3F4F6" angle={-45} textAnchor="end" height={70} interval={0} />
                            <YAxis stroke="#F3F4F6" />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}/>
                            <Legend />
                            <Bar dataKey="avgScore" fill="#38BDF8" name="Average Score"/>
                            <Bar dataKey="par" fill="#166534" name="Par"/>
                        </BarChart>
                    </ResponsiveContainer>
                 ) : <p className="text-caddie-gray text-center">No hole data to display.</p>}
            </div>
        </div>
    );
};

export default AnalyticsView;
