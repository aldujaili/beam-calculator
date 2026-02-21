import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';

type ChecklistStatus = 'Satisfactory' | 'Monitor' | 'Defect - Action Required';

type InspectionItem = {
  id: string;
  label: string;
  notes: string;
  status: ChecklistStatus;
  photoUri: string;
};

type ClientInfo = {
  clientName: string;
  propertyAddress: string;
  inspectionDate: string;
  engineerName: string;
  registrationNumber: string;
};

const STORAGE_KEY = 'waInspectionDraft.v1';

const checklistTemplate: Omit<InspectionItem, 'notes' | 'status' | 'photoUri'>[] = [
  { id: 'foundations', label: 'Foundations and footings' },
  { id: 'framing', label: 'Structural framing members' },
  { id: 'walls', label: 'Load-bearing and retaining walls' },
  { id: 'roof', label: 'Roof structure and trusses' },
  { id: 'concrete', label: 'Concrete slabs, driveways, and paths' },
  { id: 'balconies', label: 'Balconies, decks, and external stairs' },
  { id: 'drainage', label: 'Subfloor/site drainage impacts on structure' },
  { id: 'movement', label: 'Evidence of movement, cracking, and settlement' },
];

const defaultClientInfo: ClientInfo = {
  clientName: '',
  propertyAddress: '',
  inspectionDate: new Date().toISOString().slice(0, 10),
  engineerName: '',
  registrationNumber: '',
};

const buildDefaultChecklist = (): InspectionItem[] =>
  checklistTemplate.map((item) => ({
    ...item,
    notes: '',
    status: 'Satisfactory',
    photoUri: '',
  }));

const as43491ScopeNotes = [
  'Inspection is visual and non-invasive in accordance with the intent of AS 4349.1 pre-purchase reporting methodology.',
  'Concealed defects, inaccessible areas, and latent conditions are excluded unless specifically stated otherwise.',
  'Defect severity ratings indicate observed risk at time of inspection and do not replace specialist destructive testing.',
  'Recommendations should be actioned by suitably qualified WA-registered trade contractors and reviewed by the reporting engineer where required.',
];

