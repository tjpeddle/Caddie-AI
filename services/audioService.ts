
// In a real application, you would use actual audio files.
// For this simulation, we will log to the console to represent sounds being played.

class AudioService {
    private playSound(soundName: string, message: string) {
        console.log(`🔊 Playing sound: ${soundName} - ${message}`);
    }

    discoveryChime() {
        this.playSound("Discovery Chime", "New course feature learned.");
    }

    updatePing() {
        this.playSound("Update Ping", "Strategy profile updated.");
    }

    memoryTone() {
        this.playSound("Memory Tone", "Accessing historical data...");
    }
    
    achievementSound() {
        this.playSound("Celebration Sound", "Achievement unlocked!");
    }

    shotLogged() {
        this.playSound("Log Confirmation", "Shot logged successfully.");
    }
    
    startRound() {
        this.playSound("Startup Chime", "Loading historical data for the round.");
    }
}

export const audioService = new AudioService();
