import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Linking, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { guardarRegistoReciclagem } from '@/services/firestore';

export default function LogRecyclingScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionResponse, requestPermission] = ImagePicker.useCameraPermissions();

const tabelaPontos: Record<string, number> = {
    'Plástico': 10,
    'Papel': 5,
    'Vidro': 15,
    'Metal': 20,
  };
const tabelaCO2: Record<string, number> = {
    'Plástico': 1.5,
    'Papel': 0.9,
    'Vidro': 0.3,
    'Metal': 2.5,
  };
  
  const materials = Object.keys(tabelaPontos);

  //função para abrir a câmara
  const openCamera = async () => {
    if (!permissionResponse?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        // Exceção: O utilizador não deu permissão
        Alert.alert(
          "Permissão Necessária ",
          "Precisamos de acesso à câmara para validar a tua reciclagem.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ir para Definições", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
    }

    // Cenário Normal: Abre a câmara
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Menor qualidade para o upload ser rápido
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Função de Submissão
  const handleSubmit = async () => {
    if (!selectedMaterial) {
      Alert.alert("Informação em falta", "Por favor, seleciona o tipo de material primeiro.");
      return;
    }
    if (!image) {
      Alert.alert("Foto em falta", "Por favor, tira uma foto da tua reciclagem para ganhares os pontos.");
      return;
    }

    setIsSubmitting(true);

   try {
      const pontosGanhos = tabelaPontos[selectedMaterial];
      // Invoca a arquitetura de backend
      await guardarRegistoReciclagem(image, selectedMaterial, pontosGanhos);

      Alert.alert(
        "Sucesso!",
        `Reciclagem registada com sucesso! Ganhaste +${pontosGanhos} pontos.`,
        [
          { 
            text: "Fantástico", 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error("Erro no upload:", error);
      Alert.alert("Erro", "Não foi possível guardar o registo. Confirma se tens sessão iniciada e tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registar Reciclagem</Text>

      {/* 1. Seletor de Material */}
      <Text style={styles.label}>1. O que vais reciclar?</Text>
      {/* 1.5. Input de Quantidade */}
      <Text style={styles.label}>Quantidade (em kg):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ex: 2.5"
        value={amount}
        onChangeText={setAmount}
      />
      <View style={styles.materialContainer}>
        {materials.map((material) => (
          <TouchableOpacity
            key={material}
            style={[
              styles.materialButton,
              selectedMaterial === material && styles.materialButtonSelected
            ]}
            onPress={() => setSelectedMaterial(material)}
          >
            <Text style={[
              styles.materialText,
              selectedMaterial === material && styles.materialTextSelected
            ]}>
              {material}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Botão da Câmara */}
      <Text style={styles.label}>2. Prova com uma foto!</Text>
      <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
        <Text style={styles.cameraButtonText}>
          {image ? 'Tirar Nova Foto' : 'Abrir Câmara'}
        </Text>
      </TouchableOpacity>

      {/* 3. Preview da Imagem */}
      {image && (
        <Image source={{ uri: image }} style={styles.imagePreview} />
      )}

      {/* 4. Botão de Submeter */}
      <TouchableOpacity 
        style={[styles.submitButton, (!image || !selectedMaterial || isSubmitting) && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={!image || !selectedMaterial || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            Submeter (+{selectedMaterial ? tabelaPontos[selectedMaterial] : 0} pts)
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2d3748',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#4a5568',
    marginTop: 10,
  },
  materialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  materialButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    backgroundColor: '#f7fafc',
  },
  materialButtonSelected: {
    backgroundColor: '#48bb78',
    borderColor: '#48bb78',
  },
  materialText: {
    color: '#4a5568',
    fontWeight: '500',
  },
  materialTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f7fafc',
    marginBottom: 20,
  },
  cameraButton: {
    backgroundColor: '#edf2f7',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  cameraButtonText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#38a169',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});