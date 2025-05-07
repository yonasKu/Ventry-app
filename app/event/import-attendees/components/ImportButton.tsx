import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Upload } from 'phosphor-react-native';

type ImportButtonProps = {
  parsedAttendees: {
    isValid: boolean;
  }[];
  isImporting: boolean;
  handleImport: () => void;
  theme: any;
};

const ImportButton = ({ parsedAttendees, isImporting, handleImport, theme }: ImportButtonProps) => {
  const validAttendees = parsedAttendees.filter(a => a.isValid);
  const disabled = validAttendees.length === 0 || isImporting;
  
  return (
    <TouchableOpacity
      style={[
        styles.importButton,
        { backgroundColor: theme.colors.primary },
        disabled && styles.disabledButton
      ]}
      onPress={handleImport}
      disabled={disabled}
    >
      {isImporting ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Upload size={20} color="#fff" weight="bold" />
          <Text style={styles.importButtonText}>
            Import {validAttendees.length} Attendees
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ImportButton;
