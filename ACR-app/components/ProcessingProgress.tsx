import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';

interface ProcessingProgressProps {
  toProcess: number;
  processed: number;
  isDarkMode?: boolean;
}

/**
 * 録音データ処理の進捗を表示するコンポーネント
 */
export default function ProcessingProgress({ toProcess, processed, isDarkMode = false }: ProcessingProgressProps) {
  // 進捗率を計算（0.0～1.0）
  const progress = toProcess > 0 ? processed / toProcess : 0;
  
  // 進捗率をパーセント表示に変換
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
        録音データ処理中
      </Text>
      
      <View style={styles.progressContainer}>
        <ProgressBar 
          progress={progress} 
          color="#03A9F4"
          style={styles.progressBar}
        />
        <Text style={[styles.progressText, { color: isDarkMode ? '#BBBBBB' : '#757575' }]}>
          {progressPercent}% 完了 ({processed}/{toProcess})
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    margin: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'right',
  },
}); 