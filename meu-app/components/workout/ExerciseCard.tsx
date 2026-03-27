import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseWeightForInput, formatWeightDisplay } from '@/utils';

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number | string;
  weight?: string | number | null;
  rest_seconds?: number;
  description?: string;
  image_url?: string;
  video_url?: string;
};

type ExerciseCardProps = {
  exercise: Exercise;
  index: number;
  onComplete: (exercise: Exercise) => void;
  isCompleted: boolean;
  hideCompleteButton?: boolean;
  weightOverride?: string | number | null;
  onWeightChange?: (exerciseId: string, value: string | null) => void;
};

export default function ExerciseCard({
  exercise,
  index,
  onComplete,
  isCompleted,
  hideCompleteButton = false,
  weightOverride,
  onWeightChange,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const rawWeight =
    weightOverride !== undefined ? weightOverride : exercise.weight;
  const displayWeight = formatWeightDisplay(rawWeight);
  const canEditWeight = typeof onWeightChange === 'function';

  const openVideo = () => {
    if (exercise.video_url) {
      Linking.openURL(exercise.video_url);
    }
    setVideoOpen(false);
  };

  return (
    <>
      <View
        style={[
          styles.card,
          isCompleted ? styles.cardCompleted : styles.cardDefault,
        ]}
      >
        {/* Image/Video Section */}
        <View style={styles.imageSection}>
          {exercise.image_url ? (
            <Image
              source={{ uri: exercise.image_url }}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="barbell-outline" size={64} color="#3f3f46" />
            </View>
          )}

          {exercise.video_url && (
            <Pressable
              onPress={() => setVideoOpen(true)}
              style={({ pressed }) => [
                styles.videoOverlay,
                pressed && styles.videoOverlayPressed,
              ]}
            >
              <View style={styles.playButton}>
                <Ionicons name="play" size={32} color="#fff" />
              </View>
            </Pressable>
          )}

          <View style={styles.badgeNumber}>
            <Text style={styles.badgeNumberText}>#{index + 1}</Text>
          </View>

          {isCompleted && (
            <View style={styles.badgeCompleted}>
              <Ionicons name="checkmark" size={16} color="#000" />
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons
                name="repeat-outline"
                size={16}
                color="#eab308"
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>Séries</Text>
              <Text style={styles.statValue}>{exercise.sets}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.repLabel}>REP</Text>
              <Text style={styles.statLabel}>Repetições</Text>
              <Text style={styles.statValue}>{exercise.reps}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.statBox,
                canEditWeight && pressed && styles.statBoxPressed,
              ]}
              onPress={
                canEditWeight
                  ? () => {
                      setWeightInput(
                        parseWeightForInput(weightOverride ?? exercise.weight)
                      );
                      setWeightDialogOpen(true);
                    }
                  : undefined
              }
            >
              <Ionicons
                name="barbell-outline"
                size={16}
                color="#eab308"
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>Carga</Text>
              <View style={styles.weightRow}>
                <Text style={styles.statValue}>{displayWeight}</Text>
                {canEditWeight && (
                  <Ionicons
                    name="pencil"
                    size={14}
                    color="#71717a"
                    style={styles.editIcon}
                  />
                )}
              </View>
            </Pressable>
          </View>

          {exercise.rest_seconds && (
            <View style={styles.restRow}>
              <Ionicons name="time-outline" size={16} color="#a1a1aa" />
              <Text style={styles.restText}>
                Descanso: {exercise.rest_seconds}s entre séries
              </Text>
            </View>
          )}

          {exercise.description && (
            <Pressable
              onPress={() => setExpanded(!expanded)}
              style={styles.descriptionToggle}
            >
              {expanded ? (
                <Ionicons name="chevron-up" size={16} color="#eab308" />
              ) : (
                <Ionicons name="chevron-down" size={16} color="#eab308" />
              )}
              <Text style={styles.descriptionToggleText}>
                {expanded ? 'Ocultar instruções' : 'Ver instruções'}
              </Text>
            </Pressable>
          )}

          {expanded && exercise.description && (
            <Text style={styles.description}>{exercise.description}</Text>
          )}

          {!hideCompleteButton && (
            <Pressable
              onPress={() => onComplete(exercise)}
              style={({ pressed }) => [
                styles.completeButton,
                isCompleted ? styles.completeButtonDone : styles.completeButtonDefault,
                pressed && styles.completeButtonPressed,
              ]}
            >
              {isCompleted ? (
                <>
                  <Ionicons name="checkmark" size={20} color="#eab308" />
                  <Text style={styles.completeButtonTextDone}>Concluído</Text>
                </>
              ) : (
                <Text style={styles.completeButtonText}>Marcar como concluído</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Weight Edit Modal */}
      <Modal
        visible={weightDialogOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWeightDialogOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setWeightDialogOpen(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Carga — {exercise.name}</Text>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Carga (kg)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 30"
                  placeholderTextColor="#71717a"
                  value={weightInput}
                  onChangeText={setWeightInput}
                />
                <Text style={styles.kgLabel}>kg</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                const value = weightInput.trim();
                onWeightChange?.(exercise.id, value || null);
                setWeightDialogOpen(false);
              }}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
              ]}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Video Modal - opens external URL */}
      <Modal
        visible={videoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setVideoOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setVideoOpen(false)}
        >
          <Pressable
            style={styles.videoModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              onPress={() => setVideoOpen(false)}
              style={styles.closeVideoButton}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
            <Text style={styles.videoModalTitle}>
              {exercise.name} - Vídeo
            </Text>
            {exercise.video_url && (
              <Pressable
                onPress={openVideo}
                style={({ pressed }) => [
                  styles.openVideoButton,
                  pressed && styles.openVideoButtonPressed,
                ]}
              >
                <Ionicons name="play-circle" size={48} color="#eab308" />
                <Text style={styles.openVideoText}>
                  Abrir vídeo no navegador
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardDefault: {
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderColor: '#27272a',
  },
  cardCompleted: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  imageSection: {
    height: 192,
    backgroundColor: '#27272a',
    overflow: 'hidden',
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  videoOverlayPressed: {
    opacity: 0.8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeNumber: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  badgeNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeCompleted: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#eab308',
  },
  content: {
    padding: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statBoxPressed: {
    backgroundColor: 'rgba(63, 63, 70, 0.5)',
  },
  statIcon: {
    marginBottom: 4,
  },
  repLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#eab308',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editIcon: {
    marginLeft: 2,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  restText: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  descriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  descriptionToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#eab308',
  },
  description: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 12,
    lineHeight: 22,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonDefault: {
    backgroundColor: '#eab308',
  },
  completeButtonDone: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  completeButtonPressed: {
    opacity: 0.9,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  completeButtonTextDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#eab308',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  kgLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#a1a1aa',
  },
  saveButton: {
    backgroundColor: '#eab308',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  videoModalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
    alignItems: 'center',
  },
  closeVideoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  videoModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  openVideoButton: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  openVideoButtonPressed: {
    opacity: 0.9,
  },
  openVideoText: {
    fontSize: 16,
    color: '#eab308',
  },
});
