import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    PermissionsAndroid,
    Alert,
    StyleSheet,
    Dimensions,
    NativeEventEmitter,
} from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import AudioRecorderPlayer, {
    AVEncoderAudioQualityIOSType,
    AudioEncoderAndroidType,
    AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import ImageResizer from 'react-native-image-resizer';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import RNFS from 'react-native-fs';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import file định nghĩa Native Module (cùng thư mục service/)
import NativeGenAI from '../service/NativeGenAI.ts';

// --- Constants & Types ---
const audioRecorderPlayer =  AudioRecorderPlayer;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_SIZE = 100;
const PREVIEW_POSITION = { x: 10, y: -PREVIEW_SIZE - 10 };
const TARGET_SIZE = 200;

const eventEmitter = new NativeEventEmitter(NativeGenAI as any);

type MessageType = 'text' | 'image' | 'audio';
type Message = {
    id: string;
    type: MessageType;
    content: string;
    sender: 'user' | 'ai';
    isStreaming?: boolean;
    localUri?: string;
    duration?: string;
};

// --- Helper Functions ---
const requestPermissions = async () => {
    if (Platform.OS === 'android') {
        try {
            const grants = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.CAMERA,
            ]);
            console.log('Permissions check complete', grants);
        } catch (err) {
            console.warn(err);
        }
    }
};

const processImageInBackground = (imageAsset: Asset) => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const compressedImage = await ImageResizer.createResizedImage(
                    imageAsset?.uri as string, 700, 700, 'JPEG', 70, 0, undefined, false, { mode: 'contain' }
                );
                const base64Image = await RNFS.readFile(compressedImage.uri, 'base64');
                resolve(base64Image);
            } catch (err) {
                reject(err);
            }
        }, 0);
    });
};

