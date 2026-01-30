import React, { createContext, useContext, useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// MISSION CONTROL: The Global Operational Context
// This dictates HOW the platform presents data to the user.
// ─────────────────────────────────────────────────────────────────────────────

export type MissionRole = 'standard' | 'investor' | 'operator' | 'policy';
export type MissionFormat = 'brief' | 'deep' | 'audio';

export interface MissionState {
    role: MissionRole;
    focus: {
        countries: string[]; // ISO codes
        sectors: string[];   // Sector IDs
    };
    format: MissionFormat;
    isOpen: boolean; // Is the control panel open?
}

interface MissionContextType extends MissionState {
    setRole: (role: MissionRole) => void;
    setFormat: (format: MissionFormat) => void;
    toggleCountry: (code: string) => void;
    toggleSector: (id: string) => void;
    setPanelOpen: (isOpen: boolean) => void;
    resetMission: () => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from Storage or Default
    const [state, setState] = useState<MissionState>(() => {
        const saved = localStorage.getItem('boa_mission_state');
        return saved ? JSON.parse(saved) : {
            role: 'standard',
            focus: { countries: [], sectors: [] },
            format: 'deep', // Default to deep for "in-depth delivery"
            isOpen: false
        };
    });

    // Persistence Layer
    useEffect(() => {
        localStorage.setItem('boa_mission_state', JSON.stringify(state));
    }, [state]);

    // Actions
    const setRole = (role: MissionRole) => setState(prev => ({ ...prev, role }));
    const setFormat = (format: MissionFormat) => setState(prev => ({ ...prev, format }));

    const toggleCountry = (code: string) => setState(prev => {
        const current = prev.focus.countries;
        const next = current.includes(code)
            ? current.filter(c => c !== code)
            : [...current, code];
        return { ...prev, focus: { ...prev.focus, countries: next } };
    });

    const toggleSector = (id: string) => setState(prev => {
        const current = prev.focus.sectors;
        const next = current.includes(id)
            ? current.filter(s => s !== id)
            : [...current, id];
        return { ...prev, focus: { ...prev.focus, sectors: next } };
    });

    const setPanelOpen = (isOpen: boolean) => setState(prev => ({ ...prev, isOpen }));

    const resetMission = () => setState({
        role: 'standard',
        focus: { countries: [], sectors: [] },
        format: 'deep',
        isOpen: false
    });

    return (
        <MissionContext.Provider value={{
            ...state,
            setRole,
            setFormat,
            toggleCountry,
            toggleSector,
            setPanelOpen,
            resetMission
        }}>
            {children}
        </MissionContext.Provider>
    );
};

export const useMission = () => {
    const context = useContext(MissionContext);
    if (context === undefined) {
        throw new Error('useMission must be used within a MissionProvider');
    }
    return context;
};
