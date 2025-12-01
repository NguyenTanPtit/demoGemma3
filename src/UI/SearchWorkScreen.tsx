import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    Alert,
    Linking
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { database } from '../database';
import Work from '../database/model/Work';
import { workService } from '../service/WorkService';
import { storage } from '../utils/storage';
import { SearchWorkRequest, WorkEntity } from '../model/types';
import { Q } from '@nozbe/watermelondb';

// Helper to parse description
const parseDescription = (desc: string | null) => {
    if (!desc) return { info: '', phone: null, customerCode: null };

    // Simple regex to extract common fields if they follow the "Key: Value" pattern
    // Based on user example:
    // "Hiện tượng: Port kém GPON,\nMã khách hàng: t008_gftth_diemnk36,\nĐiện thoại: 0921079779,..."

    // Extract Phone (Simple regex for 10-11 digits)
    const phoneMatch = desc.match(/Điện thoại:\s*(\d+)/);
    const phone = phoneMatch ? phoneMatch[1] : null;

    // Extract Customer Code
    const codeMatch = desc.match(/Mã khách hàng:\s*([^\n,]+)/);
    const customerCode = codeMatch ? codeMatch[1] : null;

    return { info: desc, phone, customerCode };
};

const WorkItem = ({ item }: { item: WorkEntity }) => {
    const [expanded, setExpanded] = useState(false);
    const { info, phone, customerCode } = parseDescription(item.workDescription);

    // Highlight phone number logic
    const renderDescription = () => {
        if (!item.workDescription) return null;

        const textToDisplay = expanded ? item.workDescription : (item.workDescription.substring(0, 100) + '...');

        // If we found a phone number, let's split the text and highlight it
        // This is a simplified approach. Ideally we iterate over matches.
        if (phone && expanded) {
             const parts = textToDisplay.split(phone);
             return (
                 <Text style={styles.descriptionText}>
                     {parts.map((part, index) => (
                         <React.Fragment key={index}>
                             {part}
                             {index < parts.length - 1 && (
                                 <Text
                                    style={styles.phoneHighlight}
                                    onPress={() => Linking.openURL(`tel:${phone}`)}
                                 >
                                     {phone}
                                 </Text>
                             )}
                         </React.Fragment>
                     ))}
                 </Text>
             );
        }

        return <Text style={styles.descriptionText}>{textToDisplay}</Text>;
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                     <MaterialCommunityIcons name="briefcase-outline" size={24} color="#FFF" />
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.workCode}>{item.workCode}</Text>
                    <Pressable onPress={() => {}}>
                         <MaterialCommunityIcons name="dots-horizontal" size={24} color="#666" />
                    </Pressable>
                </View>
            </View>

            <View style={styles.cardBody}>
                {/* Title Section (Example: Hiện tượng...) */}
                <Text style={styles.sectionTitle}>
                    {item.workDescription?.split('\n')[0] || 'Thông tin công việc'}
                </Text>

                 {/* Customer Code if extracted */}
                {customerCode && (
                     <Text style={styles.customerCode}>
                        Mã khách hàng: <Text style={{fontWeight: 'normal'}}>{customerCode}</Text>
                     </Text>
                )}

                {/* Full Description / Content */}
                <View style={styles.descriptionContainer}>
                     {renderDescription()}
                </View>

                {/* See More Button */}
                <Pressable onPress={() => setExpanded(!expanded)} style={styles.seeMoreBtn}>
                    <Text style={styles.seeMoreText}>
                        {expanded ? 'Thu gọn' : 'Xem thêm'}
                    </Text>
                     <MaterialCommunityIcons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="red"
                    />
                </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                 <View style={styles.footerRow}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                    <Text style={styles.footerText}>{item.workCreatedDate || 'N/A'}</Text>
                 </View>
                 <View style={styles.footerRow}>
                    <MaterialCommunityIcons name="eye-outline" size={16} color="#666" />
                    <Text style={styles.footerText}>{item.workStatusName}</Text>
                 </View>
            </View>

             <View style={styles.staffRow}>
                <MaterialCommunityIcons name="account-circle" size={20} color="#999" />
                <Text style={styles.staffName}>{item.workStaffName}</Text>
            </View>
        </View>
    );
};