// --- ChatScreen Component ---
const ChatScreen = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState('0:00');
    const [isModelReady, setIsModelReady] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const flatListRef = useRef<FlatList<Message>>(null);

    const [lastMessageLayout, setLastMessageLayout] = useState<{ x: number, y: number } | null>(null);

    // Animation values
    const previewOpacity = useSharedValue(0);
    const previewScale = useSharedValue(0.8);
    const imageTranslateX = useSharedValue(0);
    const imageTranslateY = useSharedValue(0);
    const imageScale = useSharedValue(1);
    const imageOpacity = useSharedValue(1);

    // --- Effects ---
    useEffect(() => {
        requestPermissions();
        initGenAI();

        const streamDataSub = eventEmitter.addListener('onGenAIStreamData', (event: { chunk: string }) => {
            setMessages((currentMessages) => {
                const lastMessage = currentMessages[currentMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai' && lastMessage.isStreaming) {
                    return [
                        ...currentMessages.slice(0, -1),
                        { ...lastMessage, content: lastMessage.content + event.chunk },
                    ];
                }
                return currentMessages;
            });
            flatListRef.current?.scrollToEnd({ animated: false });
        });

        const streamEndSub = eventEmitter.addListener('onGenAIStreamEnd', () => {
            setIsGenerating(false);
            setMessages((currentMessages) => {
                const lastMessage = currentMessages[currentMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    return [...currentMessages.slice(0, -1), { ...lastMessage, isStreaming: false }];
                }
                return currentMessages;
            });
        });

        const streamErrorSub = eventEmitter.addListener('onGenAIStreamError', (event: { error: string }) => {
            console.error('Stream Error:', event.error);
            setIsGenerating(false);
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), type: 'text', content: `[Lỗi]: ${event.error}`, sender: 'ai' },
            ]);
        });

        return () => {
            streamDataSub.remove();
            streamEndSub.remove();
            streamErrorSub.remove();
            if (isRecording) audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            NativeGenAI.shutdown();
        };
    }, [isRecording]);

    useEffect(() => {
        if (selectedImage) {
            previewOpacity.value = withTiming(1, { duration: 200 });
            previewScale.value = withTiming(1, { duration: 200, easing: Easing.bounce });
        } else {
            previewOpacity.value = withTiming(0, { duration: 200 });
            previewScale.value = withTiming(0.8, { duration: 200 });
        }
    }, [selectedImage, previewOpacity, previewScale]);

    const initGenAI = async () => {
        try {
            console.log('Initializing GenAI Model...');
            await NativeGenAI.initModel();
            setIsModelReady(true);
            setMessages([{ id: 'intro', type: 'text', content: 'Chào bạn! Tôi là Gemma, tôi có thể giúp gì cho bạn?', sender: 'ai' }]);
        } catch (e) {
            console.error('Init failed', e);
            setMessages([{ id: 'error', type: 'text', content: 'Chưa kết nối được với AI Model.', sender: 'ai' }]);
        }
    };

    // --- Handlers ---
    const handleSelectImage = async (source: 'camera' | 'library') => {
        const options = { mediaType: 'photo' as const, includeBase64: false };
        const result = source === 'camera' ? await launchCamera(options) : await launchImageLibrary(options);

        if (result.assets && result.assets.length > 0) {
            setSelectedImage(result.assets[0]);
        }
    };

    const handleImageUpload = async (imageAsset: Asset) => {
        if (!imageAsset.uri) return;

        setIsImageProcessing(true);
        const userMsgId = Date.now().toString();
        const aiMsgId = (Date.now() + 1).toString();

        setMessages((prev) => [
            ...prev,
            { id: userMsgId, type: 'image', content: imageAsset.uri!, sender: 'user', localUri: imageAsset.uri },
        ]);

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // Animation logic
        const targetX = lastMessageLayout ? lastMessageLayout.x + SCREEN_WIDTH * 0.8 - TARGET_SIZE : SCREEN_WIDTH - TARGET_SIZE - 20;
        const targetY = lastMessageLayout ? lastMessageLayout.y : 0;

        imageTranslateX.value = withTiming(targetX - PREVIEW_POSITION.x, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        imageTranslateY.value = withTiming(targetY - PREVIEW_POSITION.y, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        imageScale.value = withTiming(TARGET_SIZE / PREVIEW_SIZE, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        imageOpacity.value = withTiming(0, { duration: 500});

        try {

            const base64Image = await processImageInBackground(imageAsset);
            setIsGenerating(true);
            setMessages((prev) => [...prev, { id: aiMsgId, type: 'text', content: '', sender: 'ai', isStreaming: true }]);
            NativeGenAI.startStreamingResponse(`[IMAGE_DATA:${base64Image}]`);

        } catch (error) {
            console.error('Image error:', error);
            Alert.alert('Lỗi', 'Không thể xử lý hình ảnh.');
        } finally {
            setIsImageProcessing(false);
            setSelectedImage(null);
            setTimeout(() => {
                imageTranslateX.value = 0;
                imageTranslateY.value = 0;
                imageScale.value = 1;
                imageOpacity.value = 1;
            }, 600);
        }
    };

    const handleStartRecording = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
        }

        setIsRecording(true);
        const path = Platform.select({
            ios: 'hello.m4a',
            android: `${RNFS.CachesDirectoryPath}/hello.mp3`,
        });

        const audioSet = {
            AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
            AudioSourceAndroid: AudioSourceAndroidType.MIC,
            AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
            AVNumberOfChannelsKeyIOS: 2,
        };

        try {
            await audioRecorderPlayer.startRecorder(path, audioSet);
            audioRecorderPlayer.addRecordBackListener((e:any) => {
                setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
            });
        } catch (error) {
            console.error("Recorder error:", error);
            setIsRecording(false);
        }
    };

    const handleStopRecording = async () => {
        if (!isRecording) return;
        try {
            const result = await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            setIsRecording(false);
            setRecordTime('0:00');
            handleAudioUpload(result);
        } catch (error) {
            console.error("Stop recorder error:", error);
        }
    };

    const handleAudioUpload = async (audioPath: string) => {
        if (!audioPath) return;
        const userMsgId = Date.now().toString();
        const aiMsgId = (Date.now() + 1).toString();

        setMessages((prev) => [
            ...prev,
            { id: userMsgId, type: 'audio', content: audioPath, sender: 'user', localUri: audioPath, duration: recordTime },
        ]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const base64Audio = await RNFS.readFile(audioPath, 'base64');
            setIsGenerating(true);
            setMessages((prev) => [...prev, { id: aiMsgId, type: 'text', content: '', sender: 'ai', isStreaming: true }]);
            NativeGenAI.startStreamingResponse(`[AUDIO_DATA:${base64Audio}]`);
        } catch (error) {
            console.error('Audio error:', error);
            Alert.alert('Lỗi', 'Không thể xử lý âm thanh.');
        }
    };

    const handlePlayAudio = async (audioPath: string) => {
        try {
            await audioRecorderPlayer.startPlayer(audioPath);
            audioRecorderPlayer.addPlayBackListener((e:any) => {
                if (e.currentPosition === e.duration) {
                    audioRecorderPlayer.stopPlayer();
                    audioRecorderPlayer.removePlayBackListener();
                }
            });
        } catch (error) {
            console.log('Play error:', error);
        }
    };

    const handleSendText = () => {
        if (inputText.trim() === '' || isGenerating || !isModelReady || isImageProcessing) return;

        if (selectedImage) {
            handleImageUpload(selectedImage);
            setInputText('');
            return;
        }

        const userMsgId = Date.now().toString();
        const aiMsgId = (Date.now() + 1).toString();
        const prompt = inputText;

        setMessages((prev) => [
            ...prev,
            { id: userMsgId, type: 'text', content: prompt, sender: 'user' },
            { id: aiMsgId, type: 'text', content: '', sender: 'ai', isStreaming: true },
        ]);

        setInputText('');
        setIsGenerating(true);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        NativeGenAI.startStreamingResponse(prompt);
    };

    // --- Rendering ---
    const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
        const isUser = item.sender === 'user';
        const isLastMessage = index === messages.length - 1;
        const onLayout = isLastMessage ? (event: any) => setLastMessageLayout(event.nativeEvent.layout) : undefined;

        return (
            <View onLayout={onLayout} style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                {item.type === 'text' && (
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                        {item.content}
                        {item.isStreaming && <Text style={styles.cursor}>▋</Text>}
                    </Text>
                )}
                {item.type === 'image' && (
                    <Image source={{ uri: item.localUri || item.content }} style={styles.messageImage} resizeMode="cover" />
                )}
                {item.type === 'audio' && (
                    <TouchableOpacity style={styles.audioContainer} onPress={() => handlePlayAudio(item.localUri || item.content)}>
                        <Ionicons name="play-circle-outline" size={30} color={isUser ? '#fff' : '#e91e63'} />
                        <Text style={[styles.audioText, isUser ? styles.userText : styles.aiText]}>
                            Audio {item.duration ? `(${item.duration})` : ''}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const previewAnimatedStyle = useAnimatedStyle(() => ({
        opacity: previewOpacity.value,
        transform: [{ scale: previewScale.value }],
    }));

    const imageAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: imageTranslateX.value },
            { translateY: imageTranslateY.value },
            { scale: imageScale.value },
        ],
        opacity: imageOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Gemma Chat</Text>
                {!isModelReady && <ActivityIndicator size="small" color="#e91e63" style={{ marginLeft: 10 }} />}
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.chatContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <View style={styles.inputContainer}>
                    {selectedImage && (
                        <Animated.View style={[styles.previewContainer, previewAnimatedStyle]}>
                            <Animated.Image source={{ uri: selectedImage.uri }} style={[styles.previewImage, imageAnimatedStyle]} resizeMode="cover" />
                            <TouchableOpacity style={styles.closePreviewButton} onPress={() => setSelectedImage(null)}>
                                <Feather name="x" size={20} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    <View style={styles.rowInput}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder={isRecording ? `Đang ghi âm... ${recordTime}` : (isModelReady ? 'Nhập tin nhắn...' : 'Đang tải model...')}
                            placeholderTextColor="#f48fb1"
                            editable={isModelReady && !isGenerating && !isRecording && !isImageProcessing}
                            onSubmitEditing={handleSendText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!isModelReady || isGenerating || isImageProcessing || (inputText.trim() === '' && !selectedImage)) && styles.disabledButton]}
                            onPress={handleSendText}
                            disabled={!isModelReady || isGenerating || isImageProcessing || (inputText.trim() === '' && !selectedImage)}
                        >
                            {isGenerating || isImageProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Feather name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fce4ec' },
    header: { paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, backgroundColor: '#f8bbd0', borderBottomWidth: 1, borderBottomColor: '#f48fb1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#880e4f' },
    chatContainer: { padding: 10, paddingBottom: 20 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 10 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#e91e63', borderBottomRightRadius: 5 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: '#f8bbd0', borderBottomLeftRadius: 5 },
    messageText: { fontSize: 16 },
    userText: { color: '#fff' },
    aiText: { color: '#880e4f' },
    messageImage: { width: TARGET_SIZE, height: TARGET_SIZE, borderRadius: 15 },
    audioContainer: { flexDirection: 'row', alignItems: 'center' },
    audioText: { marginLeft: 10, fontSize: 16 },
    cursor: { color: '#e91e63' },
    inputContainer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f48fb1', padding: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
    rowInput: { flexDirection: 'row', alignItems: 'flex-end' },
    previewContainer: { position: 'absolute', top: PREVIEW_POSITION.y, left: PREVIEW_POSITION.x, zIndex: 10 },
    previewImage: { width: PREVIEW_SIZE, height: PREVIEW_SIZE, borderRadius: 10, borderWidth: 2, borderColor: '#e91e63' },
    closePreviewButton: { position: 'absolute', top: -10, right: -10, backgroundColor: '#e91e63', borderRadius: 15, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
    inputToolbar: { flexDirection: 'row', marginBottom: 10, paddingLeft: 5 },
    toolbarButton: { marginRight: 20 },
    input: { flex: 1, backgroundColor: '#fce4ec', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, color: '#880e4f', marginRight: 10, maxHeight: 100 },
    sendButton: { backgroundColor: '#e91e63', borderRadius: 25, width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
    disabledButton: { backgroundColor: '#f48fb1' },
});

export default ChatScreen;