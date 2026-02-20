import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      onClose();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          style={[styles.modalContent, { backgroundColor: theme.colors.backgroundPrimary }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <Globe size={24} color={theme.colors.primary} weight="regular" />
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Select Language
            </Text>
          </View>

          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                { borderBottomColor: theme.colors.border }
              ]}
              onPress={() => handleLanguageChange(language.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: theme.colors.textPrimary }]}>
                  {language.nativeName}
                </Text>
                <Text style={[styles.languageSubtext, { color: theme.colors.textSecondary }]}>
                  {language.name}
                </Text>
              </View>
              {currentLanguage === language.code && (
                <Check size={20} color={theme.colors.primary} weight="bold" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageSubtext: {
    fontSize: 14,
  },
});
