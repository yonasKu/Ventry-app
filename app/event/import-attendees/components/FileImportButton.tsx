import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { FileArrowUp } from 'phosphor-react-native';

type FileImportButtonProps = {
  theme: any;
  onImportFile: () => void;
  isLoading?: boolean;
};

const FileImportButton = ({ theme, onImportFile, isLoading = false }: FileImportButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }
      ]}
      onPress={onImportFile}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <>
          <FileArrowUp size={18} color={theme.colors.primary} weight="regular" />
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
            Import CSV File
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default FileImportButton;
