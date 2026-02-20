import { StyleSheet, TouchableOpacity, Switch, Text, View } from 'react-native';
import { useState } from 'react';
import { CaretRight, PencilSimple, Trash, Globe } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function AccountScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [pinProtection, setPinProtection] = useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
    };
    return languages[code] || code;
  };

  // In a real app, this would come from local storage
  const userData = {
    name: 'James Wilson',
    organization: 'Creative Events Agency',
    storageUsed: '2.4 MB',
    events: 3,
    attendees: 88,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t('account.settings')}</Text>
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>{userData.name}</Text>
          <Text style={[styles.userOrg, { color: theme.colors.textSecondary }]}>{userData.organization}</Text>
        </View>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.border }]}>
          <View style={styles.editButtonContent}>
            <PencilSimple size={16} color={theme.colors.textSecondary} weight="regular" />
            <Text style={[styles.editButtonText, { color: theme.colors.textSecondary }]}>{t('common.edit')} {t('account.settings')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t('account.settings')}</Text>
        <TouchableOpacity 
          style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
          onPress={() => setShowLanguageSelector(true)}
        >
          <View style={styles.settingTextContainer}>
            <View style={styles.settingLabelRow}>
              <Globe size={16} color={theme.colors.textSecondary} weight="regular" />
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary, marginLeft: 8 }]}>{t('account.language')}</Text>
            </View>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              {getLanguageName(i18n.language)}
            </Text>
          </View>
          <CaretRight size={16} color={theme.colors.textTertiary} weight="regular" />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t('account.security')}</Text>
        <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>{t('account.pinProtection')}</Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>{t('account.pinDescription')}</Text>
          </View>
          <Switch
            value={pinProtection}
            onValueChange={setPinProtection}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={pinProtection ? theme.colors.primary : '#f4f3f4'}
          />
        </View>
        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Change PIN</Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Update your security PIN</Text>
          </View>
          <CaretRight size={16} color={theme.colors.textTertiary} weight="regular" />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Storage Usage</Text>
        <View style={styles.storageInfo}>
          <View style={[styles.storageRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.storageLabel, { color: theme.colors.textSecondary }]}>{t('events.title')}:</Text>
            <Text style={[styles.storageValue, { color: theme.colors.textPrimary }]}>{userData.events}</Text>
          </View>
          <View style={[styles.storageRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.storageLabel, { color: theme.colors.textSecondary }]}>{t('attendees.title')}:</Text>
            <Text style={[styles.storageValue, { color: theme.colors.textPrimary }]}>{userData.attendees}</Text>
          </View>
          <View style={[styles.storageRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.storageLabel, { color: theme.colors.textSecondary }]}>Used:</Text>
            <Text style={[styles.storageValue, { color: theme.colors.textPrimary }]}>{userData.storageUsed}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.backgroundPrimary }, theme.shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Data Cleanup</Text>
        <TouchableOpacity style={[styles.cleanupButton, { backgroundColor: theme.colors.error + '15' }]}>
          <View style={styles.cleanupButtonContent}>
            <Trash size={16} color={theme.colors.error} weight="regular" />
            <Text style={[styles.cleanupButtonText, { color: theme.colors.error }]}>Remove Old Events</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.cleanupDescription, { color: theme.colors.textTertiary }]}>
          Delete events that are more than 30 days old to free up storage space
        </Text>
      </View>

      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>{t('common.appName')} {t('account.version')} 1.0.0</Text>
        <Text style={[styles.offlineText, { color: theme.colors.textTertiary }]}>{t('account.offlineMode')}</Text>
      </View>

      <LanguageSelector 
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 10,
    marginBottom: 20,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileInfo: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userOrg: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    padding: 10,
    borderRadius: 6,
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  storageInfo: {
    marginTop: 5,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  storageLabel: {
    fontSize: 15,
  },
  storageValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  cleanupButton: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  cleanupButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cleanupButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cleanupDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    fontSize: 14,
  },
  offlineText: {
    fontSize: 12,
    marginTop: 2,
  },
});