export default function App() {
  const [clientInfo, setClientInfo] = useState<ClientInfo>(defaultClientInfo);
  const [checklist, setChecklist] = useState<InspectionItem[]>(buildDefaultChecklist());
  const [generalNotes, setGeneralNotes] = useState('');

  const updateClient = (field: keyof ClientInfo, value: string) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
  };

  const updateChecklist = (id: string, updates: Partial<InspectionItem>) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const capturePhoto = async (id: string) => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      Alert.alert('Permission required', 'Camera permission is required to capture defect evidence.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      updateChecklist(id, { photoUri: result.assets[0].uri });
    }
  };

  const saveDraft = async () => {
    try {
      const payload = { clientInfo, checklist, generalNotes };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      Alert.alert('Saved', 'Inspection draft saved locally on this device.');
    } catch (error) {
      Alert.alert('Save failed', 'Unable to save inspection draft.');
    }
  };

  const loadDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        Alert.alert('No draft', 'No saved inspection draft was found on this device.');
        return;
      }
      const parsed = JSON.parse(raw);
      setClientInfo(parsed.clientInfo ?? defaultClientInfo);
      setChecklist(parsed.checklist ?? buildDefaultChecklist());
      setGeneralNotes(parsed.generalNotes ?? '');
      Alert.alert('Loaded', 'Inspection draft restored from local storage.');
    } catch (error) {
      Alert.alert('Load failed', 'Unable to load saved inspection draft.');
    }
  };

  const report = useMemo(() => {
    const lines = [
      'WA STRUCTURAL HOUSE INSPECTION REPORT',
      '-------------------------------------',
      `Client: ${clientInfo.clientName || 'N/A'}`,
      `Property: ${clientInfo.propertyAddress || 'N/A'}`,
      `Inspection Date: ${clientInfo.inspectionDate || 'N/A'}`,
      `Engineer: ${clientInfo.engineerName || 'N/A'} (${clientInfo.registrationNumber || 'N/A'})`,
      '',
      'CHECKLIST SUMMARY',
    ];

    checklist.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.label}`);
      lines.push(`   Status: ${item.status}`);
      lines.push(`   Notes: ${item.notes || 'Nil observed defects recorded.'}`);
      lines.push(`   Photo captured: ${item.photoUri ? 'Yes' : 'No'}`);
    });

    lines.push('', 'GENERAL NOTES', generalNotes || 'None provided.', '', 'AS 4349.1 STYLE SCOPE NOTES');
    as43491ScopeNotes.forEach((note, i) => lines.push(`${i + 1}. ${note}`));

    return lines.join('\n');
  }, [checklist, clientInfo, generalNotes]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>WA Structural House Inspection</Text>
        <Text style={styles.subtitle}>For WA engineer site use with AS 4349.1-style scope framing</Text>

        <SectionTitle label="Client & Inspection Details" />
        <Field label="Client name" value={clientInfo.clientName} onChangeText={(v) => updateClient('clientName', v)} />
        <Field
          label="Property address"
          value={clientInfo.propertyAddress}
          onChangeText={(v) => updateClient('propertyAddress', v)}
        />
        <Field
          label="Inspection date (YYYY-MM-DD)"
          value={clientInfo.inspectionDate}
          onChangeText={(v) => updateClient('inspectionDate', v)}
        />
        <Field label="Engineer name" value={clientInfo.engineerName} onChangeText={(v) => updateClient('engineerName', v)} />
        <Field
          label="WA registration number"
          value={clientInfo.registrationNumber}
          onChangeText={(v) => updateClient('registrationNumber', v)}
        />

        <SectionTitle label="8-Item Structural Checklist" />
        {checklist.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <View style={styles.statusRow}>
              {(['Satisfactory', 'Monitor', 'Defect - Action Required'] as ChecklistStatus[]).map((statusOption) => (
                <TouchableOpacity
                  key={statusOption}
                  style={[styles.chip, item.status === statusOption && styles.chipActive]}
                  onPress={() => updateChecklist(item.id, { status: statusOption })}
                >
                  <Text style={[styles.chipText, item.status === statusOption && styles.chipTextActive]}>{statusOption}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field
              label="Defect notes"
              value={item.notes}
              multiline
              onChangeText={(v) => updateChecklist(item.id, { notes: v })}
            />

            <TouchableOpacity style={styles.photoBtn} onPress={() => capturePhoto(item.id)}>
              <Text style={styles.photoBtnText}>{item.photoUri ? 'Retake item photo' : 'Capture item photo'}</Text>
            </TouchableOpacity>
            {item.photoUri ? <Image source={{ uri: item.photoUri }} style={styles.photoPreview} /> : null}
          </View>
        ))}

        <SectionTitle label="General Observations" />
        <Field label="Notes" value={generalNotes} multiline onChangeText={setGeneralNotes} />

        <SectionTitle label="AS 4349.1-Style Scope Notes" />
        {as43491ScopeNotes.map((note, index) => (
          <Text key={note} style={styles.scopeNote}>{`${index + 1}. ${note}`}</Text>
        ))}

        <View style={styles.buttonRow}>
          <PrimaryButton label="Save Draft" onPress={saveDraft} />
          <PrimaryButton label="Load Draft" onPress={loadDraft} />
        </View>

        <SectionTitle label="Generated Text Report" />
        <Text selectable style={styles.reportText}>
          {report}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
        placeholder={label}
        placeholderTextColor="#6b7280"
      />
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 4, marginBottom: 12, color: '#374151' },
  sectionTitle: { marginTop: 14, marginBottom: 8, fontSize: 18, fontWeight: '700', color: '#1f2937' },
  fieldWrap: { marginBottom: 10 },
  label: { marginBottom: 6, color: '#111827', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8, color: '#111827' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
  },
  chipActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { color: '#1e3a8a', fontSize: 12 },
  chipTextActive: { color: '#fff' },
  photoBtn: {
    marginTop: 6,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  photoBtnText: { color: '#fff', fontWeight: '600' },
  photoPreview: { marginTop: 8, width: '100%', height: 180, borderRadius: 10 },
  scopeNote: { marginBottom: 6, color: '#374151' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  reportText: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    color: '#111827',
    lineHeight: 20,
    fontFamily: 'Courier',
  },
});
