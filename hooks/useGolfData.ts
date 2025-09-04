
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Course, GolfData, Round, Shot, HolePerformance, PlayerProfile } from '../types.ts';

interface GolfDataContextType {
    courses: Course[];
    playerProfile: PlayerProfile;
    addCourse: (course: Course) => void;
    saveRound: (courseId: string, round: Round) => void;
    addCourseNote: (courseId: string, holeNumber: number, note: string) => void;
    addPlayerTendency: (tendency: string) => void;
    getCourseById: (courseId: string) => Course | undefined;
    isLoading: boolean;
}

const GolfDataContext = createContext<GolfDataContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};

export const GolfDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [golfData, setGolfData] = useLocalStorage<GolfData>('golfData', { courses: [], playerProfile: { tendencies: [] } });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setIsLoading(false), 200);
    }, []);

    const addCourse = (course: Course) => {
        setGolfData(prevData => ({
            ...prevData,
            courses: [...prevData.courses, course],
        }));
    };
    
    const saveRound = (courseId: string, round: Round) => {
        setGolfData(prevData => {
            const updatedCourses = prevData.courses.map(course => {
                if (course.id === courseId) {
                    const roundIndex = course.roundHistory.findIndex(r => r.date === round.date);
                    const newRoundHistory = [...course.roundHistory];
                    if (roundIndex > -1) {
                        newRoundHistory[roundIndex] = round;
                    } else {
                        newRoundHistory.push(round);
                    }
                    return { ...course, roundHistory: newRoundHistory };
                }
                return course;
            });
            return { ...prevData, courses: updatedCourses };
        });
    };

    const addCourseNote = (courseId: string, holeNumber: number, note: string) => {
        setGolfData(prevData => {
            const updatedCourses = prevData.courses.map(course => {
                if (course.id === courseId) {
                    const updatedHoles = course.holes.map(hole => {
                        if (hole.holeNumber === holeNumber) {
                            const newNotes = [...(hole.notes || []), note];
                            return { ...hole, notes: newNotes };
                        }
                        return hole;
                    });
                    return { ...course, holes: updatedHoles };
                }
                return course;
            });
            return { ...prevData, courses: updatedCourses };
        });
    };
    
    const addPlayerTendency = (tendency: string) => {
        setGolfData(prevData => {
            const profile = prevData.playerProfile || { tendencies: [] };
            if (profile.tendencies.includes(tendency)) return prevData; // Avoid duplicates
            const newTendencies = [...profile.tendencies, tendency];
            return { ...prevData, playerProfile: { ...profile, tendencies: newTendencies } };
        });
    };
    
    const getCourseById = (courseId: string) => {
        return golfData.courses.find(c => c.id === courseId);
    }

    const value = {
        courses: golfData.courses,
        playerProfile: golfData.playerProfile || { tendencies: [] },
        addCourse,
        saveRound,
        addCourseNote,
        addPlayerTendency,
        getCourseById,
        isLoading
    };

    return React.createElement(
        GolfDataContext.Provider,
        { value },
        children
    );
};

export const useGolfData = (): GolfDataContextType => {
    const context = useContext(GolfDataContext);
    if (!context) {
        throw new Error('useGolfData must be used within a GolfDataProvider');
    }
    return context;
};