const SearchWorkScreen = () => {
    const navigation = useNavigation();
    const [workList, setWorkList] = useState<WorkEntity[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        setLoading(true);
        try {
            // 1. Check Token
            let token = await storage.getToken();
            if (!token) {
                console.log("Token missing, fetching...");
                const res = await workService.getTokenByUserName('tannv5');
                if (res.status === 'success' && res.data) {
                    await storage.setToken(res.data);
                }
            }

            // 2. Check Local DB
            const worksCollection = database.collections.get<Work>('works');
            const localWorks = await worksCollection.query().fetch();

            if (localWorks.length > 0) {
                console.log(`Loaded ${localWorks.length} works from Local DB`);
                const parsedWorks = localWorks.map(w => JSON.parse(w.jsonContent) as WorkEntity);
                setWorkList(parsedWorks);
            } else {
                console.log("Local DB empty, syncing...");
                await fetchAndSync();
            }
        } catch (error) {
            console.error("Initialization error:", error);
            Alert.alert("Error", "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAndSync = async () => {
        setLoading(true);
        try {
            const request: SearchWorkRequest = {
                listDepartmentId: [],
                workTypesMappingWO: [],
                pageIndex: 1,
                pageSize: 200,
                searchDateFrom: "2025-05-03",
                searchDateTo: "2025-12-02",
                searchDateType: "CREATED_DATE",
                userHandles: ["act_d00184215"],
                woCdGroupIds: [],
                workCusInfo: "",
                workStatuses: ["1", "2", "3", "4", "5", "6", "8", "9", "10", "11"]
            };

            const response = await workService.searchWork(101036, request);

            if (response.status === 'success' && response.data && response.data.workList) {
                const list = response.data.workList;

                // 1. Update UI immediately
                setWorkList(list);

                // 2. Sync to DB (Background)
                saveToDb(list);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            Alert.alert("Error", "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const saveToDb = async (list: WorkEntity[]) => {
        try {
             await database.write(async () => {
                const worksCollection = database.collections.get<Work>('works');

                // Clear old data? Or Upsert? Strategy: Clear all and insert new for simplicity of "Sync list"
                // Ideally, we compare IDs, but simpler approach requested: "sync save list"

                // Note: WatermelonDB direct delete of all records can be heavy.
                // Let's use unsafeResetDatabase if strictly replacing, but better to just delete works.
                const allWorks = await worksCollection.query().fetch();
                const worksToDelete = allWorks.map(work => work.prepareDestroyPermanently());

                const worksToCreate = list.map(item =>
                    worksCollection.prepareCreate(work => {
                        work.workId = item.workId || 0;
                        work.workCode = item.workCode || '';
                        work.workDescription = item.workDescription || '';
                        work.workStatusName = item.workStatusName || '';
                        work.workStaffName = item.workStaffName || '';
                        work.workCreatedDate = item.workCreatedDate || '';
                        work.jsonContent = JSON.stringify(item);
                    })
                );

                await database.batch(...worksToDelete, ...worksToCreate);
             });
             console.log("Synced to Local DB successfully");
        } catch (e) {
            console.error("DB Sync error", e);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
                </Pressable>
                <Text style={styles.headerTitle}>Search Work</Text>
                <Pressable onPress={fetchAndSync} style={styles.syncButton}>
                     <MaterialCommunityIcons name="sync" size={24} color="#007BFF" />
                </Pressable>
            </View>

            {loading && <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />}

            <FlatList
                data={workList}
                keyExtractor={(item, index) => item.workId?.toString() || index.toString()}
                renderItem={({ item }) => <WorkItem item={item} />}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        elevation: 2,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
        color: '#333',
    },
    syncButton: {
        padding: 4,
    },
    loader: {
        marginVertical: 10,
    },
    listContent: {
        padding: 16,
    },
    // Card Styles
    card: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 16,
        padding: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000', // Black icon bg from screenshot
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workCode: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    cardBody: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    customerCode: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    descriptionContainer: {
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    phoneHighlight: {
        color: 'red',
        textDecorationLine: 'underline',
        fontWeight: 'bold',
    },
    seeMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    seeMoreText: {
        color: '#007BFF',
        fontSize: 14,
        marginRight: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    staffRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    staffName: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
});

export default SearchWorkScreen;
