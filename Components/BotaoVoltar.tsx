// Components/BotaoVoltar.tsx
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function BotaoVoltar({ style }: { style?: StyleProp<ViewStyle> }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={[styles.botao, style]}
      hitSlop={10}
      accessibilityLabel="Voltar"
      accessibilityRole="button"
    >
      <Feather name="arrow-left" size={22} color={COLORS.verde} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    padding: 6,
    marginRight: 8,
  },
});
