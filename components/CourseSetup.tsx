
import React, { useState } from 'react';
import { useGolfData } from '../hooks/useGolfData.ts';
import { Course, Hole } from '../types.ts';
import { audioService } from '../services/audioService.ts';

interface CourseSetupProps {
    onFinished: () => void;
}

const CourseSetup: React.FC<CourseSetupProps> = ({ onFinished }) => {
    const { addCourse } = useGolfData();
    const [courseName, setCourseName] = useState('');
    const [holes, setHoles] = useState<Hole[]>(
        Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            par: 4,
            yardage: 400,
            description: '',
        }))
    );

    const handleHoleChange = (index: number, field: keyof Hole, value: string | number) => {
        const newHoles = [...holes];
        if (field === 'par' || field === 'yardage') {
            newHoles[index] = { ...newHoles[index], [field]: Number(value) };
        } else {
            newHoles[index] = { ...newHoles[index], [field]: value };
        }
        setHoles(newHoles);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseName.trim()) {
            alert('Please enter a course name.');
            return;
        }

        const newCourse: Course = {
            id: crypto.randomUUID(),
            name: courseName,
            holes,
            roundHistory: [],
        };

        addCourse(newCourse);
        audioService.discoveryChime();
        onFinished();
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Add New Course</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="courseName" className="block text-sm font-medium text-caddie-light mb-1">
                        Course Name
                    </label>
                    <input
                        type="text"
                        id="courseName"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-caddie-accent focus:border-caddie-accent"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {holes.map((hole, index) => (
                        <div key={index} className="bg-gray-700 p-3 rounded-md space-y-2">
                            <h4 className="font-semibold text-caddie-accent">Hole {hole.holeNumber}</h4>
                            <div className="flex items-center space-x-2">
                                <label htmlFor={`par-${index}`} className="text-sm">Par:</label>
                                <input
                                    type="number"
                                    id={`par-${index}`}
                                    value={hole.par}
                                    onChange={(e) => handleHoleChange(index, 'par', e.target.value)}
                                    className="w-full bg-gray-600 text-white rounded-md p-1"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <label htmlFor={`yardage-${index}`} className="text-sm">Yards:</label>
                                <input
                                    type="number"
                                    id={`yardage-${index}`}
                                    value={hole.yardage}
                                    onChange={(e) => handleHoleChange(index, 'yardage', e.target.value)}
                                    className="w-full bg-gray-600 text-white rounded-md p-1"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end space-x-4">
                     <button
                        type="button"
                        onClick={onFinished}
                        className="bg-caddie-gray hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-caddie-accent hover:bg-sky-400 text-caddie-dark font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        Save Course
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseSetup;
