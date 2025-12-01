import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { getAllEntries } from '../utils/storage';
import { useLlmInference } from 'react-native-llm-mediapipe';
import * as FileSystem from 'expo-file-system';

const MODEL_FILE_NAME = 'model.bin';

const prepareContextForAI = (entries) => {
    // Sort entries by date descending
    const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    let contextString = "";
    for (const entry of sortedEntries) {
        const entryString = `Entry (${entry.date}): ${entry.text}\n`;
        if (contextString.length + entryString.length > 4000) {
            break;
        }
        contextString += entryString;
    }
    return contextString;
};

export default function InsightsScreen() {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(false);
    const [modelPath, setModelPath] = useState('');

    const llm = useLlmInference({
        storageType: 'file',
        modelPath: modelPath,
        maxTokens: 512,
        temperature: 0.7
    });

    // Check for model file
    useEffect(() => {
        const checkModel = async () => {
            const path = FileSystem.documentDirectory + MODEL_FILE_NAME;
            const fileInfo = await FileSystem.getInfoAsync(path);
            if (fileInfo.exists) {
                setModelPath(path);
            }
        };
        checkModel();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const loadInsights = async () => {
                setLoading(true);
                try {
                    const entries = await getAllEntries();
                    const context = prepareContextForAI(entries);

                    if (!modelPath) {
                        setInsight("LLM model not found. Please download 'model.bin' to your document directory to enable AI insights.");
                        setLoading(false);
                        return;
                    }

                    if (!llm.isLoaded) {
                        // Wait a bit or show loading
                        // For now, if not loaded, we can't generate.
                        // But useLlmInference should load it if path is set.
                        // We might need to wait for isLoaded to be true.
                        // Simple retry or message for now.
                        if (modelPath) {
                            setInsight("Initializing AI engine...");
                            // If we return here, we won't generate. 
                            // Ideally we wait for isLoaded.
                            // But for this step, let's just try to generate if loaded, or wait.
                        }
                    }

                    if (llm.isLoaded) {
                        const prompt = `Analyze these journal entries and provide a health insight:\n${context}`;
                        const response = await llm.generateResponse(prompt);
                        setInsight(response);
                    } else if (modelPath) {
                        // If path exists but not loaded yet, it might load soon.
                        // For simplicity in this iteration, we'll just say initializing.
                        // A better approach would be a useEffect on llm.isLoaded to trigger generation.
                        setInsight("AI Engine is initializing. Please try again in a moment.");
                    }

                } catch (error) {
                    console.error("Failed to generate insights", error);
                    setInsight("Unable to generate insights at this time.");
                } finally {
                    setLoading(false);
                }
            };

            // Only trigger if we haven't generated yet or if we want to refresh.
            // For now, trigger on focus.
            loadInsights();
        }, [modelPath, llm.isLoaded, llm]) // Added dependencies
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>AI Insights</Text>
                <Text style={styles.description}>
                    Your personal health analysis based on your journal entries.
                </Text>

                <View style={styles.insightsContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.insightText}>{insight}</Text>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Alegreya_400Regular',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 30,
    },
    insightsContainer: {
        flex: 1,
        borderColor: '#333',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightText: {
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
        color: COLORS.text,
        textAlign: 'center',
        lineHeight: 26,
    },
});
