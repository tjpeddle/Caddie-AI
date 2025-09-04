
import { GoogleGenAI, Type } from "@google/genai";
import { Course, Round, Hole, HolePerformance, PlayerProfile } from '../types.ts';

// Safely access the API key. In a pure browser environment without a build step,
// `process` will be undefined. This check prevents the app from crashing.
const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

// Initialize ai as null. We will only create an instance if the API key exists.
let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  // This warning is helpful for developers.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        conversationalResponse: {
            type: Type.STRING,
            description: "JP's natural, conversational response to the user. It should be supportive, strategic, and observant, like a real caddie.",
        },
        extractedData: {
            type: Type.OBJECT,
            description: "Structured data extracted from the user's latest message. Only populate fields if the user explicitly mentions them. Be conservative.",
            nullable: true,
            properties: {
                holeNumber: { type: Type.INTEGER, description: "The hole number the user is talking about.", nullable: true },
                shotNumber: { type: Type.INTEGER, description: "The shot number on the current hole.", nullable: true },
                club: { type: Type.STRING, description: "The club used for a shot.", nullable: true },
                outcome: { type: Type.STRING, description: "The outcome of a shot (e.g., 'Fairway', 'Green', 'Bunker').", nullable: true },
                scoreOnHole: { type: Type.INTEGER, description: "The final score for a specific hole.", nullable: true },
                courseNote: { 
                    type: Type.STRING,
                    description: "A new insight or feature about the current hole learned from the user's conversation (e.g., 'The green is very fast today', 'The right bunker is a magnet').",
                    nullable: true 
                },
                playerTendency: {
                    type: Type.STRING,
                    description: "A new insight about the player's general game, habits, or mental state (e.g., 'Tends to pull 7-iron left when nervous', 'Confidence is high with the driver today').",
                    nullable: true
                },
            }
        },
        audioCue: {
            type: Type.STRING,
            description: "Suggest an audio cue to play based on the context. Options: 'discovery', 'update', 'memory', 'achievement', 'log', 'none'. Use 'discovery' for new course notes, 'update' for new player tendencies, and 'log' for shots/scores.",
            nullable: true,
        }
    }
};

const buildSystemPrompt = (course: Course, currentHole: Hole, round: Round, playerProfile: PlayerProfile): string => {
    const relevantHistory = course.roundHistory
        .map(r => r.holeByHole.find(h => h.holeNumber === currentHole.holeNumber))
        .filter((h): h is HolePerformance => !!h);
    
    let historySummary = "No previous history on this hole.";
    if (relevantHistory.length > 0) {
        const avgScore = relevantHistory.reduce((acc, h) => acc + h.score, 0) / relevantHistory.length;
        historySummary = `Player has played this hole ${relevantHistory.length} times with an average score of ${avgScore.toFixed(2)}.`;
    }

    const holeNotes = currentHole.notes ? `\n    - Your organic notes on this hole: ${currentHole.notes.join(', ')}` : "";
    const playerTendencies = playerProfile.tendencies.length > 0 ? `\n    - General Player Tendencies: ${playerProfile.tendencies.join(', ')}` : "";


    return `You are JP, a professional AI golf caddie. Your personality is supportive, strategic, observant, and always conversational. Your entire existence is based on natural dialogue with a player.

    **Your Conversational Philosophy (Non-Negotiable):**
    - **NEVER Ask for Structured Data:** You are not a data entry bot. Never ask "What club did you use?" or "What was the outcome?". You must learn everything organically from the player's natural conversation.
    - **Be a Conversational Partner:** Your goal is to have a dialogue that feels like walking 18 holes together. Respond to what the player says, ask open-ended questions, and offer thoughts like a real caddie.
    - **Listen and Learn:** Actively listen to the player's stories, complaints, and observations to build your memory. A comment like "I always end up in that right bunker" is a crucial piece of data for you.
    - **Reference Your Memory:** When relevant, explicitly mention that you are drawing from past rounds, historical data, or learned notes (e.g., 'I remember you said...', 'Based on your 5 previous rounds here...'). This builds the player's trust in your memory.

    **Current Context:**
    - Course: ${course.name}
    - Currently on: Hole #${currentHole.holeNumber} (Par ${currentHole.par}, ${currentHole.yardage} yds)
    - Historical Performance on this hole: ${historySummary}${holeNotes}
    - Weather: ${round.conditions}${playerTendencies}

    **Example Interactions (Follow this style):**
    - Player: "Man, I'm standing over this 150-yard shot and there's water short."
    - You: "I remember you mentioned you've been pulling your 7-iron a bit when you're nervous. How's this shot feel?"
    - Player: "Yeah, definitely feeling that. Maybe I'll take a smooth 6."
    - You (Internal thought -> extract nothing): "Sounds like a confident play. Let's commit to it."
    - Player: "This green is so fast today, way faster than usual."
    - You (Internal thought -> extract 'courseNote'): "Good to know, I'll add that to my notes for this hole. We'll have to adjust our strategy on the approaches then."

    **Your Task:**
    1.  Read the entire conversation history to understand the context.
    2.  Provide a natural, concise, conversational response to the user's LATEST message based on your philosophy and the current context.
    3.  Analyze the user's LATEST message for new, explicitly stated information to learn from. This could be a shot detail, a score, an observation about the course, or a personal tendency.
    4.  Return a JSON object containing your \`conversationalResponse\`, any \`extractedData\`, and a suggested \`audioCue\`.
    5.  Be CONSERVATIVE with data extraction. Only extract what is clearly stated. If they say "Bad shot", do not extract anything. If they say "Hit my 7-iron into the sand", extract club: '7-Iron' and outcome: 'Bunker'.`;
};

export const getJpConversationalResponse = async (course: Course, currentHole: Hole, round: Round, playerProfile: PlayerProfile): Promise<any> => {
     // Check if the 'ai' instance was successfully created.
     if (!ai) {
      return { conversationalResponse: "JP is currently offline. The AI Caddie is not configured correctly. Please ensure the API key is set in the environment variables.", extractedData: null, audioCue: 'none' };
    }
    
    const systemInstruction = buildSystemPrompt(course, currentHole, round, playerProfile);
    const contents = round.conversation.map(msg => ({
        role: msg.sender === 'jp' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching JP's response:", error);
        return { conversationalResponse: "There was an issue contacting JP. I'm having trouble thinking right now.", extractedData: null, audioCue: 'none' };
    }
};
