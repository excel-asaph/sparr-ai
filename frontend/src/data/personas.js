/**
 * @fileoverview Interviewer Personas Configuration
 * 
 * Defines available AI interviewer personas with their characteristics,
 * voice IDs for ElevenLabs integration, and supported languages.
 * 
 * @module data/personas
 */

/**
 * Available interviewer personas.
 * Each persona has unique characteristics that affect interview style.
 * 
 * @constant {Array<Object>}
 * @property {string} id - Unique persona identifier
 * @property {string} name - Display name
 * @property {string} role - Role description
 * @property {string} description - Behavioral description
 * @property {string} voiceId - ElevenLabs voice ID
 * @property {string} avatar - Avatar image URL
 * @property {Array<string>} languages - Supported language codes
 * @property {Object} [imgStyle] - Optional CSS styling for avatar
 */
export const PERSONAS = [
    {
        id: 'vibe',
        name: 'Michael',
        role: 'The "Vibe Check" Peer',
        description: 'Casual, unstructured. Wants to see if you are fun to work with.',
        voiceId: 'ljX1ZrXuDIIRVcmiVSyR',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop',
        languages: ['us']
    },
    {
        id: 'hr',
        name: 'Kelsey',
        role: 'The "Behavioral" HR',
        description: 'Warm but probing. Obsessed with "Culture Fit" and soft skills.',
        voiceId: 'YY7fzZmDizFQQv8XPAIY',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        languages: ['us']
    },
    {
        id: 'faang',
        name: 'Ellen',
        role: 'The Algo Purist',
        description: 'Cold, logical, obsessed with efficiency (Big O). Speaks 10+ languages.',
        voiceId: 'BIvP0GN1cAtSRTxNHnWS',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
        languages: ['us', 'es', 'ru', 'ro', 'sk', 'hr', 'it', 'de', 'pl', 'dk'],
        imgStyle: { objectPosition: 'center 25%', transform: 'scale(1.4)' }
    },
    {
        id: 'skeptic',
        name: 'James',
        role: 'The Skeptic Senior',
        description: 'The "Skeptical" Senior Engineer; Detects BS immediately.',
        voiceId: 'KiAVAr8isNbPP0s3etPX',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        languages: ['us']
    },
    {
        id: 'startup',
        name: 'Mark',
        role: 'The Startup Hustler',
        description: 'Impatient, pragmatic. Hates theory, wants to see you ship code.',
        voiceId: '86SOy9VyOePcRbIneYDa',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
        languages: ['us'],
        imgStyle: { objectPosition: '60% 65%', transform: 'scale(1.9)' }
    }
];

/**
 * Language code to display name mapping.
 * @constant {Object.<string, string>}
 */
export const LANGUAGE_NAMES = {
    'us': 'English', 'es': 'Spanish', 'ru': 'Russian', 'ro': 'Romanian',
    'sk': 'Slovak', 'hr': 'Croatian', 'it': 'Italian', 'de': 'German',
    'pl': 'Polish', 'dk': 'Danish'
};

/**
 * Maps flag codes to ElevenLabs language codes.
 * @constant {Object.<string, string>}
 */
export const FLAG_TO_ELEVENLABS_LANG = {
    'us': 'en', 'es': 'es', 'de': 'de', 'it': 'it',
    'ru': 'ru', 'pl': 'pl', 'ro': 'ro', 'sk': 'sk',
    'hr': 'hr', 'dk': 'da'
};
