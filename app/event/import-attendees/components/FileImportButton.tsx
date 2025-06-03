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
        { borderColor: theme.colors.border },
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 10,
  },
});

export default FileImportButton;
