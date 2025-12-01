import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { getAllEntries } from '../utils/storage';
import { useLlmInference } from 'react-native-llm-mediapipe';
import * as FileSystem from 'expo-file-system';

const MODEL_FILE_NAME = 'model.bin';
const MODEL_URL = 'https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma-1.1-2b-it-int4.bin';

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
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const llm = useLlmInference({
        storageType: 'file',
        modelPath: modelPath,
        maxTokens: 512,
        temperature: 0.7
    });

    // Check for model file
    const checkModel = async () => {
        const path = FileSystem.documentDirectory + MODEL_FILE_NAME;
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
            setModelPath(path);
        } else {
            setModelPath('');
        }
    };

    useEffect(() => {
        checkModel();
    }, []);

    const downloadModel = async () => {
        setIsDownloading(true);
        const path = FileSystem.documentDirectory + MODEL_FILE_NAME;

        try {
            const downloadResumable = FileSystem.createDownloadResumable(
                MODEL_URL,
                path,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    setDownloadProgress(progress);
                }
            );

            const result = await downloadResumable.downloadAsync();
            if (result) {
                setModelPath(path);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDownloading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const loadInsights = async () => {
                if (!modelPath) return; // Don't try to load if no model

                setLoading(true);
                try {
                    const entries = await getAllEntries();
                    const context = prepareContextForAI(entries);

                    if (!llm.isLoaded) {
                        // Wait a bit or show loading
                        if (modelPath) {
                            setInsight("Initializing AI engine...");
                        }
                    }

                    if (llm.isLoaded) {
                        const prompt = "You are an empathetic and analytical Health Analyst. Your goal is to help the user understand their physical and mental well-being based on their journal entries. Look for patterns in energy, sleep, and mood. Be supportive but objective. Here are the entries:\n" + context;
                        const response = await llm.generateResponse(prompt);
                        setInsight(response);
                    } else if (modelPath) {
                        setInsight("AI Engine is initializing. Please try again in a moment.");
                    }

                } catch (error) {
                    console.error("Failed to generate insights", error);
                    setInsight("Unable to generate insights at this time.");
                } finally {
                    setLoading(false);
                }
            };

            loadInsights();
        }, [modelPath, llm.isLoaded, llm])
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>AI Insights</Text>
                <Text style={styles.description}>
                    Your personal health analysis based on your journal entries.
                </Text>

                <View style={styles.insightsContainer}>
                    {!modelPath ? (
                        <View style={styles.downloadContainer}>
                            {isDownloading ? (
                                <View style={styles.progressContainer}>
                                    <ActivityIndicator size="large" color="#FFFFFF" />
                                    <Text style={styles.progressText}>
                                        Downloading AI Model... {Math.round(downloadProgress * 100)}%
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.downloadButton} onPress={downloadModel}>
                                    <Text style={styles.downloadButtonText}>Download AI Model (1.3GB)</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : loading ? (
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
    downloadContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadButton: {
        backgroundColor: '#333',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#555',
    },
    downloadButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Alegreya_400Regular',
    },
    progressContainer: {
        alignItems: 'center',
    },
    progressText: {
        color: '#FFF',
        marginTop: 10,
        fontSize: 16,
        fontFamily: 'Alegreya_400Regular',
    },
});
